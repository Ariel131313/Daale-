import { siteConfig } from "@/config/site";
import type { BrandId, ConfiguratorMode, ConfiguratorState } from "@/lib/types";

/**
 * Acceso a localStorage y sessionStorage que nunca rompe la página: en modo
 * privado, con el almacenamiento bloqueado o lleno, las funciones devuelven
 * null o no hacen nada, y el configurador sigue andando sin recordar.
 */
type Area = "local" | "session";

function area(which: Area): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const store = which === "local" ? window.localStorage : window.sessionStorage;
    const probe = `${siteConfig.storage.keyPrefix}:probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function readJSON<T>(which: Area, key: string): T | null {
  const store = area(which);
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(which: Area, key: string, value: unknown): boolean {
  const store = area(which);
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(which: Area, key: string): void {
  const store = area(which);
  try {
    store?.removeItem(key);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

/**
 * Cada marca y cada modo guardan sus respuestas por separado: cambiar de marca
 * no pisa nada, y el recorrido para mayores nunca comparte datos con el general.
 */
function configuratorKey(brand: BrandId, mode: ConfiguratorMode): string {
  return `${siteConfig.storage.keyPrefix}:configurador:v1:${brand}:${mode}`;
}

/**
 * El recorrido general se recuerda en el dispositivo para seguir otro día. El
 * de mayores queda solo en la pestaña abierta y se borra al cerrarla, igual
 * que la confirmación de edad: no deja rastro en un celular compartido.
 */
function areaFor(mode: ConfiguratorMode): Area {
  return mode === "adults-only" ? "session" : "local";
}

interface Saved {
  savedAt: number;
  state: ConfiguratorState;
}

/**
 * Lo mínimo para confiar en lo guardado: versión, fecha y respuestas con forma
 * de objeto. El detalle de cada respuesta lo normaliza el reducer al recuperar.
 */
function isSaved(value: unknown): value is Saved {
  if (!value || typeof value !== "object") return false;
  const v = value as { savedAt?: unknown; state?: unknown };
  if (typeof v.savedAt !== "number" || !v.state || typeof v.state !== "object") return false;
  const state = v.state as { version?: unknown; answers?: unknown };
  return state.version === 1 && Boolean(state.answers) && typeof state.answers === "object";
}

export function loadConfigurator(
  brand: BrandId,
  mode: ConfiguratorMode,
  nowMs: number
): ConfiguratorState | null {
  const which = areaFor(mode);
  const key = configuratorKey(brand, mode);
  const saved = readJSON<unknown>(which, key);
  if (!isSaved(saved)) {
    if (saved !== null) remove(which, key);
    return null;
  }
  const maxAge = siteConfig.storage.ttlDays * 24 * 60 * 60 * 1000;
  if (nowMs - saved.savedAt > maxAge) {
    remove(which, key);
    return null;
  }
  if (saved.state.brand !== brand || saved.state.mode !== mode) return null;
  return saved.state;
}

export function saveConfigurator(state: ConfiguratorState, nowMs: number): boolean {
  return writeJSON(areaFor(state.mode), configuratorKey(state.brand, state.mode), {
    savedAt: nowMs,
    state,
  } satisfies Saved);
}

export function clearConfigurator(brand: BrandId, mode: ConfiguratorMode): void {
  remove(areaFor(mode), configuratorKey(brand, mode));
}

/** Hay una configuración empezada: sirve para ofrecer "Seguir donde quedé". */
export function hasSavedConfigurator(
  brand: BrandId,
  mode: ConfiguratorMode,
  nowMs: number
): boolean {
  const state = loadConfigurator(brand, mode, nowMs);
  return typeof state?.answers.eventTypeId === "string" && state.answers.eventTypeId !== "";
}
