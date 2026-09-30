import { DirectWhatsAppLink } from "@/components/site/WhatsApp";
import { ButtonLink } from "@/components/ui/Button";
import { StarShape } from "@/components/ui/Motif";
import type { BrandConfig } from "@/lib/types";
import type { LandingCopy } from "./content";
import { ConfettiBurst, MotifMark } from "./Ornaments";

/** Cierre: las mismas dos salidas del hero, para quien llegó hasta el final. */
export function ClosingCta({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  const night = brand.motif === "stars";
  return (
    <section aria-labelledby="cierre-titulo" data-sin-flotante className="px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-line bg-surface px-5 py-12 text-center sm:px-12 sm:py-16">
        {/* Motivo solo en las esquinas, lejos del texto y de los botones. */}
        {night ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <StarShape size={16} color="var(--star-gold)" className="absolute left-5 top-5 sm:left-8 sm:top-8" />
            <StarShape size={9} color="var(--star-blue)" className="absolute left-12 top-12 hidden sm:block" />
            <StarShape size={12} color="var(--star-lavender)" className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10" />
          </div>
        ) : (
          <>
            <ConfettiBurst className="absolute left-5 top-5 hidden w-20 sm:block" opacity={0.75} />
            <ConfettiBurst className="absolute bottom-5 right-5 hidden w-16 rotate-180 sm:block" opacity={0.65} />
          </>
        )}

        <div className="relative">
          <div className="flex justify-center">
            <MotifMark motif={brand.motif} />
          </div>
          <h2
            id="cierre-titulo"
            className={`${copy.display} mx-auto mt-4 max-w-2xl text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance text-ink`}
          >
            {copy.closingTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-ink-muted">{copy.closingText}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={brand.configuratorPath} size="lg">
              Armá tu evento
            </ButtonLink>
            <DirectWhatsAppLink brandId={brand.id} location="cierre" size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
