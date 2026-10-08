# Career Board

App web para llevar tu **modo carrera de EA SPORTS FC**: plantilla con camisetas, once y formación, temporadas, goleadores, asistentes, títulos y premios individuales. Los datos se apuntan al final de cada temporada.

Estado: **boceto** en una sola página (`index.html`, HTML + CSS + JavaScript, sin dependencias). Los datos se guardan en el navegador (`localStorage`).

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

## Actualizar los trofeos

1. Deja el PNG en `assets/trofeos/` (el nombre solo tiene que parecerse al del título: `copa-del-rey.png`, `FA Cup.png`…).
2. Ejecuta `python tools/actualizar-trofeos.py` (necesita Python con Pillow: `pip install pillow`).

Los títulos que aún no tienen imagen se ven con un dibujo.

## Stack previsto

- Inicio de sesión con Google (Firebase Auth) y datos en Firestore.
- Pagos con Stripe (plan Pro), con una función en el servidor que guarde `plan: "pro"` en `users/{uid}` al pagar.

Career Board es una app independiente, no afiliada a EA SPORTS, la FIFA, ninguna liga ni ningún club.
