/* POST /api/stripe-webhook ← Stripe avisa de los pagos y de los cambios en las suscripciones.
   Es el único sitio que pone o quita el Pro: escribe users/{uid}.plan = "pro" | "free" en Firestore.

   La cuenta de Stripe la comparte Work IA y a este webhook le llegan también sus eventos:
   solo se tocan las suscripciones de Career Board (metadata app=career-board o el precio de Career Board Pro).
   Todo lo demás se responde con 200 y se ignora. */
const { APP, firebase, stripe, send } = require('./_lib');

const readRaw = req => new Promise((ok, ko) => {
  const chunks = [];
  req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c) : c));
  req.on('end', () => ok(Buffer.concat(chunks)));
  req.on('error', ko);
});

const PRO_STATUS = ['active', 'trialing', 'past_due']; /* past_due: Stripe está reintentando el cobro */

const isOurs = sub =>
  (sub.metadata && sub.metadata.app === APP) ||
  (sub.items && sub.items.data || []).some(i => i.price && i.price.id === process.env.STRIPE_PRICE_ID);

async function applySubscription(subId, uidHint) {
  /* siempre el estado actual de Stripe (los avisos pueden llegar desordenados) */
  const sub = await stripe().subscriptions.retrieve(subId);
  if (!isOurs(sub)) return 'no es de Career Board';
  const uid = (sub.metadata && sub.metadata.firebaseUid) || uidHint;
  if (!uid) return 'sin usuario';
  const { db, FieldValue } = firebase();
  const item = sub.items && sub.items.data && sub.items.data[0];
  const end = (item && item.current_period_end) || sub.current_period_end || null;
  await db.collection('users').doc(uid).set({
    plan: PRO_STATUS.includes(sub.status) ? 'pro' : 'free',
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    subscriptionId: sub.id,
    subStatus: sub.status,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    currentPeriodEnd: end ? new Date(end * 1000) : null,
    planUpdatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return `${uid}: ${sub.status}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  let event;
  try {
    const raw = await readRaw(req);
    event = stripe().webhooks.constructEvent(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('webhook: firma no válida', e && e.message);
    return send(res, 400, { error: 'Firma no válida' });
  }
  try {
    const o = event.data.object;
    let r = 'ignorado';
    if (event.type === 'checkout.session.completed') {
      if (o.mode === 'subscription' && o.subscription && (!o.metadata || !o.metadata.app || o.metadata.app === APP))
        r = await applySubscription(typeof o.subscription === 'string' ? o.subscription : o.subscription.id, o.client_reference_id);
    } else if (event.type.startsWith('customer.subscription.')) {
      r = await applySubscription(o.id);
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const subId = o.subscription || (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription);
      if (subId) r = await applySubscription(typeof subId === 'string' ? subId : subId.id);
    }
    console.log('webhook', event.type, r);
    return send(res, 200, { received: true });
  } catch (e) {
    console.error('webhook', event.type, e && e.message);
    return send(res, 500, { error: 'No se ha podido procesar' }); /* Stripe lo reintentará */
  }
};

/* el cuerpo tiene que llegar tal cual para comprobar la firma de Stripe */
module.exports.config = { api: { bodyParser: false } };
