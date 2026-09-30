"use client";

import { useEffect } from "react";
import { brandList } from "@/config/brands";
import { track } from "@/lib/analytics";

/**
 * Analítica de la portada, sin interfaz. Registra la vista y, con un solo
 * listener, cada clic en un enlace marcado con data-brand-choice. Así las
 * tarjetas siguen siendo componentes de servidor.
 */
export function HomeAnalytics() {
  useEffect(() => {
    track("landing_view", { brand: "root" });

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLElement>("[data-brand-choice]");
      const brand = link?.dataset.brandChoice;
      if (!link || !brandList.some((b) => b.id === brand)) return;
      track("brand_selected", { brand, location: link.dataset.choiceLocation });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
