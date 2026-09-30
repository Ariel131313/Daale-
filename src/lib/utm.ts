import { readJSON, writeJSON } from "@/lib/storage";
import type { UtmParams } from "@/lib/types";

const KEY = "dnm:utm";

const EMPTY: UtmParams = { utm_source: null, utm_medium: null, utm_campaign: null };

function clean(value: string | null): string | null {
  const trimmed = value?.trim().slice(0, 120);
  return trimmed ? trimmed : null;
}

/**
 * Guarda los UTM de la URL de entrada para toda la visita. Si la persona entra
 * de nuevo desde otra campaña, los UTM nuevos reemplazan a los anteriores.
 * No se muestran en el mensaje de WhatsApp: viajan solo en el Lead.
 */
export function captureUtm(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const found: UtmParams = {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
  };
  if (found.utm_source || found.utm_medium || found.utm_campaign) {
    writeJSON("session", KEY, found);
    return found;
  }
  return getUtm();
}

export function getUtm(): UtmParams {
  return readJSON<UtmParams>("session", KEY) ?? EMPTY;
}
