import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 text-center";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary:
    "border-2 border-primary text-ink bg-surface hover:bg-selected-bg",
  ghost: "text-ink underline underline-offset-4 decoration-2 hover:decoration-4",
};

// 44px de alto mínimo en todos los tamaños: área táctil cómoda a cualquier edad.
const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 py-2.5 text-base",
  lg: "min-h-13 px-7 py-3 text-lg",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: Omit<CommonProps, "children">): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Enlace interno con aspecto de botón (next/link aplica el basePath). */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  href,
  ...rest
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}

/** Enlace externo (WhatsApp, Instagram) con aspecto de botón. */
export function ExternalButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<"a">, "className" | "children">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </a>
  );
}
