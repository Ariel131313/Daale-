"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { BrandId } from "@/lib/types";

/** Registra la visita a la landing de la marca. No dibuja nada. */
export function LandingView({ brandId }: { brandId: BrandId }) {
  useEffect(() => {
    track("landing_view", { brand: brandId });
  }, [brandId]);
  return null;
}
