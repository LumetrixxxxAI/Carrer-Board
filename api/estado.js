/* GET /api/estado → comprueba que los pagos están bien configurados, sin enseñar ninguna clave:
   variables puestas, clave de Stripe válida (y si es real o de prueba), el precio de Career Board Pro
   y que la cuenta de servicio de Firebase puede leer Firestore. */
const { firebase, stripe, send } = require('./_lib');

module.exports = async (req, res) => {
  const out = {
    variables: {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_'),
      FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || null
    }
  };
  const k = process.env.STRIPE_SECRET_KEY || '';
  out.stripeModo = k.includes('_live_') ? 'real' : k.includes('_test_') ? 'prueba' : 'desconocido';
  try {
    const p = await stripe().prices.retrieve(process.env.STRIPE_PRICE_ID, { expand: ['product'] });
    out.precio = { ok: true, producto: p.product && p.product.name, importe: p.unit_amount / 100, moneda: p.currency, cada: p.recurring && p.recurring.interval, activo: p.active };
  } catch (e) { out.precio = { ok: false, error: e && e.message }; }
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    out.firebaseProyecto = sa.project_id || null;
    await firebase().db.collection('users').doc('_comprobacion').get();
    out.firestore = { ok: true };
  } catch (e) { out.firestore = { ok: false, error: e && e.message }; }
  out.todoBien = !!(out.variables.STRIPE_SECRET_KEY && out.variables.STRIPE_WEBHOOK_SECRET && out.precio.ok && out.firestore.ok);
  res.setHeader('Cache-Control', 'no-store');
  return send(res, 200, out);
};
