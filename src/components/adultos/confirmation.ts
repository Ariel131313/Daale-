import { siteConfig } from "@/config/site";
import { readJSON, remove, writeJSON } from "@/lib/storage";

/**
 * Confirmación de mayoría de edad del recorrido /noche-magik/mayores.
 *
 * Es una autodeclaración, no una verificación: no se piden documentos ni fecha
 * de nacimiento. Se guarda solo en sessionStorage, así dura lo que la pestaña y
 * al cerrarla se vuelve a preguntar. Nunca en localStorage: en un teléfono o
 * una computadora compartida, la próxima persona tiene que contestar de nuevo.
 * Si el almacenamiento no está disponible, la respuesta queda solo en memoria
 * mientras la página siga abierta.
 *
 * Se expone como una fuente externa para useSyncExternalStore: el servidor
 * siempre ve "sin confirmar", de modo que el HTML estático nunca incluye el
 * recorrido y la hidratación no genera diferencias.
 */
const KEY = `${siteConfig.storage.keyPrefix}:mayores:v1`;

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeAdult(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Lee sessionStorage una sola vez y después responde desde memoria. */
export function getAdultSnapshot(): boolean {
  if (cached === null) cached = readJSON<boolean>("session", KEY) === true;
  return cached;
}

export function getAdultServerSnapshot(): boolean {
  return false;
}

export function confirmAdult(): void {
  cached = true;
  writeJSON("session", KEY, true);
  emit();
}

/**
 * Olvida la confirmación al salir de la sección. No avisa a los componentes a
 * propósito: la navegación ya los desmonta y así no parpadea la pregunta antes
 * de cambiar de página. Al volver, se pregunta otra vez.
 */
export function forgetAdultOnExit(): void {
  cached = false;
  remove("session", KEY);
}
