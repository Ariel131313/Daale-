# Toma las letras sueltas del FBX de AR (que vienen apiladas por el armature)
# y las acomoda en fila formando DAALE!!, listo para exportar a GLB.
# Uso: blender --background --python scripts/daale_layout.py -- <entrada.fbx> <salida.glb> [preview.png]
import sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
entrada, salida = argv[0], argv[1]
preview = argv[2] if len(argv) > 2 else None

# Orden del lockup y una inclinación propia por letra, como en el logo original.
ORDEN = [
    ("D", -0.06),
    ("A", 0.05),
    ("A2", -0.04),
    ("L", 0.03),
    ("E", -0.05),
    ("S", 0.06),
    ("S003", -0.03),
]
SEPARACION = 0.06  # proporción del ancho promedio

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=entrada)

for ob in list(bpy.data.objects):
    if ob.type in {"CAMERA", "LIGHT", "ARMATURE"}:
        bpy.data.objects.remove(ob, do_unlink=True)

letras = []
for nombre, giro in ORDEN:
    ob = bpy.data.objects.get(nombre)
    if ob is None:
        print("FALTA LETRA:", nombre)
        continue
    ob.parent = None
    ob.animation_data_clear()
    ob.location = (0, 0, 0)
    # Vienen acostadas mirando al cielo: se paran de frente a -Y, que al
    # exportar a glTF queda mirando a la cámara. El segundo eje es la
    # inclinación juguetona de cada letra.
    ob.rotation_euler = (1.5707963, giro, 0)
    ob.scale = (1, 1, 1)
    letras.append((ob, giro))

bpy.context.view_layer.update()

# Cada letra se centra sobre su propia caja y después se ubica en la fila.
medidas = []
for ob, _ in letras:
    esquinas = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    minimo = Vector((min(c.x for c in esquinas), min(c.y for c in esquinas), min(c.z for c in esquinas)))
    maximo = Vector((max(c.x for c in esquinas), max(c.y for c in esquinas), max(c.z for c in esquinas)))
    medidas.append((minimo, maximo))

anchoPromedio = sum((m[1].x - m[0].x) for m in medidas) / len(medidas)
gap = anchoPromedio * SEPARACION

cursor = 0.0
for (ob, _giro), (minimo, maximo) in zip(letras, medidas):
    centro = (minimo + maximo) / 2
    ob.location = (cursor - minimo.x, -centro.y, -centro.z)
    cursor += (maximo.x - minimo.x) + gap

    print(f"{ob.name}: ancho={maximo.x - minimo.x:.2f}")

bpy.context.view_layer.update()

if preview:
    escena = bpy.context.scene
    escena.render.engine = "BLENDER_WORKBENCH"
    escena.render.resolution_x = 900
    escena.render.resolution_y = 320
    bpy.ops.object.camera_add(location=(0, -10, 0), rotation=(1.5708, 0, 0))
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    escena.camera = cam

    puntos = []
    for ob, _ in letras:
        puntos += [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    xs = [p.x for p in puntos]
    zs = [p.z for p in puntos]
    cam.location = (sum(xs) / len(xs), -40, (min(zs) + max(zs)) / 2)
    cam.data.ortho_scale = (max(xs) - min(xs)) * 1.1

    escena.render.filepath = preview
    bpy.ops.render.render(write_still=True)
    print("PREVIEW:", preview)

bpy.ops.object.select_all(action="DESELECT")
for ob, _ in letras:
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

bpy.ops.export_scene.gltf(
    filepath=salida,
    export_format="GLB",
    export_apply=True,
    use_selection=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
)
print("EXPORTADO:", salida)
