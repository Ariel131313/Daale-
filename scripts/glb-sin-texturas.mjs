// Quita las texturas de un GLB y lo reescribe. Las imágenes se cargan aparte
// en la página, porque el visor de previews bloquea el camino blob:/fetch que
// usa GLTFLoader para las imágenes embebidas.
// Uso: node scripts/glb-sin-texturas.mjs <entrada.glb> <salida.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const [, , entrada, salida] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(entrada);

const texturas = doc.getRoot().listTextures();
for (const tex of texturas) tex.dispose();

await io.write(salida, doc);
console.log(`texturas quitadas: ${texturas.length} → ${salida}`);
