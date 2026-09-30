"use client";

import type { ReactNode } from "react";
import type { MediaId } from "@/lib/types";
import { MediaImage } from "./Media";

/**
 * Tarjeta de selección. Es un input real (radio o checkbox) con una etiqueta
 * grande: se opera con teclado, se anuncia bien y el estado elegido se ve por
 * borde, fondo y un tilde, no solo por color.
 */
export function ChoiceCard({
  id,
  name,
  type,
  checked,
  onChange,
  title,
  description,
  image,
  badge,
  pending = false,
  compact = false,
}: {
  id: string;
  name: string;
  type: "radio" | "checkbox";
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  image?: MediaId;
  badge?: ReactNode;
  /** Servicio sin confirmar por la marca: siempre se ofrece marcado como tal. */
  pending?: boolean;
  compact?: boolean;
}) {
  const showPending = pending;
  return (
    <label
      htmlFor={id}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[var(--radius-card)] border-2 bg-surface text-left transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus ${
        checked ? "border-selected bg-selected-bg" : "border-line hover:border-field-border"
      }`}
    >
      <input
        id={id}
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {image ? (
        <MediaImage
          id={image}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
          className="aspect-[4/3] w-full bg-surface-2"
          decorative
        />
      ) : null}
      <span className={`flex flex-1 flex-col gap-1 ${compact ? "p-3.5" : "p-4"}`}>
        <span className="flex items-start justify-between gap-3">
          <span className="text-lg font-semibold leading-snug text-ink">{title}</span>
          <span
            aria-hidden="true"
            className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
              checked
                ? "border-selected bg-selected text-surface"
                : "border-field-border text-transparent"
            }`}
          >
            ✓
          </span>
        </span>
        {description ? <span className="text-base text-ink-muted">{description}</span> : null}
        {badge || showPending ? (
          <span className="mt-auto flex flex-wrap gap-2 pt-2">
            {badge}
            {showPending ? (
              <span className="rounded-full border border-dashed border-field-border px-2.5 py-0.5 text-sm font-semibold text-ink-muted">
                Pendiente de confirmar
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </label>
  );
}
