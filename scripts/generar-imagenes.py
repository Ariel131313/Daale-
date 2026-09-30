"""
Genera con ComfyUI (Flux.2 Klein 4B) las imágenes que faltan como marcadores
de lugar. Todas son ilustrativas y hay que reemplazarlas por fotos reales:
el sitio las muestra con la leyenda "Imagen ilustrativa".

Uso: python scripts/generar-imagenes.py [id ...]
Requiere ComfyUI escuchando en COMFY (por defecto http://127.0.0.1:8188).
"""
import json
import zlib
import os
import sys
import time
import urllib.parse
import urllib.request

COMFY = os.environ.get("COMFY", "http://127.0.0.1:8188")
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "media-fuente", "generadas")

DAALE = (
    "professional event photography, natural daylight, warm and cheerful, "
    "tidy composition, high detail, realistic"
)
NOCHE = (
    "professional night event photography, deep navy blue ambience, soft golden "
    "accents, light atmospheric haze, elegant, cinematic, realistic"
)
NEGATIVO = (
    "text, letters, words, watermark, logo, signature, brand name, "
    "people, person, human face, child, crowd, cartoon, illustration, 3d render, "
    "blurry, deformed, low quality, oversaturated"
)
NEGATIVO_SILUETA = (
    "text, letters, words, watermark, logo, signature, visible face, facial features, "
    "child, crowd, cartoon, illustration, blurry, deformed, low quality"
)

APAISADA = (1344, 768)
TARJETA = (1152, 864)

ENCARGOS = {
    "daale-hero": (
        "A bright festive party room decorated for a celebration, a large organic balloon "
        "garland of red, purple and blue balloons arching over the space, a few confetti "
        "pieces on a white table, warm daylight from a big window, cheerful, no people. " + DAALE,
        APAISADA, NEGATIVO),
    "daale-animacion": (
        "Colorful party game props arranged on green grass in a sunny garden: a rainbow play "
        "parachute spread on the ground, hula hoops, soft balls and bean bags, no people. " + DAALE,
        TARJETA, NEGATIVO),
    "daale-titeres": (
        "A small handmade puppet theater booth with red and purple velvet curtains, colorful "
        "hand puppets peeking over the stage edge, inside a party room, whimsical, no people. " + DAALE,
        TARJETA, NEGATIVO),
    "daale-maquillaje": (
        "An artist's face painting kit on a white table seen from above: open palette of bright "
        "face paints, brushes, sponges, small jars of fine glitter in red, purple and blue, "
        "product photography, soft daylight, no people.",
        TARJETA, NEGATIVO),
    "daale-globoflexia": (
        "Several balloon animals made from long twisting balloons standing on a white table: "
        "a blue dog, a red flower, a purple sword and a yellow giraffe, playful, soft bright "
        "light, no people. " + DAALE,
        TARJETA, NEGATIVO),
    "daale-deco": (
        "A birthday dessert table decorated in red, purple and blue: balloons, a small layered "
        "cake, cupcakes, a paper garland and confetti, clean white backdrop, festive and "
        "elegant, no people. " + DAALE,
        TARJETA, NEGATIVO),
    "daale-cascada": (
        "A chocolate fountain flowing on a party dessert table, surrounded by skewers of "
        "strawberries, marshmallows and banana slices, warm light, appetizing, professional "
        "food photography, no people.",
        TARJETA, NEGATIVO),
    "daale-empresas": (
        "A colorful kids activity corner set up inside a bright modern shopping mall atrium: "
        "low tables with coloring sheets and crayons, a balloon arch in red, purple and blue, "
        "daylight from a skylight, clean and professional, no people, no shop signs. " + DAALE,
        APAISADA, NEGATIVO),
    "nm-hero": (
        "An elegant night event stage with soft haze, deep navy blue stage lighting and warm "
        "golden spotlight beams, tiny sparkles of light floating in the air, a glamorous party "
        "venue, empty stage, no people. " + NOCHE,
        APAISADA, NEGATIVO),
    "nm-recepcion": (
        "The entrance of an elegant night party venue: a pathway lined with candles in glass "
        "holders, deep blue uplighting, warm gold accents and draped fabric, welcoming and "
        "glamorous, no people. " + NOCHE,
        TARJETA, NEGATIVO),
    "nm-zancudos": (
        "A stilt walker performer walking on tall visible wooden stilts that extend the legs "
        "far below a short sparkling costume, arms raised holding a glowing star wand, full "
        "body silhouette strongly backlit by a deep blue stage light with haze, the face is "
        "in complete shadow, night event. " + NOCHE,
        TARJETA, NEGATIVO_SILUETA),
    "nm-performers": (
        "Two circus performers on a stage spinning glowing light poi that draw circles of "
        "golden and blue light in the fog, wearing long loose costumes, fully backlit so they "
        "appear as dark shapes with no visible faces, family friendly night show. " + NOCHE,
        TARJETA, NEGATIVO_SILUETA),
    "nm-ambientacion": (
        "A night party venue decorated with dark navy drapes, strings of warm fairy lights "
        "hanging like stars, round tables with gold accents and candles, elegant and magical "
        "ambience, no people. " + NOCHE,
        TARJETA, NEGATIVO),
}


