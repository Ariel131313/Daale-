"use client";

// Primero: suma el catálogo para mayores (solo esta ruta lo carga).
import "./registro";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Configurator } from "@/components/configurator/Configurator";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Motif";
import { getBrand } from "@/config/brands";
import {
  confirmAdult,
  forgetAdultOnExit,
  getAdultServerSnapshot,
  getAdultSnapshot,
  subscribeAdult,
} from "./confirmation";

/**
 * Puerta del recorrido para mayores de 18. Nada del recorrido se muestra (ni
 * se incluye en el HTML estático) antes de que la persona confirme su edad.
 * "No, volver" y "Salir de esta sección" reemplazan la entrada del historial:
 * con el botón Atrás no se vuelve a caer en esta página.
 */
export function AdultsGate() {
  const confirmed = useSyncExternalStore(
    subscribeAdult,
    getAdultSnapshot,
    getAdultServerSnapshot
  );
  const exitHref = getBrand("noche-magik").path;

  // Solo se mueve el foco cuando la persona acaba de confirmar, no al
  // recuperar una confirmación guardada al recargar.
  const justConfirmed = useRef(false);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (confirmed && justConfirmed.current) {
      justConfirmed.current = false;
      noticeRef.current?.focus();
    }
  }, [confirmed]);

  const handleConfirm = () => {
    justConfirmed.current = true;
    confirmAdult();
  };

  if (!confirmed) {
    return <AgeQuestion exitHref={exitHref} onConfirm={handleConfirm} />;
  }

  return (
    <>
      <div className="border-b border-line bg-bg-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6">
          <p
            ref={noticeRef}
            tabIndex={-1}
            className="flex items-center gap-2.5 py-3 text-base text-ink-muted"
          >
            <span
              aria-hidden="true"
              className="shrink-0 rounded-full border border-nm-gold px-2 py-0.5 text-sm font-semibold text-nm-gold"
            >
              18+
            </span>
            Estás en el recorrido separado para mayores de 18.
          </p>
          <Link
            href={exitHref}
            replace
            onClick={forgetAdultOnExit}
            className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
          >
            Salir de esta sección
          </Link>
        </div>
      </div>
      <Configurator brandId="noche-magik" mode="adults-only" />
    </>
  );
}

function AgeQuestion({
  exitHref,
  onConfirm,
}: {
  exitHref: string;
  onConfirm: () => void;
}) {
  return (
    <section
      aria-labelledby="mayores-titulo"
      className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-16"
    >
      <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-nm-gold font-display text-lg text-nm-gold"
          >
            18+
          </span>
          <Stars className="h-14 w-32" opacity={0.7} />
        </div>

        <h1
          id="mayores-titulo"
          className="mt-6 font-display text-[clamp(2.1rem,1.4rem+2.4vw,3rem)] leading-[1.12] text-balance"
        >
          Esta sección es solo para mayores de 18
        </h1>
        <p id="mayores-pregunta" className="mt-5 text-xl font-semibold">
          ¿Tenés 18 años o más?
        </p>

        <div
          role="group"
          aria-labelledby="mayores-pregunta"
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" onClick={onConfirm}>
            Sí, tengo 18 o más
          </Button>
          <ButtonLink href={exitHref} replace size="lg" variant="secondary">
            No, volver
          </ButtonLink>
        </div>

        <p className="mt-8 border-t border-line pt-5 text-base text-ink-muted">
          Es una confirmación personal, no una verificación legal de edad. No te
          pedimos documentos ni fecha de nacimiento. Tu respuesta queda solo en
          esta pestaña del navegador y se olvida al cerrarla.
        </p>
      </div>
    </section>
  );
}
