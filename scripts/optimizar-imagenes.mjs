// Convierte las fotos de media-fuente/ a WebP en varios anchos para srcset y
// escribe src/config/mediaSizes.json con las medidas reales de cada una.
// Se corre a mano cuando se agregan o reemplazan fotos: npm run imagenes
//
// Las imágenes cuya fuente no está en esta copia (por ejemplo las generadas,
// que no se versionan) conservan lo que ya figuraba en el manifiesto. Para
// quitar una imagen del sitio, borrá su entrada del manifiesto y sus .webp.
import { readdir, readFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const FUENTES = ["reales", "generadas"].map((d) => path.join(RAIZ, "media-fuente", d));
const SALIDA = path.join(RAIZ, "public", "media");
const MANIFIESTO = path.join(RAIZ, "src", "config", "mediaSizes.json");
const ANCHOS = [480, 960, 1440];

await mkdir(SALIDA, { recursive: true });
let manifiesto = {};
try {
  manifiesto = JSON.parse(await readFile(MANIFIESTO, "utf8"));
} catch {
  // Primera vez: se arma desde cero.
}

for (const carpeta of FUENTES) {
  let archivos = [];
  try {
    archivos = (await readdir(carpeta)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  } catch {
    continue;
  }
  for (const archivo of archivos) {
    const id = archivo.replace(/\.[^.]+$/, "");
    const origen = sharp(path.join(carpeta, archivo)).rotate();
    const { width, height } = await origen.metadata();
    const anchos = ANCHOS.filter((w) => w < width).concat(width).filter((w, i, a) => a.indexOf(w) === i);
    const variantes = [];
    for (const w of anchos) {
      const nombre = `${id}-${w}.webp`;
      await origen.clone().resize({ width: w }).webp({ quality: 80 }).toFile(path.join(SALIDA, nombre));
      variantes.push({ src: `/media/${nombre}`, width: w });
    }
    const mayor = variantes[variantes.length - 1];
    manifiesto[id] = {
      src: mayor.src,
      width: mayor.width,
      height: Math.round((height / width) * mayor.width),
      srcSet: variantes,
    };
    console.log(`${id}: ${variantes.map((v) => v.width).join(", ")}`);
  }
}

await writeFile(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + "\n");

// Variantes que ya no figuran en el manifiesto (por ejemplo, de una foto que se
// recortó más chica) se borran para no publicar archivos sueltos.
const usadas = new Set(
  Object.values(manifiesto).flatMap((m) => m.srcSet.map((v) => path.basename(v.src)))
);
for (const archivo of await readdir(SALIDA)) {
  if (archivo.endsWith(".webp") && !usadas.has(archivo)) {
    await rm(path.join(SALIDA, archivo));
    console.log(`borrada: ${archivo}`);
  }
}
console.log(`manifiesto: ${Object.keys(manifiesto).length} imágenes`);
