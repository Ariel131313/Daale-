// Sirve la carpeta out/ como la publica GitHub Pages, para revisar el sitio
// exportado antes de subirlo: prefijo del repositorio, redirección a la barra
// final y página 404 propia.
//
// Uso:
//   npm run build                                   (sin prefijo)
//   npm run servir
//
//   NEXT_PUBLIC_BASE_PATH=/Daale- npm run build     (igual que en Pages)
//   npm run servir -- --base Daale-
//
// Opciones: --base <prefijo> (por defecto, ninguno) y --port <número> (4173).
// El prefijo va sin barra inicial: Git Bash en Windows convierte "/Daale-" en
// una ruta de disco.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

function option(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const root = join(process.cwd(), "out");
const prefix = option("base", "").replace(/^\/+|\/+$/g, "");
const base = prefix ? `/${prefix}` : "";
const port = Number(option("port", "4173"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Archivo para una ruta dentro de out/, o null. Una carpeta sirve su index.html. */
async function fileFor(path) {
  const full = normalize(join(root, path));
  if (full !== root && !full.startsWith(root + sep)) return null;
  try {
    const info = await stat(full);
    if (!info.isDirectory()) return full;
    const index = join(full, "index.html");
    await stat(index);
    return index;
  } catch {
    return null;
  }
}

async function send(res, status, file) {
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (base) {
    if (path === base) {
      res.writeHead(301, { Location: `${base}/${url.search}` }).end();
      return;
    }
    if (!path.startsWith(`${base}/`)) {
      res.writeHead(404, { "Content-Type": TYPES[".txt"] }).end(`Fuera de ${base}/`);
      return;
    }
    path = path.slice(base.length);
  }

  // Como Pages: /daale lleva a /daale/ si esa carpeta existe.
  if (!path.endsWith("/") && !extname(path) && (await fileFor(`${path}/`))) {
    res.writeHead(301, { Location: `${base}${path}/${url.search}` }).end();
    return;
  }

  const file = await fileFor(path);
  if (file) {
    await send(res, 200, file);
    return;
  }
  const notFound = await fileFor("/404.html");
  if (notFound) await send(res, 404, notFound);
  else res.writeHead(404).end();
}).listen(port, () => {
  console.log(`Sitio exportado en http://localhost:${port}${base}/`);
});
