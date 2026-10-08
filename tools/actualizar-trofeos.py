# Actualiza los trofeos de la app.
# Coge las imágenes de assets/trofeos (PNG sin fondo), las recorta, las reduce a 320 px,
# las pasa a WebP y las mete dentro de index.html (const TROPHY_IMG), para que la web
# siga siendo un solo archivo.
#
# Uso:  python tools/actualizar-trofeos.py
#
# El nombre del archivo da igual mientras se parezca al del título
# ("Champion League.png", "trofeo LaLiga.png", "supercopa-de-europa.png"…).
# Los títulos sin imagen siguen con su dibujo.
import base64, io, os, re, unicodedata
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'trofeos')
HTML = os.path.join(ROOT, 'index.html')
MAX = 320  # px del lado mayor (se ven como mucho a ~120 px; así quedan nítidos en pantallas retina)

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\.(png|webp|jpe?g)$', '', s)
    s = s.replace('leauge', 'league').replace('champion league', 'champions league')
    s = re.sub(r'\bone\b', '1', s); s = re.sub(r'\btwo\b', '2', s)  # "Ligue One" = "Ligue 1"
    s = re.sub(r'\bbundesliga\W*2\b', '2 bundesliga', s)  # "Bundesliga 2" = "2. Bundesliga"
    s = re.sub(r'\b(trofeo|uefa)\b', ' ', s)
    return re.sub(r'[^a-z0-9]+', '', s)

html = open(HTML, encoding='utf-8', newline='').read()
titles = re.findall(r"'([^']+)':'(?:league|cup|plate|tall|vase|ears)'", html)
by_norm = {norm(t): t for t in titles}

entries, unmatched = [], []
for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith(('.png', '.webp')):
        continue
    t = by_norm.get(norm(f))
    if not t:
        unmatched.append(f); continue
    im = Image.open(os.path.join(SRC, f)).convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    if bbox: im = im.crop(bbox)
    pad = round(max(im.size) * 0.03)
    canvas = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, (pad, pad))
    canvas.thumbnail((MAX, MAX), Image.LANCZOS)
    buf = io.BytesIO(); canvas.save(buf, 'WEBP', quality=86, method=6)
    entries.append((t, f, canvas.size, len(buf.getvalue()), base64.b64encode(buf.getvalue()).decode()))

entries.sort(key=lambda e: titles.index(e[0]))
js = ('/* TROFEOS:INICIO · imágenes reales de assets/trofeos (recortadas, 320 px, WebP). Generado con tools/actualizar-trofeos.py: no editar a mano */\n'
      'const TROPHY_IMG={\n' + ',\n'.join(f"  '{t}':'data:image/webp;base64,{d}'" for t, _, _, _, d in entries) + '\n};\n/* TROFEOS:FIN */\n')
if '/* TROFEOS:INICIO' not in html:
    raise SystemExit('No encuentro las marcas TROFEOS:INICIO / TROFEOS:FIN en index.html')
html = re.sub(r'/\* TROFEOS:INICIO.*?/\* TROFEOS:FIN \*/\n', lambda m: js, html, flags=re.S)
open(HTML, 'w', encoding='utf-8', newline='').write(html)

for t, f, size, b, _ in entries:
    print(f'{t:24s} <- {f:28s} {size[0]}x{size[1]}  {b/1024:.0f} KB')
print('Archivos sin título reconocido:', unmatched or 'ninguno')
print('Títulos que siguen con dibujo:', [t for t in titles if t not in {e[0] for e in entries}])
