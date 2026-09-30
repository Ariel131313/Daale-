import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { basePath } from "@/lib/paths";

// La exportación estática solo genera /robots.txt si la ruta es estática.
export const dynamic = "force-static";

/**
 * El recorrido para mayores de 18 no se rastrea, esté habilitado o no. La
 * página además pide noindex y no figura en el sitemap ni se enlaza desde el
 * resto del sitio.
 *
 * Los buscadores solo leen robots.txt en la raíz del dominio. En GitHub Pages
 * de proyecto (usuario.github.io/repo) este archivo queda en /repo/robots.txt
 * y no tiene efecto: ahí la protección es el noindex de la página. Con dominio
 * propio sí se aplica.
 */
const adultsPath = `${basePath}/noche-magik/mayores`;

function siteRoot(): string | null {
  if (!siteConfig.url) return null;
  const url = siteConfig.url.replace(/\/+$/, "");
  return basePath && url.endsWith(basePath) ? url : `${url}${basePath}`;
}

export default function robots(): MetadataRoute.Robots {
  const root = siteRoot();
  return {
    rules: {
      userAgent: "*",
      allow: `${basePath}/`,
      // Con y sin barra final: la segunda también cubre la dirección que el
      // host redirige a la carpeta.
      disallow: [`${adultsPath}/`, adultsPath],
    },
    // Robots.txt pide la dirección absoluta del sitemap: sin dominio
    // configurado (NEXT_PUBLIC_SITE_URL) se omite.
    ...(root ? { sitemap: `${root}/sitemap.xml` } : {}),
  };
}
