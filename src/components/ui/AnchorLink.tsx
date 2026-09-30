"use client";

import type { ComponentProps, MouseEvent } from "react";

/**
 * Enlace a una sección de la misma página («Saltar al contenido», «Ver
 * opciones para empresas»). No usa la navegación por ancla del navegador: esa
 * crea una entrada de historial sin el estado de Next, y después el botón
 * Atrás cambia la dirección sin cambiar la pantalla (y en el configurador,
 * además, lo sacaba del paso). Baja hasta la sección, respeta el movimiento
 * reducido y le pasa el foco, así el teclado y el lector de pantalla siguen
 * desde ahí. Con Ctrl, Cmd o el botón del medio funciona como un enlace común.
 */
export function AnchorLink({
  href,
  onClick,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & { href: `#${string}` }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return <a href={href} onClick={handleClick} {...rest} />;
}
