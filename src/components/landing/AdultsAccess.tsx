import Link from "next/link";
import { adultCategoryAvailable, eventTypesFor } from "@/lib/audience";
import type { BrandConfig } from "@/lib/types";
import type { LandingCopy } from "./content";

/**
 * Acceso discreto al recorrido separado para mayores de 18. Solo existe en
 * Noche Magik y solo con siteConfig.flags.enableAdultCategory encendido: con
 * el flag apagado no se dibuja nada, ni texto ni enlace. Va al final de la
 * página, sin imágenes y sin motivos decorativos.
 */
export function AdultsAccess({ brand, copy }: { brand: BrandConfig; copy: LandingCopy }) {
  if (!adultCategoryAvailable(brand.id) || !copy.adults) return null;
  if (eventTypesFor(brand.id, "adults-only").length === 0) return null;

  return (
    <section aria-labelledby="mayores-titulo" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-2xl">
          <h2 id="mayores-titulo" className="text-xl font-semibold leading-snug text-ink">
            {copy.adults.title}
          </h2>
          <p className="mt-2 text-pretty text-ink-muted">{copy.adults.text}</p>
          <p className="mt-3">
            <Link
              href={`${brand.path}/mayores`}
              rel="nofollow"
              className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              {copy.adults.cta}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