def grafo(prompt, negativo, ancho, alto, semilla, prefijo):
    return {
        "1": {"class_type": "UNETLoader",
              "inputs": {"unet_name": "flux-2-klein-base-4b-fp8.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader",
              "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "flux2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": negativo, "clip": ["2", 0]}},
        "6": {"class_type": "CFGGuider",
              "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "cfg": 5.0}},
        "7": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "8": {"class_type": "Flux2Scheduler", "inputs": {"steps": 24, "width": ancho, "height": alto}},
        "9": {"class_type": "RandomNoise", "inputs": {"noise_seed": semilla}},
        "10": {"class_type": "EmptyFlux2LatentImage",
               "inputs": {"width": ancho, "height": alto, "batch_size": 1}},
        "11": {"class_type": "SamplerCustomAdvanced",
               "inputs": {"noise": ["9", 0], "guider": ["6", 0], "sampler": ["7", 0],
                          "sigmas": ["8", 0], "latent_image": ["10", 0]}},
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["3", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": prefijo}},
    }


def pedir(ruta, datos=None):
    req = urllib.request.Request(
        COMFY + ruta,
        data=json.dumps(datos).encode() if datos is not None else None,
        headers={"Content-Type": "application/json"} if datos is not None else {},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def generar(id_, semilla=None):
    prompt, (ancho, alto), negativo = ENCARGOS[id_]
    semilla = semilla if semilla is not None else zlib.crc32(id_.encode())
    respuesta = json.loads(pedir("/prompt", {"prompt": grafo(prompt, negativo, ancho, alto, semilla, f"daale-nm/{id_}")}))
    pid = respuesta["prompt_id"]
    while True:
        historia = json.loads(pedir(f"/history/{pid}"))
        if pid in historia:
            estado = historia[pid].get("status", {})
            if estado.get("status_str") == "error":
                raise RuntimeError(json.dumps(estado)[:600])
            salidas = historia[pid]["outputs"]["13"]["images"]
            break
        time.sleep(1.5)
    img = salidas[0]
    q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img["subfolder"], "type": img["type"]})
    datos = pedir(f"/view?{q}")
    os.makedirs(SALIDA, exist_ok=True)
    destino = os.path.join(SALIDA, f"{id_}.png")
    with open(destino, "wb") as f:
        f.write(datos)
    print(f"{id_}: listo ({ancho}x{alto}, semilla {semilla})", flush=True)


if __name__ == "__main__":
    ids = sys.argv[1:] or list(ENCARGOS)
    semilla_extra = int(os.environ.get("SEMILLA", "0")) or None
    for id_ in ids:
        generar(id_, semilla_extra)
