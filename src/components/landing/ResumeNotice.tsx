"use client";

import { useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { getBrand } from "@/config/brands";
import { hasSavedConfigurator } from "@/lib/storage";
import type { BrandId } from "@/lib/types";

const subscribeNothing = () => () => {};

/**
 * «Tenés un evento a medio armar»: solo aparece si en este dispositivo quedó
 * una configuración empezada de la marca. El servidor y la hidratación ven
 * "no hay nada" y el navegador lo corrige al leer el almacenamiento, sin
 * efectos que pisen estado. Si el almacenamiento no está disponible, no se ve.
 */
export function ResumeNotice({ brandId }: { brandId: BrandId }) {
  const hasSaved = useSyncExternalStore(
    subscribeNothing,
    () => hasSavedConfigurator(brandId, "general", Date.now()),
    () => false
  );

  if (!hasSaved) return null;

  const brand = getBrand(brandId);
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-selected bg-selected-bg p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pl-5">
      <div>
        <p className="font-semibold text-ink">Tenés un evento a medio armar</p>
        <p className="text-base text-ink-muted">Tus respuestas quedaron guardadas en este dispositivo.</p>
      </div>
      <ButtonLink href={brand.configuratorPath} variant="secondary" className="shrink-0">
        Seguir donde quedé
      </ButtonLink>
    </div>
  );
}
