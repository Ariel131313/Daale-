import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";
import { BrandMotif } from "@/components/ui/Motif";
import { brandList } from "@/config/brands";

/**
 * 404 de todo el sitio (en la exportación estática sale como 404.html). Tema
 * neutral de la portada: no pertenece a ninguna marca, pero ofrece entrar
 * directo a cada una. Next agrega solo el noindex de las respuestas 404.
 */
export const metadata: Metadata = {
  title: "No encontramos esta página · Daale y Noche Magik",
  description: "La dirección no existe o cambió. Seguí por la portada o entrá a Daale o a Noche Magik.",
};

export default function NotFound() {
  return (
    <div data-brand="root" className="flex min-h-dvh flex-col bg-bg text-ink">
      <main id="contenido" className="flex-1">
        <section
          aria-labelledby="no-encontrada-titulo"
          className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24"
        >
          <div className="max-w-2xl">
            <h1
              id="no-encontrada-titulo"
              className="font-display text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] font-semibold leading-[1.1] text-balance"
            >
              No encontramos esta página
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Puede que el enlace esté incompleto o que la página ya no exista. Podés
              volver a la portada o entrar directo a la marca que buscabas.
            </p>
            <div className="mt-8">
              <ButtonLink href="/" size="lg">
                Ir a la portada
              </ButtonLink>
            </div>
          </div>
        </section>

        <section aria-labelledby="no-encontrada-marcas" className="border-t border-line bg-bg-soft">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
            <h2
              id="no-encontrada-marcas"
              className="font-display text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] font-semibold leading-tight"
            >
              ¿Buscabas alguna de estas?
            </h2>
            <ul className="mt-7 grid gap-4 md:grid-cols-2 md:gap-6">
              {brandList.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={brand.path}
                    className="group flex h-full flex-col rounded-[var(--radius-card)] border-2 border-line bg-surface p-6 transition-colors hover:border-primary sm:p-8"
                  >
                    {/*
                      El logo y el motivo comparten fila para que el motivo nunca
                      lo tape. El nombre ya está escrito abajo: el logo no se lee
                      dos veces con lector de pantalla.
                    */}
                    <div aria-hidden="true" className="flex h-24 items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center">
                        <BrandLogo
                          logo={brand.logos.compact}
                          height={brand.logos.compact.plate ? 80 : 56}
                          plateClassName="p-1.5"
                        />
                      </div>
                      {/* Confeti solo en Daale, estrellas solo en Noche Magik. */}
                      <BrandMotif motif={brand.motif} className="h-14 w-20 shrink-0 sm:w-28" opacity={0.6} />
                    </div>
                    <span className="mt-5 font-display text-2xl font-semibold">{brand.name}</span>
                    <span className="mt-1.5 text-ink-muted">{brand.chooserLine}</span>
                    <span className="mt-6 inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 group-hover:decoration-4">
                      {brand.chooserCta}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
