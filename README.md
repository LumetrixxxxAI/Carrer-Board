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
| `tools/abrir-en-local.bat` | Abre la app en `http://localhost:5500` (necesario para probar el login real). |

## Login con Google (Firebase)

1. En la [consola de Firebase](https://console.firebase.google.com/) crea un proyecto y añade una **app web** (icono `</>`).
2. Copia los datos de la configuración (`apiKey`, `authDomain`, `projectId`…) en `firebase-config.js`.
3. En **Authentication › Método de inicio de sesión**, activa **Google**.
4. En **Authentication › Configuración › Dominios autorizados** están `localhost` y el dominio de Firebase. Cuando la web esté en Vercel, añade también su dominio.
5. Abre la app con `tools/abrir-en-local.bat`. Con doble clic en `index.html` el login de Google no funciona.

Los datos de `firebase-config.js` no son secretos: están pensados para ir en la web. Lo que protege la cuenta son los dominios autorizados y, cuando guardemos datos, las reglas de Firestore. Por ahora las temporadas se siguen guardando en el navegador.

## Actualizar los trofeos

1. Deja el PNG en `assets/trofeos/` (el nombre solo tiene que parecerse al del título: `copa-del-rey.png`, `FA Cup.png`…).
2. Ejecuta `python tools/actualizar-trofeos.py` (necesita Python con Pillow: `pip install pillow`).

Los títulos que aún no tienen imagen se ven con un dibujo.

## Stack previsto

- Inicio de sesión con Google (Firebase Auth) y datos en Firestore.
- Pagos con Stripe (planes Pro y Leyenda).
- API privada en Vercel para que las claves no estén en el navegador.

Career Board es una app independiente, no afiliada a EA SPORTS, la FIFA, ninguna liga ni ningún club.
