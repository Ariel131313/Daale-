import type { BrandConfig } from "@/lib/types";
import type { LandingCopy } from "./content";

/** Los números de Daale toman los tres colores del logo, en tonos que pasan AA. */
const DAALE_NUMBER_COLORS = ["text-accent-1", "text-accent-2", "text-accent-3"];

/** Tres pasos en orden: es una secuencia real, por eso va numerada. */
export function HowItWorks({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  const night = brand.motif === "stars";
  return (
    <section aria-labelledby="como-funciona-titulo" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="grid gap-8 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2.25fr)] lg:gap-12 lg:px-10">
        <div>
          <h2
            id="como-funciona-titulo"
            className={`${copy.display} text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance`}
          >
            {copy.howTitle}
          </h2>
          <p className="mt-2 text-ink-muted">{copy.howIntro}</p>
        </div>
        {/* En el celular el número va al lado del título; desde sm, arriba y unido al siguiente. */}
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-6">
          {brand.howItWorks.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 sm:block">
              <div className="flex items-center gap-3 self-start">
                <span
                  aria-hidden="true"
                  className={`${copy.display} text-[2.6rem] leading-none ${
                    night ? "text-accent-2" : DAALE_NUMBER_COLORS[i]
                  }`}
                >
                  {i + 1}
                </span>
                {i < brand.howItWorks.length - 1 ? (
                  <span aria-hidden="true" className="hidden h-0.5 flex-1 rounded-full bg-line sm:block" />
                ) : null}
              </div>
              <div>
                <h3 className="pt-1 text-lg font-semibold leading-snug text-ink sm:mt-3 sm:pt-0">{step.title}</h3>
                <p className="mt-1.5 text-pretty text-ink-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
