import { getMedia } from "@/config/media";
import { withBase } from "@/lib/paths";
import type { MediaId } from "@/lib/types";

/**
 * Imagen optimizada con srcset y carga diferida. Las generadas con IA llevan
 * la leyenda "Imagen ilustrativa" para no presentarlas como trabajos reales.
 * Si la imagen no es publicable o no existe, no se renderiza nada.
 */
export function MediaImage({
  id,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  className = "",
  imgClassName = "",
  priority = false,
  showTag = true,
  decorative = false,
}: {
  id: MediaId | undefined;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showTag?: boolean;
  /**
   * La imagen acompaña a un texto que ya dice lo mismo (por ejemplo, dentro de
   * una tarjeta de opción): el lector de pantalla la saltea. La leyenda
   * «Imagen ilustrativa» se sigue viendo.
   */
  decorative?: boolean;
}) {
  const media = getMedia(id);
  if (!media) return null;
  const srcSet = media.srcSet?.map((v) => `${withBase(v.src)} ${v.width}w`).join(", ");
  return (
    <figure className={`relative overflow-hidden ${className}`} aria-hidden={decorative || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- exportación estática: las fotos ya vienen optimizadas */}
      <img
        src={withBase(media.src)}
        srcSet={srcSet}
        sizes={sizes}
        width={media.width}
        height={media.height}
        alt={decorative ? "" : media.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      {media.generated && showTag ? (
        <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-semibold text-white">
          Imagen ilustrativa
        </figcaption>
      ) : null}
    </figure>
  );
}

export function hasMedia(id: MediaId | undefined): boolean {
  return getMedia(id) !== null;
}
