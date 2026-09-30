/**
 * Motivos gráficos por marca: confeti para Daale, estrellas para Noche Magik.
 * Nunca se mezclan en un mismo elemento. Son decorativos (aria-hidden), pocos,
 * de tamaños variados y con opacidad moderada, y no tapan texto ni controles.
 */

type Piece = { x: number; y: number; r: number; s: number; c: string };

const CONFETTI_COLORS = ["var(--confetti-red)", "var(--confetti-violet)", "var(--confetti-blue)"];

/** Confeti estilizado: tiras redondeadas en los tres colores del logo. */
export function Confetti({
  className = "",
  density = "few",
  opacity = 0.75,
}: {
  className?: string;
  density?: "few" | "some";
  opacity?: number;
}) {
  const pieces: Piece[] = [
    { x: 8, y: 14, r: -28, s: 1, c: CONFETTI_COLORS[0] },
    { x: 26, y: 62, r: 36, s: 0.8, c: CONFETTI_COLORS[1] },
    { x: 52, y: 22, r: 12, s: 0.65, c: CONFETTI_COLORS[2] },
    { x: 78, y: 70, r: -48, s: 0.9, c: CONFETTI_COLORS[0] },
    { x: 90, y: 30, r: 62, s: 0.7, c: CONFETTI_COLORS[1] },
  ];
  const more: Piece[] = [
    { x: 38, y: 88, r: -12, s: 0.6, c: CONFETTI_COLORS[2] },
    { x: 66, y: 44, r: 80, s: 0.55, c: CONFETTI_COLORS[0] },
    { x: 14, y: 84, r: 20, s: 0.7, c: CONFETTI_COLORS[1] },
  ];
  const all = density === "some" ? [...pieces, ...more] : pieces;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      {all.map((p, i) => (
        <rect
          key={i}
          x={p.x - 3 * p.s}
          y={p.y - 1.1 * p.s}
          width={6 * p.s}
          height={2.2 * p.s}
          rx={1.1 * p.s}
          fill={p.c}
          transform={`rotate(${p.r} ${p.x} ${p.y})`}
        />
      ))}
    </svg>
  );
}

/** Estrella de cuatro puntas como las del logo de Noche Magik. */
export function StarShape({
  size = 16,
  color = "var(--star-gold)",
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path
        d="M12 0c.6 5.6 2.8 9.4 12 12-9.2 2.6-11.4 6.4-12 12-.6-5.6-2.8-9.4-12-12 9.2-2.6 11.4-6.4 12-12z"
        fill={color}
      />
    </svg>
  );
}

/** Pocas estrellas azules y doradas, dispersas con criterio. */
export function Stars({
  className = "",
  density = "few",
  opacity = 0.8,
}: {
  className?: string;
  density?: "few" | "some";
  opacity?: number;
}) {
  const stars = [
    { x: 10, y: 18, s: 18, c: "var(--star-gold)" },
    { x: 84, y: 12, s: 12, c: "var(--star-blue)" },
    { x: 70, y: 70, s: 22, c: "var(--star-gold)" },
    { x: 24, y: 76, s: 10, c: "var(--star-lavender)" },
  ];
  const more = [
    { x: 46, y: 30, s: 9, c: "var(--star-blue)" },
    { x: 92, y: 52, s: 14, c: "var(--star-gold)" },
  ];
  const all = density === "some" ? [...stars, ...more] : stars;
  return (
    <div aria-hidden="true" className={`pointer-events-none relative ${className}`} style={{ opacity }}>
      {all.map((s, i) => (
        <StarShape
          key={i}
          size={s.s}
          color={s.c}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
}

/** Motivo de la marca, para no decidir en cada componente cuál corresponde. */
export function BrandMotif({
  motif,
  className,
  density,
  opacity,
}: {
  motif: "confetti" | "stars";
  className?: string;
  density?: "few" | "some";
  opacity?: number;
}) {
  return motif === "confetti" ? (
    <Confetti className={className} density={density} opacity={opacity} />
  ) : (
    <Stars className={className} density={density} opacity={opacity} />
  );
}
