# Career Board

App web para llevar tu **modo carrera de EA SPORTS FC**: plantilla con camisetas, once y formación, temporadas, goleadores, asistentes, títulos y premios individuales. Los datos se apuntan al final de cada temporada.

Estado: **boceto** en una sola página (`index.html`, HTML + CSS + JavaScript, sin dependencias). Los datos se guardan en el navegador (`localStorage`).

## Dónde está publicada

- **Vercel** (proyecto `career-board` del equipo Lumetrix): https://career-board-three.vercel.app — se publica sola con cada cambio que se sube a `main`. `.vercelignore` deja fuera los PNG originales y las herramientas.
- **GitHub Pages**: https://lumetrixxxxai.github.io/Carrer-Board/

Las dos direcciones tienen que estar en Firebase › Authentication › Configuración › Dominios autorizados para que funcione el login con Google.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | La app. Se abre con doble clic. |
| `assets/trofeos/` | Imágenes de los trofeos (PNG sin fondo). Las nuevas se dejan aquí. |
| `tools/actualizar-trofeos.py` | Mete los trofeos de `assets/trofeos` dentro de `index.html` (recortados, reducidos y en WebP), para que la web siga siendo un solo archivo. |
| `firebase-config.js` | Datos del proyecto de Firebase para el login con Google. Vacío = login simulado. |
| `firestore.rules` | Reglas de seguridad de Firestore (se pegan en la consola de Firebase). |
| `tools/abrir-en-local.bat` | Abre la app en `http://localhost:5500` (necesario para probar el login real). |

## Login con Google (Firebase)

1. En la [consola de Firebase](https://console.firebase.google.com/) crea un proyecto y añade una **app web** (icono `</>`).
2. Copia los datos de la configuración (`apiKey`, `authDomain`, `projectId`…) en `firebase-config.js`.
3. En **Authentication › Método de inicio de sesión**, activa **Google**.
4. En **Authentication › Configuración › Dominios autorizados** están `localhost` y el dominio de Firebase. Cuando la web esté en Vercel, añade también su dominio.
5. Abre la app con `tools/abrir-en-local.bat`. Con doble clic en `index.html` el login de Google no funciona.

Los datos de `firebase-config.js` no son secretos: están pensados para ir en la web. Lo que protege la cuenta son los dominios autorizados y las reglas de Firestore.

## Carreras guardadas en la cuenta (Firestore)

Con sesión iniciada, cada carrera se guarda en `users/{uid}/careers/{id}` (la primera es `principal`) y la que tienes abierta, también en el navegador, para trabajar sin conexión.

1. En la consola de Firebase: **Firestore Database › Crear base de datos** (ubicación en Europa, modo producción).
2. En **Reglas**, pega el contenido de [`firestore.rules`](firestore.rules) y pulsa **Publicar**.

Para que no se pierda nada por error:

- Antes de borrar una temporada, empezar de cero o borrar una carrera, y una vez al día, se guarda una **copia completa** en `.../careers/{id}/backups`. Las reglas no dejan cambiar ni borrar esas copias.
- Cada guardado lleva un número de versión y las reglas solo aceptan la siguiente: una versión vieja (otro móvil, una pestaña antigua) no puede pisar a una nueva. Si pasa, se carga la nueva y la del dispositivo se guarda como copia.
- Si no se puede leer la cuenta, no se escribe nada en ella.

## Planes: Amateur y Pro

| | Amateur (gratis) | Pro (3,99 €/mes) |
|---|---|---|
| Modos carrera | 1 | Ilimitados |
| Temporadas por carrera | Hasta 5 | Ilimitadas |
| Tema | Claro y oscuro | Claro, oscuro y con los colores de tu club |
| Internacional (Mundiales, Eurocopas, Copa América y Balón de Oro) | Solo consultar | Consultar y apuntar |

El plan se lee de `users/{uid}` (campo `plan`). La app no puede escribirlo: lo pondrá el webhook de Stripe al pagar.
Mientras tanto, para probar Pro con una cuenta:

1. En **Authentication › Usuarios**, copia el **UID** de esa cuenta.
2. En **Firestore Database › Datos**, abre la colección `users` y pulsa **Agregar documento**: como ID pon ese UID y añade el campo `plan` (string) con el valor `pro`. (Si el documento ya existe, solo añade el campo.)
3. La app lo nota al momento. Para volver a Amateur, borra el campo o cambia el valor.

Las reglas no dejan crear una segunda carrera sin Pro. Los datos reales de Internacional (Mundiales, Eurocopas, Copas América y Balones de Oro) están en `index.html` (`WC_HIST`, `EURO_HIST`, `COPA_HIST` y `BALLON_HIST`).

## Pagos del plan Pro (Stripe)

La cuenta de Stripe **la comparte Work IA**. Career Board no toca nada suyo: tiene su propio producto, crea sus propios clientes y su webhook solo hace caso a las suscripciones marcadas con `metadata.app = career-board` (o con el precio de Career Board Pro). El webhook de Work IA busca a sus usuarios por su propio `stripeCustomerId`, así que ignora los pagos de Career Board.

| Pieza | Qué hace |
|---|---|
| `api/checkout.js` | La app la llama (con el token de Google) y devuelve la página de pago de Stripe: suscripción de 3,99 €/mes. |
| `api/portal.js` | Devuelve el portal de cliente de Stripe: cambiar la tarjeta, ver facturas o cancelar. |
| `api/stripe-webhook.js` | Stripe avisa de cada pago o cambio y la función pone `plan: "pro"` o `"free"` en `users/{uid}` (Firestore). Es lo único que da o quita el Pro. |

Variables de entorno en Vercel (proyecto `career-board`, Settings › Environment Variables, en Production):

- `STRIPE_SECRET_KEY`: clave secreta de Stripe.
- `STRIPE_WEBHOOK_SECRET`: secreto del webhook de Career Board.
- `FIREBASE_SERVICE_ACCOUNT`: el JSON entero de la cuenta de servicio de Firebase (Configuración del proyecto › Cuentas de servicio › Generar nueva clave privada).
- `STRIPE_PRICE_ID`: el precio de "Career Board Pro" (`price_…`).
- `STRIPE_PORTAL_CONFIG` (opcional): configuración propia del portal de cliente.

Webhook de Stripe: `https://career-board-three.vercel.app/api/stripe-webhook`, con los eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`.

Las claves nunca van en el código: solo en Vercel. Después de cambiar una variable hay que volver a desplegar.

## Actualizar los trofeos

1. Deja el PNG en `assets/trofeos/` (el nombre solo tiene que parecerse al del título: `copa-del-rey.png`, `FA Cup.png`…).
2. Ejecuta `python tools/actualizar-trofeos.py` (necesita Python con Pillow: `pip install pillow`).

Los títulos que aún no tienen imagen se ven con un dibujo.

## Stack previsto

- Inicio de sesión con Google (Firebase Auth) y datos en Firestore.

Career Board es una app independiente, no afiliada a EA SPORTS, la FIFA, ninguna liga ni ningún club.
