"""
Recompone la ilustración del chocolatero para las tarjetas: la recorta del
original en máxima resolución, separa al personaje del fondo, lo amplía y lo
apoya sobre un fondo nuevo de 3:2 en el mismo estilo (azul noche, franjas de
luz suaves y una sombra de papel), encuadrado de la galera a la cintura.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

RAIZ = r"D:\WORKS\DALE!!\WEB"
ORIGEN = os.path.join(RAIZ, "FOTOS NOCHE MAGIC", "WILLY WONCA.jpeg")
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "media-fuente", "reales", "nm-personajes.png")

# Recorte del personaje en el original (x del saco, y desde la copa de la galera
# hasta el pie del panel ilustrado).
X0, X1, Y0, Y1 = 390, 570, 578, 1140
SEPARADOR = 600 - Y0  # fila donde empieza el panel ilustrado (arriba está la foto real)
HOMBROS = 232 - 18    # debajo de esta fila el saco ocupa todo el ancho

NAVY = np.array([35, 38, 71], dtype=np.float32)
MINT = np.array([175, 191, 165], dtype=np.float32)
HAT = np.array([39, 75, 75], dtype=np.float32)

img = np.array(Image.open(ORIGEN).convert("RGB")).astype(np.float32)
col = img[Y0:Y1, X0:X1]
h, w, _ = col.shape


def cerca(a, color, tol):
    return np.linalg.norm(a - color, axis=2) < tol


# 0) La cuchara (y la mano) de la invitada de la izquierda quedan delante del
#    borde del saco: se tapan con el color del saco.
SACO = np.array([158, 76, 65], dtype=np.float32)
z0, z1 = 270 - 18, 490 - 18
zona = col[z0:z1, 0:46]
ajeno = cerca(zona, np.array([158, 165, 184], np.float32), 48) | (zona.mean(axis=2) > 180)
ajeno |= cerca(zona, np.array([220, 164, 139], np.float32), 42)
ajeno = cv2.dilate(ajeno.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
grano = np.random.default_rng(7).normal(0, 3, zona.shape)
zona[ajeno] = (SACO + grano)[ajeno]
# Rastro del contorno: todo el tramo del borde izquierdo al color del saco,
# fundido hacia adentro en los últimos píxeles.
parche = SACO + grano
mezcla = np.clip((40 - np.arange(zona.shape[1], dtype=np.float32)) / 8, 0, 1)[None, :, None]
zona[:] = parche * mezcla + zona * (1 - mezcla)


# 1) Máscara del fondo arriba de los hombros: azul noche, franja menta o la
#    línea blanca del separador, conectados con los bordes del recorte.
candidato = np.zeros((h, w), dtype=np.uint8)
zona = slice(0, HOMBROS)
fondo = cerca(col[zona], NAVY, 26) | cerca(col[zona], MINT, 45) | (col[zona].mean(axis=2) > 200)
candidato[zona][fondo] = 1
# Arriba del separador todo lo que no sea la galera es la foto real: fondo.
foto = ~cerca(col[:SEPARADOR], HAT, 40)
candidato[:SEPARADOR][foto] = 1

conectado = np.zeros((h + 2, w + 2), dtype=np.uint8)
relleno = candidato.copy()
for y in range(HOMBROS):
    for x in (0, w - 1):
        if relleno[y, x] == 1:
            cv2.floodFill(relleno, conectado, (x, y), 2)
for x in range(w):
    if relleno[0, x] == 1:
        cv2.floodFill(relleno, conectado, (x, 0), 2)
es_fondo = relleno == 2

alpha = np.where(es_fondo, 0, 255).astype(np.uint8)
# Limpieza: cierra agujeritos del papel y suaviza el borde recortado.
alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
# Solo la figura principal: afuera quedan motas sueltas de la foto real.
n, etiquetas, stats, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), 8)
mayor = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
alpha = np.where(etiquetas == mayor, 255, 0).astype(np.uint8)

# 2) Ampliación: Lanczos, suavizado que respeta bordes y un poco de nitidez.
ESCALA = 2.2
W2, H2 = round(w * ESCALA), round(h * ESCALA)
rgb = cv2.resize(col.astype(np.uint8), (W2, H2), interpolation=cv2.INTER_LANCZOS4)
rgb = cv2.bilateralFilter(rgb, 7, 22, 7)
suave = cv2.GaussianBlur(rgb, (0, 0), 1.4)
rgb = cv2.addWeighted(rgb, 1.6, suave, -0.6, 0)
a2 = cv2.resize(alpha, (W2, H2), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
a2 = np.clip((a2 - 0.35) / 0.3, 0, 1)  # borde nítido, como papel recortado
a2 = cv2.GaussianBlur(a2, (0, 0), 0.7)

# 3) Fondo nuevo 3:2 en el estilo de la ilustración.
CW, CH = 1500, 1000
lienzo = np.zeros((CH, CW, 3), dtype=np.float32) + NAVY
yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)


def franja(x_arriba, x_abajo, ancho, color, opacidad):
    centro = x_arriba + (x_abajo - x_arriba) * (yy / CH)
    dentro = np.abs(xx - centro) < ancho / 2
    borde = np.clip(1 - (np.abs(xx - centro) - ancho / 2 + 1.5) / 3, 0, 1)
    m = np.where(dentro, 1.0, borde) * opacidad
    return m[..., None] * (np.array(color, dtype=np.float32) - lienzo)


lienzo += franja(260, 60, 150, MINT, 0.55)
lienzo += franja(1180, 1420, 120, (169, 155, 224), 0.45)
lienzo += franja(1330, 1560, 60, MINT, 0.35)
# Grano de papel muy leve, para que el fondo no quede más liso que el personaje.
rng = np.random.default_rng(4)
lienzo += rng.normal(0, 2.2, lienzo.shape)
# Viñeta suave.
d = np.sqrt(((xx - CW / 2) / (CW / 2)) ** 2 + ((yy - CH / 2) / (CH / 2)) ** 2)
lienzo *= (1 - 0.18 * np.clip(d - 0.4, 0, 1))[..., None]

# 4) Personaje centrado, con la galera cerca del borde superior y cortado a la
#    altura de la cintura, más una sombra de papel.
top = 70
left = (CW - W2) // 2
vis_h = min(H2, CH - top)
capa = np.zeros((CH, CW), dtype=np.float32)
capa[top:top + vis_h, left:left + W2] = a2[:vis_h]
sombra = cv2.GaussianBlur(capa, (0, 0), 9)
desplazada = np.zeros_like(sombra)
desplazada[8:, 6:] = sombra[:-8, :-6]
sombra = desplazada
lienzo = lienzo * (1 - 0.38 * sombra[..., None]) + np.array([8, 9, 22], np.float32) * 0.38 * sombra[..., None]
frente = np.zeros_like(lienzo)
frente[top:top + vis_h, left:left + W2] = rgb[:vis_h].astype(np.float32)
lienzo = lienzo * (1 - capa[..., None]) + frente * capa[..., None]

Image.fromarray(np.clip(lienzo, 0, 255).astype(np.uint8)).save(SALIDA)
print("ok", SALIDA, (CW, CH), "personaje", (W2, H2), "visible hasta y", vis_h)
