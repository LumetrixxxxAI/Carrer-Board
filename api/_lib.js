/* Piezas comunes de las funciones de pago (Vercel). Los archivos que empiezan por "_" no son rutas públicas.

   Variables de entorno (Vercel › career-board › Settings › Environment Variables):
   - STRIPE_SECRET_KEY        clave secreta de Stripe (sk_live_… o una clave restringida rk_live_…)   [secreta]
   - STRIPE_WEBHOOK_SECRET    secreto del webhook de Career Board en Stripe (whsec_…)                   [secreta]
   - FIREBASE_SERVICE_ACCOUNT el JSON entero de la cuenta de servicio de Firebase                       [secreta]
   - STRIPE_PRICE_ID          precio de "Career Board Pro" (price_…)
   - STRIPE_PORTAL_CONFIG     (opcional) configuración del portal de cliente de Career Board (bpc_…)

   La cuenta de Stripe la comparte Work IA: Career Board solo crea sus propios clientes y suscripciones
   (con metadata app=career-board) y su webhook ignora todo lo que no sea suyo. */
const StripeLib = require('stripe');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const APP = 'career-board';
const PROJECT_ID = 'carrer-board';
const DEFAULT_URL = 'https://career-board-three.vercel.app/';
/* desde dónde se puede llamar a estas funciones (la web en Vercel, la de GitHub Pages y las pruebas en local) */
const ORIGINS = {
  'https://career-board-three.vercel.app': 'https://career-board-three.vercel.app/',
  'https://lumetrixxxxai.github.io': 'https://lumetrixxxxai.github.io/Carrer-Board/',
  'http://localhost:5500': 'http://localhost:5500/',
  'http://localhost:8141': 'http://localhost:8141/'
};

/* JSON de la cuenta de servicio. Si al pegarlo en Vercel se perdió la llave "}" del final (pasa al copiar), se arregla aquí. */
function serviceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  for (const t of [raw, raw + '}']) { try { return JSON.parse(t); } catch (e) {} }
  return JSON.parse(raw); /* (para que salga el error real) */
}

function firebase() {
  if (!getApps().length) {
    const sa = serviceAccount();
    initializeApp({ credential: cert(sa), projectId: sa.project_id || PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore(), FieldValue };
}

let _stripe;
function stripe() {
  if (!_stripe) {
    const Stripe = StripeLib.default || StripeLib;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: 'Career Board' } });
  }
  return _stripe;
}

/* CORS para las llamadas de la app; responde sola a las de comprobación (OPTIONS) */
function cors(req, res) {
  const o = req.headers.origin;
  if (ORIGINS[o]) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

/* a dónde vuelve el usuario después de pagar o de gestionar su suscripción */
const appUrl = req => ORIGINS[req.headers.origin] || process.env.APP_URL || DEFAULT_URL;

/* usuario de Google que hace la llamada (token de Firebase en "Authorization: Bearer …") */
async function currentUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw Object.assign(new Error('Sin sesión'), { status: 401 });
  try { return await firebase().auth.verifyIdToken(token); }
  catch (e) { throw Object.assign(new Error('Sesión no válida'), { status: 401 }); }
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

const portalConfig = () => (process.env.STRIPE_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PORTAL_CONFIG } : {});

module.exports = { APP, serviceAccount, firebase, stripe, cors, appUrl, currentUser, send, portalConfig };
