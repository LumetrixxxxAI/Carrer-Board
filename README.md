# Career Board

App web para llevar tu **modo carrera de EA SPORTS FC**: plantilla con camisetas, once y formación, temporadas, goleadores, asistentes, títulos y premios individuales. Los datos se apuntan al final de cada temporada.

Estado: **boceto** en una sola página (`index.html`, HTML + CSS + JavaScript, sin dependencias). Los datos se guardan en el navegador (`localStorage`).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | La app. Se abre con doble clic. |
| `assets/trofeos/` | Imágenes de los trofeos (PNG sin fondo). Las nuevas se dejan aquí. |
| `tools/actualizar-trofeos.py` | Mete los trofeos de `assets/trofeos` dentro de `index.html` (recortados, reducidos y en WebP), para que la web siga siendo un solo archivo. |

## Actualizar los trofeos

1. Deja el PNG en `assets/trofeos/` (el nombre solo tiene que parecerse al del título: `copa-del-rey.png`, `FA Cup.png`…).
2. Ejecuta `python tools/actualizar-trofeos.py` (necesita Python con Pillow: `pip install pillow`).

Los títulos que aún no tienen imagen se ven con un dibujo.

## Stack previsto

- Inicio de sesión con Google (Firebase Auth) y datos en Firestore.
- Pagos con Stripe (planes Pro y Leyenda).
- API privada en Vercel para que las claves no estén en el navegador.

Career Board es una app independiente, no afiliada a EA SPORTS, la FIFA, ninguna liga ni ningún club.
