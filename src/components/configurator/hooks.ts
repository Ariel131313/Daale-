"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/lib/dates";

/**
 * Valores que solo existen en el navegador (la URL, la fecha de hoy). Con
 * useSyncExternalStore el servidor y la hidratación ven el valor neutro y el
 * cliente lo corrige enseguida, sin desajustes ni efectos que pisen estado.
 */
const subscribeNothing = () => () => {};

function readParaEmpresa(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("para") === "empresa";
  } catch {
    return false;
  }
}

/** La persona llegó desde un acceso para empresas (?para=empresa). */
export function useBusinessEntry(): boolean {
  return useSyncExternalStore(subscribeNothing, readParaEmpresa, () => false);
}


/** Fecha local de hoy (aaaa-mm-dd) para el mínimo del campo de fecha. */
export function useTodayISO(): string {
  return useSyncExternalStore(subscribeNothing, () => todayISO(), () => "");
}

/** Copia un texto al portapapeles; si la API no está, prueba el método viejo. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Sigue con el método alternativo.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
