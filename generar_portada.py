"""
Genera la imagen de portada (Open Graph) para compartir en WhatsApp.
Salida: preview.png de 1200x630 px.
Ejecutar una sola vez:  python generar_portada.py
"""
from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1200, 630
img = Image.new("RGB", (W, H))
draw = ImageDraw.Draw(img)

# ----- Fondo tipo cielo (degradado vertical) -----
top = (169, 208, 255)      # azul cielo
bottom = (255, 230, 236)   # rosado suave
for y in range(H):
    t = y / H
    r = int(top[0] + (bottom[0] - top[0]) * t)
    g = int(top[1] + (bottom[1] - top[1]) * t)
    b = int(top[2] + (bottom[2] - top[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ----- Nubes suaves -----
def nube(cx, cy, s, alpha=90):
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    for dx, dy, rr in [(0, 0, 60), (50, 10, 45), (-50, 12, 45), (25, -18, 40), (-25, -15, 40)]:
        d.ellipse([cx+dx-rr*s, cy+dy-rr*s, cx+dx+rr*s, cy+dy+rr*s],
                  fill=(255, 255, 255, alpha))
    img.paste(Image.alpha_composite(img.convert("RGBA"), capa).convert("RGB"), (0, 0))

nube(230, 130, 1.0, 110)
nube(950, 90, 1.2, 95)
nube(1050, 430, 1.0, 90)

# ----- Corazón dibujado con estela punteada -----
ACCENT = (232, 80, 110)
cx, cy, scale = W // 2, 250, 9
pts = []
t = 0.0
while t <= 2 * math.pi + 0.01:
    x = 16 * math.sin(t) ** 3
    yv = 13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t)
    pts.append((cx + x * scale, cy - yv * scale))
    t += 0.05

# trazo del corazón
draw.line(pts, fill=ACCENT, width=6, joint="curve")

# ----- Avioncito al inicio del corazón (arriba) -----
def avion(px, py, ang):
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    cuerpo = [(20, 0), (-10, -8), (-5, 0), (-10, 8)]
    ala = [(2, 0), (-8, -13), (-3, 0), (-8, 13)]
    def rot(pts, color):
        out = []
        for x, y in pts:
            rx = x * math.cos(ang) - y * math.sin(ang)
            ry = x * math.sin(ang) + y * math.cos(ang)
            out.append((px + rx, py + ry))
        d.polygon(out, fill=color)
    rot(cuerpo, (255, 255, 255, 255))
    rot(ala, ACCENT + (255,))
    img.paste(Image.alpha_composite(img.convert("RGBA"), capa).convert("RGB"), (0, 0))

avion(pts[0][0], pts[0][1], -0.4)

# ----- Fuentes -----
def cargar(nombres, size):
    for n in nombres:
        try:
            return ImageFont.truetype(n, size)
        except Exception:
            continue
    return ImageFont.load_default()

f_title = cargar(["seguibl.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"], 82)
f_sub   = cargar(["segoeuii.ttf", "ariali.ttf", "DejaVuSans-Oblique.ttf"], 40)
f_small = cargar(["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"], 30)

INK = (27, 42, 74)

def centrado(texto, y, font, fill):
    bbox = draw.textbbox((0, 0), texto, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((W - w) / 2, y), texto, font=font, fill=fill)

# ----- Textos -----
centrado("LOVE AIRLINES", 400, f_small, ACCENT)
centrado("Una carta para ti", 445, f_title, INK)
centrado("Cuenta regresiva para verte", 545, f_sub, INK)

img.save("preview.png", "PNG")
print("Portada generada: preview.png")
