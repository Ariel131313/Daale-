"use client";

import { useSyncExternalStore } from "react";
import { getBrand } from "@/config/brands";
import { track } from "@/lib/analytics";
import type { BrandId } from "@/lib/types";
import { buildDirectMessage, whatsappUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
    </svg>
  );
}

/**
 * "Hablar directamente": abre el chat de la marca con un saludo corto. Es
 * distinto de "Armá tu evento", que manda la consulta completa. Si la marca no
 * tiene número configurado, lo dice en vez de abrir un chat inexistente.
 */
export function DirectWhatsAppLink({
  brandId,
  label = "Hablar por WhatsApp",
  variant = "secondary",
  size = "md",
  location,
  className = "",
}: {
  brandId: BrandId;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  /** Dónde está el botón, para la analítica. */
  location: string;
  className?: string;
}) {
  const url = whatsappUrl(brandId, buildDirectMessage(brandId));
  if (!url) {
    return (
      <span className={`${buttonClasses({ variant: "secondary", size, className })} cursor-not-allowed opacity-70`}>
        WhatsApp de {getBrand(brandId).name} sin configurar
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_clicked", { brand: brandId, kind: "directo", location })}
      className={buttonClasses({ variant, size, className })}
    >
      <WhatsAppIcon />
      {label}
    </a>
  );
}

/**
 * Botón flotante discreto. Aparece después de bajar un poco (no compite con el
 * hero) y no se usa dentro del configurador, donde taparía el progreso o los
 * botones de avanzar. Se esconde cuando llega a su zona una sección marcada con
 * data-sin-flotante (preguntas frecuentes, cierre y pie): ahí hay filas y
 * enlaces de ancho completo que taparía, y cada una ya tiene su WhatsApp.
 */
function subscribeScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/** Alto de la franja inferior donde vive el botón, con margen. */
const FLOAT_ZONE = 96;

/**
 * Devuelve un sí o no, así el botón solo se vuelve a dibujar cuando cambia, no
 * en cada movimiento del scroll.
 */
function floatWanted(): boolean {
  if (window.scrollY <= 420) return false;
  const zoneTop = window.innerHeight - FLOAT_ZONE;
  for (const section of document.querySelectorAll("[data-sin-flotante]")) {
    const r = section.getBoundingClientRect();
    if (r.bottom > zoneTop && r.top < window.innerHeight) return false;
  }
  return true;
}

export function WhatsAppFloat({ brandId }: { brandId: BrandId }) {
  const visible = useSyncExternalStore(subscribeScroll, floatWanted, () => false);

  const url = whatsappUrl(brandId, buildDirectMessage(brandId));
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_clicked", { brand: brandId, kind: "directo", location: "flotante" })}
      aria-label={`Hablar por WhatsApp con ${getBrand(brandId).name}`}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1f7a4d] px-4 font-semibold text-white shadow-lg transition-[opacity,transform] duration-300 hover:bg-[#186540] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      tabIndex={visible ? 0 : -1}
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
