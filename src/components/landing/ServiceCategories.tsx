import { ButtonLink } from "@/components/ui/Button";
import { hasMedia, MediaImage } from "@/components/ui/Media";
import { getMedia } from "@/config/media";
import { allServiceCategories } from "@/config/catalog";
import { servicesFor } from "@/lib/audience";
import type { BrandConfig, Service } from "@/lib/types";
import type { LandingCopy } from "./content";
import { MotifDivider } from "./Ornaments";

/** Cuántos servicios se describen por categoría; el resto se nombra en una línea. */
const FEATURED_PER_CATEGORY = 4;

const listFormat = new Intl.ListFormat("es", { style: "long", type: "conjunction" });

interface Category {
  key: string;
  label: string;
  featured: Service[];
  more: Service[];
  lead: Service | undefined;
}

/**
 * Qué puede llevar la marca, agrupado por las categorías reales del catálogo.
 * Es informativo, no se elige nada acá. servicesFor sin tipo de evento ya deja
 * afuera todo lo exclusivo para mayores.
 */
export function ServiceCategories({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  const all = servicesFor(brand.id, null, "general");

  const categories: Category[] = Object.entries(allServiceCategories())
    .map(([key, label]) => {
      const inCategory = all.filter((s) => s.category === key);
      // Primero lo confirmado; dentro de cada grupo se respeta la prioridad comercial.
      const ordered = [
        ...inCategory.filter((s) => !s.pendingConfirmation),
        ...inCategory.filter((s) => s.pendingConfirmation),
      ];
      return {
        key,
        label,
        featured: ordered.slice(0, FEATURED_PER_CATEGORY),
        more: ordered.slice(FEATURED_PER_CATEGORY),
        lead: inCategory.find((s) => hasMedia(s.image)),
      };
    })
    .filter((c) => c.featured.length > 0);

  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categorias-titulo" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="categorias-titulo"
            className={`${copy.display} text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance`}
          >
            {brand.categoriesTitle}
          </h2>
          <p className="mt-3 text-lg text-pretty text-ink-muted">{copy.categoriesIntro}</p>
        </div>

        <ul className="mt-10 flex flex-col gap-10 sm:mt-12 sm:gap-12">
          {categories.map((category, index) => (
            <li key={category.key} className="flex flex-col gap-10 sm:gap-12">
              {index > 0 ? <MotifDivider motif={brand.motif} /> : null}
              <CategoryRow category={category} copy={copy} />
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          <ButtonLink href={brand.configuratorPath} size="lg">
            Armá tu evento
          </ButtonLink>
          <p className="text-ink-muted">Elegís lo que te guste y nos lo mandás por WhatsApp.</p>
        </div>
      </div>
    </section>
  );
}

function CategoryRow({ category, copy }: { category: Category; copy: LandingCopy }) {
  const titleId = `categoria-${category.key}-titulo`;
  const leadMedia = getMedia(category.lead?.image);
  // Las fotos verticales se encuadran desde arriba para no cortar al artista.
  const portrait = leadMedia ? leadMedia.height > leadMedia.width : false;
  const pendingMore = category.more.filter((s) => s.pendingConfirmation);

  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:gap-14"
    >
      <div>
        <h3 id={titleId} className={`${copy.display} text-[1.6rem] leading-tight text-ink`}>
          {category.label}
        </h3>
        {category.lead ? (
          <MediaImage
            id={category.lead.image}
            sizes="(min-width: 1152px) 460px, (min-width: 768px) 40vw, 100vw"
            className="mt-5 aspect-[16/10] w-full rounded-[var(--radius-card)] bg-surface-2 sm:aspect-[4/3]"
            imgClassName={portrait ? "object-top" : ""}
          />
        ) : null}
      </div>

      <div className="md:pt-1">
        <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 sm:gap-y-6">
          {category.featured.map((service) => (
            <li key={service.id}>
              <p className="text-lg font-semibold leading-snug text-ink">{service.name}</p>
              <p className="mt-1 text-pretty text-ink-muted">{service.shortDescription}</p>
              {service.pendingConfirmation ? <PendingBadge /> : null}
            </li>
          ))}
        </ul>

        {category.more.length > 0 ? (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-ink-muted">
              <span className="font-semibold text-ink">También: </span>
              {listFormat.format(category.more.map((s) => s.name))}.
            </p>
            {pendingMore.length > 0 ? (
              <PendingBadge label={`Pendiente de confirmar: ${listFormat.format(pendingMore.map((s) => s.name))}`} />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Solo en la versión de revisión: servicios que la marca todavía no confirmó. */
function PendingBadge({ label = "Pendiente de confirmar" }: { label?: string }) {
  return (
    <span className="mt-2 inline-block rounded-full border border-dashed border-field-border px-2.5 py-0.5 text-sm font-semibold text-ink-muted">
      {label}
    </span>
  );
}
