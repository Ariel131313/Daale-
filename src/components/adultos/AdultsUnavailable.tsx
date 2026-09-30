import { ButtonLink } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Motif";
import { getBrand } from "@/config/brands";

/**
 * Lo que se ve en /noche-magik/mayores mientras la categoría está apagada.
 * Sobrio a propósito: no nombra ni insinúa qué habría en la sección, solo
 * ofrece seguir por Noche Magik o volver a la portada.
 */
export function AdultsUnavailable() {
  const brand = getBrand("noche-magik");
  return (
    <section
      aria-labelledby="no-disponible-titulo"
      className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pb-32 sm:pt-20"
    >
      <div className="max-w-2xl">
        <Stars className="h-12 w-28" opacity={0.6} />
        <h1
          id="no-disponible-titulo"
          className="mt-6 font-display text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-[1.1] text-balance"
        >
          Esta sección no está disponible
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">
          La página que buscás no está publicada. Podés ver lo que {brand.name}{" "}
          hace para fiestas y eventos de noche, o volver a la portada y elegir
          otra experiencia.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={brand.path} size="lg">
            Ir a {brand.name}
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="secondary">
            Volver a la portada
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
