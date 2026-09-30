import { StarShape } from "@/components/ui/Motif";
import type { BrandConfig } from "@/lib/types";

type Motif = BrandConfig["motif"];

/**
 * Detalle chico del motivo de la marca, para acompañar un título, una tarjeta
 * o un separador: tres tiras de confeti en Daale, tres estrellas en Noche
 * Magik. Decorativo, sin área táctil y nunca los dos motivos juntos.
 */
export function MotifMark({ motif, className = "" }: { motif: Motif; className?: string }) {
  if (motif === "confetti") {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 44 20"
        className={`h-5 w-11 shrink-0 ${className}`}
      >
        <rect x="1" y="7" width="12" height="4.6" rx="2.3" transform="rotate(-24 7 9.3)" className="fill-brand-red" />
        <rect x="16.5" y="4" width="11" height="4.6" rx="2.3" transform="rotate(32 22 6.3)" className="fill-brand-violet" />
        <rect x="31" y="10" width="12" height="4.6" rx="2.3" transform="rotate(-12 37 12.3)" className="fill-brand-blue" />
      </svg>
    );
  }
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-end gap-1 ${className}`}>
      <StarShape size={10} color="var(--star-blue)" className="mb-2" />
      <StarShape size={20} color="var(--star-gold)" />
      <StarShape size={9} color="var(--star-lavender)" className="mb-3" />
    </span>
  );
}

/**
 * Un puñado de confeti para una esquina. El componente Confetti compartido
 * reparte piezas en superficies grandes; en una esquina chica quedaban como
 * puntitos, así que acá las piezas tienen un tamaño legible.
 */
export function ConfettiBurst({ className = "", opacity = 0.8 }: { className?: string; opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 80 60"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <rect x="6" y="10" width="14" height="5" rx="2.5" transform="rotate(-30 13 12.5)" className="fill-brand-red" />
      <rect x="30" y="4" width="12" height="5" rx="2.5" transform="rotate(24 36 6.5)" className="fill-brand-violet" />
      <rect x="54" y="14" width="13" height="5" rx="2.5" transform="rotate(-8 60.5 16.5)" className="fill-brand-blue" />
      <rect x="18" y="34" width="11" height="5" rx="2.5" transform="rotate(52 23.5 36.5)" className="fill-brand-blue" />
      <rect x="44" y="40" width="12" height="5" rx="2.5" transform="rotate(-40 50 42.5)" className="fill-brand-red" />
    </svg>
  );
}

/** Separador con el motivo al comienzo de la línea. */
export function MotifDivider({ motif }: { motif: Motif }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-4">
      <MotifMark motif={motif} />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
