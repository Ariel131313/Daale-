import type { MetadataRoute } from "next";
import { brandList } from "@/config/brands";
import { siteConfig } from "@/config/site";
import { basePath } from "@/lib/paths";

// La exportación estática solo genera /sitemap.xml si la ruta es estática.
export const dynamic = "force-static";

/**
 * Raíz pública del sitio, con el basePath de GitHub Pages si lo hay.
 *
 * El sitemap exige direcciones absolutas: completar NEXT_PUBLIC_SITE_URL con el
 * dominio definitivo antes de publicar (por ejemplo https://daale.com.ar, o
 * https://usuario.github.io/repo; si ya incluye el basePath no se repite).
 * Mientras falte, las direcciones salen relativas al sitio: sirven para
 * revisar el listado, pero los buscadores no las aceptan.
 */
function siteRoot(): string {
  if (!siteConfig.url) return basePath;
  const url = siteConfig.url.replace(/\/+$/, "");
  return basePath && url.endsWith(basePath) ? url : `${url}${basePath}`;
}

/**
 * Solo las páginas públicas y aptas para todo público: la portada, cada marca
 * y su configurador. /noche-magik/mayores/ queda afuera a propósito.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const root = siteRoot();
  // Con trailingSlash, cada página se publica como carpeta: /daale/.
  const paths = [
    "/",
    ...brandList.map((brand) => `${brand.path}/`),
    ...brandList.map((brand) => `${brand.configuratorPath}/`),
  ];
  return paths.map((path) => ({ url: `${root}${path}` }));
}
