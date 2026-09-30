"use client";

import type { ComponentProps, ReactNode } from "react";

/**
 * Campos con etiqueta siempre visible, ayuda y error asociados por
 * aria-describedby. El error se anuncia con aria-invalid y queda escrito debajo
 * del campo, no solo en color.
 */

export function describedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  const ids = [hint ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function FieldMessage({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-ayuda`} className="mt-1.5 text-base text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 font-semibold text-error">
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </p>
      ) : null}
    </>
  );
}

const inputClasses =
  "block w-full rounded-[var(--radius-field)] border-2 bg-surface px-4 py-3 text-ink placeholder:text-ink-muted/80 min-h-12 aria-[invalid=true]:border-error";

interface BaseFieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}

function Label({ id, label, optional }: { id: string; label: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={id} className="mb-2 block font-semibold text-ink">
      {label}
      {optional ? <span className="ml-2 font-normal text-ink-muted">(opcional)</span> : null}
    </label>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  optional,
  className = "",
  ...rest
}: BaseFieldProps & Omit<ComponentProps<"input">, "id">) {
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <input
        id={id}
        name={id}
        className={`${inputClasses} border-field-border`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  hint,
  error,
  optional,
  className = "",
  ...rest
}: BaseFieldProps & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <textarea
        id={id}
        name={id}
        rows={3}
        className={`${inputClasses} border-field-border resize-y`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

/**
 * Grupo de opciones tipo pastilla (radio). Se usa para horario, duración,
 * edad y presupuesto: todas las opciones a la vista, sin desplegables.
 */
export function PillGroup<T extends string>({
  id,
  legend,
  hint,
  error,
  optional,
  options,
  value,
  onChange,
}: {
  id: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset aria-describedby={describedBy(id, hint, error)}>
      <legend className="mb-2 font-semibold text-ink">
        {legend}
        {optional ? <span className="ml-2 font-normal text-ink-muted">(opcional)</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => {
          const checked = value === o.value;
          const inputId = `${id}-${o.value}`;
          return (
            <label
              key={o.value}
              htmlFor={inputId}
              className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                checked
                  ? "border-selected bg-selected-bg text-ink"
                  : "border-field-border bg-surface text-ink hover:border-selected"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={id}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {checked ? <span aria-hidden="true">✓</span> : null}
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldMessage id={id} hint={hint} error={error} />
    </fieldset>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-semibold text-ink">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? `${id}-ayuda` : undefined}
          className="size-6 shrink-0 cursor-pointer accent-[var(--primary)]"
        />
        {label}
      </label>
      <FieldMessage id={id} hint={hint} />
    </div>
  );
}
