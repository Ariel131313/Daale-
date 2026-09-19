# Importa un FBX en Blender headless, informa qué trae y lo exporta a GLB.
# Uso: blender --background --python scripts/fbx2glb.py -- <entrada.fbx> [salida.glb]
import sys
import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
entrada = argv[0]
salida = argv[1] if len(argv) > 1 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=entrada)

print("=== OBJETOS ===")
for ob in bpy.data.objects:
    detalle = ""
    if ob.type == "MESH":
        detalle = f" verts={len(ob.data.vertices)} tris={len(ob.data.loop_triangles)} mats={[m.name for m in ob.data.materials]}"
    print(f"{ob.type:10} {ob.name}{detalle}")

print("=== ACCIONES ===")
for a in bpy.data.actions:
    print(a.name, a.frame_range[:])

print("=== IMAGENES ===")
for img in bpy.data.images:
    print(img.name, tuple(img.size))

if salida:
    # El FBX es una animación de AR: las letras recién quedan armadas en el
    # fotograma pedido. Hay que hornear esa pose antes de soltar el armature.
    frame = int(argv[2]) if len(argv) > 2 else int(bpy.context.scene.frame_end)
    bpy.context.scene.frame_set(frame)
    print("POSE HORNEADA EN FOTOGRAMA:", frame)

    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            ob.select_set(True)
            bpy.context.view_layer.objects.active = ob

    bpy.ops.object.visual_transform_apply()
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")

    for ob in list(bpy.data.objects):
        if ob.type in {"CAMERA", "LIGHT", "ARMATURE"}:
            bpy.data.objects.remove(ob, do_unlink=True)

    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            ob.animation_data_clear()
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
