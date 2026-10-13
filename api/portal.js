/* POST /api/portal → { url } del portal de cliente de Stripe: cambiar la tarjeta, ver facturas o cancelar el Pro. */
const { firebase, stripe, cors, appUrl, currentUser, send, portalConfig } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT)
      return send(res, 503, { error: 'Los pagos aún no están activados' });
    const user = await currentUser(req);
    const { db } = firebase();
    const data = (await db.collection('users').doc(user.uid).get()).data() || {};
    if (!data.stripeCustomerId) return send(res, 404, { error: 'No tienes ninguna suscripción' });
    const p = await stripe().billingPortal.sessions.create({ customer: data.stripeCustomerId, return_url: appUrl(req), locale: 'es', ...portalConfig() });
    return send(res, 200, { url: p.url });
  } catch (e) {
    console.error('portal', e && e.message);
    return send(res, e.status || 500, { error: e.status === 401 ? 'Vuelve a entrar con Google' : 'No se ha podido abrir la gestión de tu suscripción' });
  }
};
