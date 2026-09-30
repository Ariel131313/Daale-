import { DirectWhatsAppLink } from "@/components/site/WhatsApp";
import { faq } from "@/config/faq";
import { siteConfig } from "@/config/site";
import type { BrandConfig } from "@/lib/types";
import type { LandingCopy } from "./content";

/**
 * Preguntas frecuentes de la marca con <details>/<summary>: se abren con
 * teclado, el lector de pantalla anuncia si están abiertas y funcionan sin
 * JavaScript. Las de empresas solo aparecen si la marca tiene acceso a
 * empresas. En la versión de revisión, las respuestas genéricas que esperan la
 * política real quedan marcadas como provisorias.
 */
export function LandingFaq({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  const items = faq.filter((item) => item.brand === brand.id && (!item.businessOnly || brand.business));
  if (items.length === 0) return null;
  const review = siteConfig.flags.showReviewBadges;

  return (
    <section aria-labelledby="preguntas-titulo" data-sin-flotante className="bg-bg-soft py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14">
        <div>
          <h2
            id="preguntas-titulo"
            className={`${copy.display} text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance`}
          >
            {copy.faqTitle}
          </h2>
          <p className="mt-3 text-pretty text-ink-muted">{copy.faqIntro}</p>
          <div className="mt-5">
            <DirectWhatsAppLink brandId={brand.id} location="preguntas" />
          </div>
        </div>

        <div className="border-b border-line">
          {items.map((item) => (
            <details key={item.id} className="group border-t border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold leading-snug text-ink [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-field-border text-ink transition-transform duration-200 group-open:rotate-45"
                >
                  <svg viewBox="0 0 16 16" className="size-3.5" focusable="false">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <div className="pb-6 pr-2 sm:pr-12">
                <p className="text-pretty text-ink-muted">{item.answer}</p>
                {review && item.pendingPolicy ? (
                  <p className="mt-3">
                    <span className="inline-block rounded-full border border-dashed border-field-border px-2.5 py-0.5 text-sm font-semibold text-ink-muted">
                      Respuesta provisoria
                    </span>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
