import type { CSSProperties } from "react";
import { StarShape } from "@/components/ui/Motif";
import styles from "./home.module.css";

/*
 * Motivos de las tarjetas de la portada: confeti solo en la de Daale y
 * estrellas solo en la de Noche Magik. Los logos van alineados a la izquierda,
 * así que las piezas ocupan el lado derecho y los bordes, lejos del logo y del
 * texto. Son pocas, de tamaños variados, y reaccionan apenas al pasar el mouse
 * o al enfocar la tarjeta.
 *
 * Posiciones en % del escenario; tamaños en px. dx/dy/dr: cuánto se corre
 * cada pieza al pasar el mouse.
 */

const confetti = [
  { x: 84, y: 16, w: 21, h: 7, r: -32, color: "bg-brand-red", dx: 4, dy: -3, dr: -14, d: 0 },
  { x: 93, y: 50, w: 15, h: 6, r: 58, color: "bg-brand-blue", dx: 5, dy: 1, dr: 20, d: 70 },
  { x: 79, y: 80, w: 18, h: 7, r: 16, color: "bg-brand-violet", dx: 3, dy: 4, dr: 12, d: 140 },
  { x: 66, y: 9, w: 12, h: 5, r: 72, color: "bg-brand-blue", dx: 1, dy: -4, dr: 18, d: 210 },
  { x: 64, y: 88, w: 14, h: 5, r: -48, color: "bg-brand-red", dx: -2, dy: 4, dr: -16, d: 280 },
  { x: 5, y: 8, w: 12, h: 5, r: 24, color: "bg-brand-violet", dx: -3, dy: -3, dr: 16, d: 350 },
];

export function CardConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-85">
      {confetti.map((p, i) => (
        <span
          key={i}
          className={`${styles.piece} absolute block rounded-full ${p.color}`}
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.w,
              height: p.h,
              "--r": `${p.r}deg`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--dr": `${p.dr}deg`,
              "--d": `${p.d}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* Azul lunar, dorado y lavanda, como las estrellas del logo. */
const stars = [
  { x: 72, y: 60, size: 24, color: "var(--star-gold)", d: 0 },
  { x: 56, y: 28, size: 14, color: "var(--star-gold)", d: 90 },
  { x: 87, y: 24, size: 11, color: "var(--star-blue)", d: 180 },
  { x: 91, y: 78, size: 13, color: "var(--star-lavender)", d: 270 },
  { x: 61, y: 86, size: 8, color: "var(--star-blue)", d: 360 },
];

export function CardStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-90">
      {stars.map((s, i) => (
        <StarShape
          key={i}
          size={s.size}
          color={s.color}
          className={`${styles.star} absolute -translate-x-1/2 -translate-y-1/2`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, "--d": `${s.d}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}
