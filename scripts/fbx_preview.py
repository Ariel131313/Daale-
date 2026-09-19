# Renderiza algunos fotogramas de un FBX para ver en cuál queda armado el logo.
# Uso: blender --background --python scripts/fbx_preview.py -- <entrada.fbx> <carpeta_salida> [f1,f2,...]
import sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
entrada, carpeta = argv[0], argv[1]
frames = [int(f) for f in argv[2].split(",")] if len(argv) > 2 else [1, 40, 80, 122]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=entrada)

escena = bpy.context.scene
escena.render.engine = "BLENDER_WORKBENCH"
escena.render.resolution_x = 480
escena.render.resolution_y = 480
escena.render.film_transparent = False

for ob in list(bpy.data.objects):
    if ob.type == "CAMERA":
        bpy.data.objects.remove(ob, do_unlink=True)

bpy.ops.object.camera_add(location=(0, -10, 0), rotation=(1.5708, 0, 0))
camara = bpy.context.object
camara.data.type = "ORTHO"
escena.camera = camara

for f in frames:
    escena.frame_set(f)

    # La cámara se reencuadra en cada fotograma sobre lo que haya visible,
    # porque las letras se mueven mucho durante la animación.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    puntos = []
    for ob in bpy.data.objects:
        if ob.type != "MESH":
            continue
        ev = ob.evaluated_get(depsgraph)
        for esquina in ev.bound_box:
            puntos.append(ev.matrix_world @ Vector(esquina))
    if puntos:
        xs = [p.x for p in puntos]
        ys = [p.y for p in puntos]
        zs = [p.z for p in puntos]
        cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
        ancho = max(max(xs) - min(xs), max(zs) - min(zs)) * 1.15
        camara.location = (cx, min(ys) - 10, cz)
        camara.data.ortho_scale = max(ancho, 0.5)
        print(f"frame {f}: centro=({cx:.2f},{cz:.2f}) tamaño={ancho:.2f}")

    escena.render.filepath = f"{carpeta}/frame_{f:03d}.png"
    bpy.ops.render.render(write_still=True)
    print("RENDER:", escena.render.filepath)
