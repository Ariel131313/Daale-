"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import {
  analyticsConfigured,
  analyticsTools,
  consentNeeded,
  reopenConsent,
  setConsent,
  subscribeConsent,
} from "@/lib/analytics";

/** Nombra solo los servicios que de verdad están configurados. */
function toolNames(): string {
  const names = [analyticsTools.ga4 ? "Google Analytics" : null, analyticsTools.meta ? "Meta" : null];
  return names.filter(Boolean).join(" y ");
}

/**
 * Aviso de analítica. Solo aparece si hay IDs de GA4 o Meta configurados; sin
 * ellos no hay nada que aceptar. No bloquea la página ni tapa controles: es una
 * barra baja y se puede ignorar. El HTML estático nunca lo incluye: aparece
 * recién en el navegador, después de leer si ya se decidió.
 */
export function ConsentBanner() {
  const visible = useSyncExternalStore(subscribeConsent, consentNeeded, () => false);

  if (!visible) return null;

  return (
    <section
      aria-label="Aviso de medición"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-4 text-ink shadow-xl sm:p-5"
    >
      <p className="text-base">
        Usamos {toolNames()} para saber qué opciones se eligen en la web, como el tipo de evento o
        los servicios. No registramos tu nombre, tus notas ni tus datos de contacto.
        {analyticsTools.meta ? " Meta también usa estos datos para publicidad." : null} ¿Nos dejás
        medir tu visita?
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button onClick={() => setConsent("granted")}>Sí, acepto</Button>
        <Button variant="secondary" onClick={() => setConsent("denied")}>
          No, gracias
        </Button>
      </div>
    </section>
  );
}

/**
 * Enlace del pie para cambiar la decisión. Solo existe si hay analítica
 * configurada: sin IDs no hay nada que elegir.
 */
export function ConsentPreferences({ className = "" }: { className?: string }) {
  if (!analyticsConfigured) return null;
  return (
    <button
      type="button"
      onClick={reopenConsent}
      className={`inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 hover:decoration-4 ${className}`}
    >
      Preferencias de medición
    </button>
  );
}
