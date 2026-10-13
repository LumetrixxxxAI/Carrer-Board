/* POST /api/checkout → { url } de la página de pago de Stripe para hacerse Pro (3,99 € al mes).
   Si ya tiene una suscripción en marcha, devuelve el portal de cliente en su lugar (para no pagar dos veces). */
const { APP, firebase, stripe, cors, appUrl, currentUser, send, portalConfig } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  try {
    if (!process.env.STRIPE_PRICE_ID || !process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT)
      return send(res, 503, { error: 'Los pagos aún no están activados' });
    const user = await currentUser(req);
    const { db } = firebase();
    const ref = db.collection('users').doc(user.uid);
    const data = (await ref.get()).data() || {};
    const s = stripe();
    const back = appUrl(req);

    /* ya es Pro con una suscripción viva: al portal para gestionarla */
    if (data.subscriptionId && ['active', 'trialing', 'past_due'].includes(data.subStatus)) {
      const p = await s.billingPortal.sessions.create({ customer: data.stripeCustomerId, return_url: back, locale: 'es', ...portalConfig() });
      return send(res, 200, { url: p.url, portal: true });
    }

    /* cliente de Stripe propio de Career Board (no se reutilizan los de otras apps de la misma cuenta) */
    let customer = data.stripeCustomerId;
    if (!customer) {
      const c = await s.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        preferred_locales: ['es'],
        metadata: { app: APP, firebaseUid: user.uid }
      });
      customer = c.id;
      await ref.set({ stripeCustomerId: customer }, { merge: true });
    }

    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.uid,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: { metadata: { app: APP, firebaseUid: user.uid } },
      metadata: { app: APP, firebaseUid: user.uid },
      allow_promotion_codes: true,
      locale: 'es',
      success_url: back + '?pago=ok',
      cancel_url: back + '?pago=cancelado'
    });
    return send(res, 200, { url: session.url });
  } catch (e) {
    console.error('checkout', e && e.message);
    return send(res, e.status || 500, { error: e.status === 401 ? 'Vuelve a entrar con Google' : 'No se ha podido abrir el pago' });
  }
};
