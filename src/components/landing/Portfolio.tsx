import { MediaImage } from "@/components/ui/Media";
import { getMedia } from "@/config/media";
import { siteConfig } from "@/config/site";
import type { BrandConfig, MediaId, MediaItem } from "@/lib/types";
import type { LandingCopy } from "./content";

/**
 * Portfolio de trabajos reales. Queda preparado pero no se muestra mientras
 * siteConfig.flags.showPortfolio esté apagado o no haya material autorizado:
 * nada de imágenes de relleno ni generadas con IA presentadas como trabajos.
 */
export function Portfolio({
  brand,
  copy,
  items,
}: {
  brand: BrandConfig;
  copy: LandingCopy;
  items: MediaId[];
}) {
  if (!siteConfig.flags.showPortfolio) return null;

  const media = items
    .map((id) => getMedia(id))
    .filter((m): m is MediaItem => m !== null && !m.generated && m.authorized);
  if (media.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-titulo" className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="portfolio-titulo"
          className={`${copy.display} text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance`}
        >
          {copy.portfolioTitle}
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {media.map((m) => (
            <li key={m.id}>
              <MediaImage
                id={m.id}
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="aspect-square w-full rounded-[var(--radius-card)] bg-surface-2"
              />
            </li>
          ))}
        </ul>
        {brand.instagram ? (
          <p className="mt-6">
            <a
              href={brand.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              Ver más en Instagram @{brand.instagram.handle}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
