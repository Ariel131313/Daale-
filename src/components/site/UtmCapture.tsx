"use client";

import { useEffect } from "react";
import { loadAdapters } from "@/lib/analytics";
import { captureUtm } from "@/lib/utm";

/** Guarda los UTM de la URL de entrada y carga la analítica si ya hay consentimiento. */
export function UtmCapture() {
  useEffect(() => {
    captureUtm(window.location.search);
    loadAdapters();
  }, []);
  return null;
}
