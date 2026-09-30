/**
 * Prefija rutas de /public con el basePath de GitHub Pages. next/link lo hace
 * solo; las imágenes y los <img> planos no.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
