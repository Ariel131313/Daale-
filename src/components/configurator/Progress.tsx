"use client";

import { useEffect, useRef } from "react";

/**
 * Progreso real del configurador. El texto «Paso X de Y» es la información;
 * la fila de piezas lo acompaña con el motivo de la marca: en Daale cada paso
 * hecho suma una tira de confeti, en Noche Magik se enciende una estrella.
 * Lo pendiente se distingue por forma y tamaño, no solo por color.
 */

const CONFETTI = ["bg-brand-red", "bg-brand-violet", "bg-brand-blue"];

const STAR_PATH =
  "M12 0c.6 5.6 2.8 9.4 12 12-9.2 2.6-11.4 6.4-12 12-.6-5.6-2.8-9.4-12-12 9.2-2.6 11.4-6.4 12-12z";

function ConfettiTrack({ done, total }: { done: number; total: number }) {
  return (
    <span className="flex items-center gap-2 pt-3 sm:gap-2.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const lit = i < done;
        const current = i === done - 1;
        return (
          <span key={i} className="relative block flex-1">
            <span
              className={`block rounded-full transition-[height,background-color] duration-300 ${
                lit ? `h-3 ${CONFETTI[i % CONFETTI.length]}` : "h-2 bg-line"
              }`}
            />
            {current ? (
              // Dos tiras de confeti saltan donde estás parado.
              <>
                <span
                  className={`absolute -top-3 right-1 block h-1.5 w-3.5 rounded-full ${
                    CONFETTI[(i + 1) % CONFETTI.length]
                  } rotate-[35deg]`}
                />
                <span
                  className={`absolute -top-2 right-6 block h-1.5 w-2.5 rounded-full ${
                    CONFETTI[(i + 2) % CONFETTI.length]
                  } -rotate-[28deg]`}
                />
              </>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

function StarTrack({ done, total }: { done: number; total: number }) {
  return (
    <span className="relative flex items-center justify-between" aria-hidden="true">
      <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-line" />
      {Array.from({ length: total }, (_, i) => {
        const lit = i < done;
        return (
          <span key={i} className="relative grid size-8 place-items-center rounded-full bg-bg">
            <svg
              viewBox="0 0 24 24"
              focusable="false"
              className={`transition-[transform,opacity] duration-300 ${
                lit ? "size-7 scale-100" : "size-4 opacity-80"
              }`}
            >
              <path
                d={STAR_PATH}
                fill={lit ? (i % 3 === 1 ? "var(--star-blue)" : "var(--star-gold)") : "none"}
                stroke={lit ? "none" : "var(--field-border)"}
                strokeWidth={lit ? 0 : 1.6}
              />
            </svg>
          </span>
        );
      })}
    </span>
  );
}

export function StepProgress({
  motif,
  number,
  total,
  stepName,
  complete = false,
}: {
  motif: "confetti" | "stars";
  number: number;
  total: number;
  stepName: string;
  /** En el resumen: todos los pasos hechos. */
  complete?: boolean;
}) {
  // El paso actual cuenta como encendido: se ve que ya estás en él.
  const done = complete ? total : Math.min(number, total);
  const valueText = complete
    ? `Los ${total} pasos están completos`
    : `Paso ${number} de ${total}: ${stepName}`;
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-base text-ink">
        {complete ? (
          <span className="font-semibold">Todo listo para enviar</span>
        ) : (
          <>
            <span className="font-semibold">
              Paso {number} de {total}
            </span>
            <span className="text-ink-muted">: {stepName}</span>
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Avance del configurador"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={valueText}
      >
        {motif === "confetti" ? (
          <ConfettiTrack done={done} total={total} />
        ) : (
          <StarTrack done={done} total={total} />
        )}
      </div>
    </div>
  );
}

/**
 * Toque breve del motivo al llegar al resumen. Se anima con la API de
 * animaciones solo si la persona no pidió movimiento reducido.
 */
export function SummaryFlourish({ motif }: { motif: "confetti" | "stars" }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof root.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const pieces = Array.from(root.children) as HTMLElement[];
    const animations = pieces.map((el, i) =>
      el.animate(
        [
          { transform: "translateY(10px) scale(0.4)", opacity: 0 },
          { transform: "translateY(0) scale(1)", opacity: 1 },
        ],
        { duration: 420, delay: i * 60, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "backwards" }
      )
    );
    return () => animations.forEach((a) => a.cancel());
  }, []);

  if (motif === "confetti") {
    const bits = [
      { c: "bg-brand-red", r: "-rotate-12", w: "w-7", y: "mt-3" },
      { c: "bg-brand-violet", r: "rotate-[24deg]", w: "w-5", y: "mt-0" },
      { c: "bg-brand-blue", r: "-rotate-[30deg]", w: "w-6", y: "mt-5" },
      { c: "bg-brand-red", r: "rotate-[50deg]", w: "w-4", y: "mt-1" },
      { c: "bg-brand-violet", r: "-rotate-6", w: "w-6", y: "mt-4" },
    ];
    return (
      <span ref={ref} aria-hidden="true" className="flex items-start gap-2">
        {bits.map((b, i) => (
          <span key={i} className={`block h-2.5 rounded-full ${b.c} ${b.r} ${b.w} ${b.y}`} />
        ))}
      </span>
    );
  }

  const stars = [
    { s: 14, c: "var(--star-blue)", y: "mt-5" },
    { s: 24, c: "var(--star-gold)", y: "mt-0" },
    { s: 12, c: "var(--star-lavender)", y: "mt-6" },
    { s: 18, c: "var(--star-gold)", y: "mt-2" },
  ];
  return (
    <span ref={ref} aria-hidden="true" className="flex items-start gap-2.5">
      {stars.map((s, i) => (
        <svg key={i} width={s.s} height={s.s} viewBox="0 0 24 24" focusable="false" className={s.y}>
          <path d={STAR_PATH} fill={s.c} />
        </svg>
      ))}
    </span>
  );
}
