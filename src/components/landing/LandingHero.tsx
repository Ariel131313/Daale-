import { DirectWhatsAppLink } from "@/components/site/WhatsApp";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";
import { hasMedia, MediaImage } from "@/components/ui/Media";
import { StarShape } from "@/components/ui/Motif";
import type { BrandConfig } from "@/lib/types";
import type { LandingCopy } from "./content";
import { ConfettiBurst, MotifMark } from "./Ornaments";
import { ResumeNotice } from "./ResumeNotice";

/**
 * Hero de la marca: título, las dos salidas (armar el evento o escribir
 * directo) y una imagen. Sin imagen publicable, el lado visual lo ocupa el
 * logo con el motivo de la marca, así el hero se ve completo igual.
 */
export function LandingHero({
  brand,
  copy,
  businessAnchor,
}: {
  brand: BrandConfig;
  copy: LandingCopy;
  /** Id del acceso a empresas en la página; null si no se muestra. */
  businessAnchor: string | null;
}) {
  const night = brand.motif === "stars";
  const withImage = hasMedia(brand.hero.image);

  return (
    <section aria-labelledby="hero-titulo" className="relative isolate overflow-hidden">
      {night ? (
        // Único gradiente de la página: luz de luna sobre el cielo de noche.
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 75% 60% at 90% -5%, rgba(88, 168, 208, 0.2), transparent 70%)",
          }}
        />
      ) : null}
      {/* Sin foto, el motivo ya acompaña al logo del lado visual. */}
      {withImage ? <HeroCornerAccents night={night} /> : null}

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-9 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <MotifMark motif={brand.motif} />
          <h1
            id="hero-titulo"
            className={`${copy.display} mt-4 text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-[1.08] text-balance text-ink`}
          >
            {brand.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-ink-muted sm:text-[1.2rem] sm:leading-relaxed">
            {brand.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={brand.configuratorPath} size="lg">
              Armá tu evento
            </ButtonLink>
            <DirectWhatsAppLink brandId={brand.id} location="hero" size="lg" />
          </div>
          <ResumeNotice brandId={brand.id} />
          {businessAnchor ? (
            <p className="mt-6 text-ink-muted">
              {copy.businessHint.question}{" "}
              <AnchorLink
                href={`#${businessAnchor}`}
                className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
              >
                {copy.businessHint.link}
              </AnchorLink>
            </p>
          ) : null}
        </div>

        <HeroVisual brand={brand} copy={copy} withImage={withImage} />
      </div>
    </section>
  );
}

/**
 * Unos pocos detalles del motivo en la esquina superior, sobre el lado de la
 * imagen y por encima de ella: no tocan texto, botones ni la foto.
 */
function HeroCornerAccents({ night }: { night: boolean }) {
  if (night) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-24">
        <StarShape size={18} color="var(--star-gold)" className="absolute right-[6%] top-5" />
        <StarShape size={10} color="var(--star-blue)" className="absolute right-[20%] top-12 hidden sm:block" />
        <StarShape size={8} color="var(--star-lavender)" className="absolute right-[34%] top-4 hidden lg:block" />
      </div>
    );
  }
  return <ConfettiBurst className="absolute right-[3%] top-6 -z-10 hidden w-28 lg:block" opacity={0.75} />;
}

function HeroVisual({
  brand,
  copy,
  withImage,
}: {
  brand: BrandConfig;
  copy: LandingCopy;
  withImage: boolean;
}) {
  const night = brand.motif === "stars";

  if (withImage) {
    return (
      <div className="relative">
        {!night ? (
          // Tarjeta lavanda apenas girada detrás de la foto: el gesto lúdico de Daale.
          <div
            aria-hidden="true"
            className="absolute -inset-2 -z-10 rotate-[2.5deg] rounded-[1.75rem] bg-brand-violet/10 sm:-inset-3"
          />
        ) : null}
        <MediaImage
          id={brand.hero.image}
          priority
          sizes="(min-width: 1024px) 46vw, 100vw"
          className={`aspect-[16/10] w-full rounded-[var(--radius-card)] bg-surface-2 ${
            night ? "ring-1 ring-line" : ""
          }`}
        />
        {copy.heroLogoBadge ? (
          // A la derecha: la leyenda «Imagen ilustrativa» va abajo a la izquierda.
          <div className="absolute -bottom-7 right-3 sm:-right-3">
            <BrandLogo
              logo={brand.logos.full}
              height={104}
              priority
              plateClassName="p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (night) {
    return (
      <div className="relative flex justify-center py-2 lg:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <StarShape size={22} color="var(--star-gold)" className="absolute left-[6%] top-[12%]" />
          <StarShape size={12} color="var(--star-blue)" className="absolute right-[9%] top-[22%]" />
          <StarShape size={10} color="var(--star-lavender)" className="absolute bottom-[14%] left-[14%]" />
          <StarShape size={14} color="var(--star-gold)" className="absolute bottom-[26%] right-[5%]" />
        </div>
        <BrandLogo
          logo={brand.logos.full}
          height={230}
          priority
          plateClassName="relative p-5 shadow-[0_0_90px_rgba(155,208,240,0.28)] sm:p-7"
        />
      </div>
    );
  }

  return (
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem] bg-bg-soft px-6 sm:aspect-[16/10] lg:aspect-[4/3]">
      <ConfettiBurst className="absolute left-4 top-4 w-20 sm:w-24" />
      <ConfettiBurst className="absolute bottom-4 right-4 w-16 rotate-180 sm:w-20" opacity={0.7} />
      <BrandLogo logo={brand.logos.full} height={128} priority className="relative" />
    </div>
  );
}
