import type { NextConfig } from "next";

// En GitHub Pages el sitio vive bajo /<repo>; el workflow de deploy inyecta esa
// ruta. En local queda vacía y todo se sirve desde la raíz.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // /daale -> /daale/index.html: los hosts estáticos resuelven la carpeta sin
  // reglas de reescritura, y los enlaces de campañas funcionan tal cual.
  trailingSlash: true,
  images: {
    // El optimizador por defecto necesita servidor. Las fotos se optimizan
    // antes del build (scripts/optimizar-imagenes.mjs) y se sirven tal cual.
    unoptimized: true,
  },
};

export default nextConfig;
