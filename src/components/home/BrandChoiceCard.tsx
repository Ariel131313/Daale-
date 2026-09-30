import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { buttonClasses } from "@/components/ui/Button";
import type { BrandConfig } from "@/lib/types";
import { CardConfetti, CardStars } from "./CardMotifs";
import styles from "./home.module.css";
import { homeLooks } from "./looks";

/**
 * Tarjeta de elección de marca. Toda la tarjeta se puede tocar, pero hay un
 * solo enlace real: el botón, cuyo ::after se estira sobre la tarjeta. Así el
 * lector de pantalla anuncia "Entrar a Daale" y no el texto completo.
 */
export function BrandChoiceCard({ brand }: { brand: BrandConfig }) {
  const look = homeLooks[brand.id];
  const titleId = `eleccion-${brand.id}`;

  return (
    <article
      data-brand={brand.id}
      aria-labelledby={titleId}
      className={`${styles.card} ${look.card} group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] text-ink`}
    >
      <div className="relative flex h-36 items-center px-5 sm:h-44 sm:px-7 md:h-52 lg:h-60 lg:px-10">
        {brand.motif === "confetti" ? <CardConfetti /> : <CardStars />}
        <BrandLogo
          logo={brand.logos.full}
          height={look.logoHeight}
          className={look.logoClassName}
          plateClassName={look.plateClassName}
          priority
        />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 sm:px-7 sm:pb-8 lg:px-10 lg:pb-10">
        <h2
          id={titleId}
          className={`font-display text-[clamp(1.5rem,0.9rem+1.3vw,2rem)] leading-[1.15] text-balance ${look.titleWeight}`}
        >
          <span className="sr-only">{brand.name}: </span>
          {brand.chooserLine}
        </h2>
        <p className="mt-3 text-pretty text-ink-muted sm:text-lg">{brand.chooserExamples}</p>
        <div className="mt-auto pt-6">
          <Link
            href={brand.path}
            data-brand-choice={brand.id}
            data-choice-location="tarjeta"
            className={buttonClasses({
              size: "lg",
              className: `w-full group-hover:bg-primary-hover after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:content-[''] sm:w-auto`,
            })}
          >
            {brand.chooserCta}
          </Link>
        </div>
      </div>
    </article>
  );
}
