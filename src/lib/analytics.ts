import { brandList } from "@/config/brands";
import { siteConfig } from "@/config/site";
import { readJSON, remove, writeJSON } from "@/lib/storage";
import type { AnalyticsEventName, AnalyticsParams } from "@/lib/types";

/**
 * Analítica opcional, con cuentas por marca.
 *
 * - Sin IDs configurados, o con enableAnalytics apagado, no se carga ningún
 *   script ni se pide consentimiento.
 * - Con IDs, GA4 y Meta Pixel se cargan recién cuando la persona acepta. Los
 *   eventos anteriores a esa decisión esperan en memoria: se mandan si acepta
 *   y se descartan si no.
 * - Cada evento va a los IDs compartidos del sitio y a los de su marca: la
 *   cuenta de Daale nunca recibe eventos de Noche Magik, ni al revés.
 * - Se envían marca, tipo de evento, ids de servicios y personajes, cantidades
 *   de opciones y si hay fecha o presupuesto. Nunca nombres, notas, teléfonos,
 *   fechas exactas ni datos de menores.
 * - Nada del recorrido para mayores sale del sitio: ni a Google ni a Meta.
 */

export type Consent = "granted" | "denied";

const CONSENT_KEY = "dnm:consent:v1";
const CONSENT_EVENT = "dnm:consent";
/** Tope de eventos en espera: una visita normal no llega ni cerca. */
const MAX_PENDING = 20;

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

// ---------- Cuentas ----------

export interface AnalyticsTargets {
  ga4: string[];
  meta: string[];
}

function ids(list: (string | null | undefined)[]): string[] {
  return [...new Set(list.filter((x): x is string => Boolean(x)))];
}

/** A qué cuentas va un evento: las compartidas del sitio y las de su marca. */
export function analyticsTargets(brand?: unknown): AnalyticsTargets {
  const own = brandList.find((b) => b.id === brand)?.analytics;
  return {
    ga4: ids([siteConfig.analytics.ga4MeasurementId, own?.ga4MeasurementId]),
    meta: ids([siteConfig.analytics.metaPixelId, own?.metaPixelId]),
  };
}

function allTargets(): AnalyticsTargets {
  return {
    ga4: ids([
      siteConfig.analytics.ga4MeasurementId,
      ...brandList.map((b) => b.analytics.ga4MeasurementId),
    ]),
    meta: ids([siteConfig.analytics.metaPixelId, ...brandList.map((b) => b.analytics.metaPixelId)]),
  };
}

/** Qué servicios hay configurados, para decirlo en el aviso de consentimiento. */
export const analyticsTools = {
  ga4: siteConfig.flags.enableAnalytics && allTargets().ga4.length > 0,
  meta: siteConfig.flags.enableAnalytics && allTargets().meta.length > 0,
};

export const analyticsConfigured = analyticsTools.ga4 || analyticsTools.meta;

// ---------- Consentimiento ----------

/**
 * Respaldo en memoria: si el navegador no deja guardar (modo privado, datos
 * bloqueados), la decisión vale al menos mientras la página esté abierta y el
 * aviso no vuelve a aparecer.
 */
let consentInMemory: Consent | null = null;

function isConsent(value: unknown): value is Consent {
  return value === "granted" || value === "denied";
}

export function getConsent(): Consent | null {
  const stored = readJSON<unknown>("local", CONSENT_KEY);
  return isConsent(stored) ? stored : consentInMemory;
}

export function setConsent(value: Consent): void {
  const wasLoaded = loaded;
  consentInMemory = value;
  writeJSON("local", CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
  if (value === "granted") {
    loadAdapters();
    for (const [name, params] of pending.splice(0)) send(name, params);
    return;
  }
  pending.length = 0;
  // Un script ya cargado no se puede descargar: se recarga la página para que
  // deje de medir de inmediato. Sin consentimiento, no se vuelve a cargar.
  if (wasLoaded) window.location.reload();
}

/** Vuelve a mostrar el aviso para cambiar la decisión. */
export function reopenConsent(): void {
  consentInMemory = null;
  remove("local", CONSENT_KEY);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Avisa cuando cambia la decisión, en esta pestaña o en otra. */
export function subscribeConsent(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_KEY) onChange();
  };
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** El aviso de consentimiento solo tiene sentido si hay algo para cargar. */
export function consentNeeded(): boolean {
  return analyticsConfigured && getConsent() === null;
}

// ---------- Adaptadores ----------

let loaded = false;
const pending: [AnalyticsEventName, AnalyticsParams][] = [];

function injectScript(src: string): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGa4(measurementIds: string[]): void {
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js procesa objetos arguments, no arreglos: por eso no usa ...args.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // Las páginas se registran a mano con landing_view: sin page_view duplicado.
  for (const id of measurementIds) window.gtag("config", id, { send_page_view: false });
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementIds[0])}`);
}

function loadMetaPixel(pixelIds: string[]): void {
  if (window.fbq) return;
  // Mismo contrato que el fragmento oficial: encola hasta que fbevents.js
  // carga y después le pasa cada llamada por callMethod.
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  injectScript("https://connect.facebook.net/en_US/fbevents.js");
  for (const id of pixelIds) fbq("init", id);
}

export function loadAdapters(): void {
  if (loaded || typeof window === "undefined") return;
  if (!analyticsConfigured || getConsent() !== "granted") return;
  loaded = true;
  const { ga4, meta } = allTargets();
  if (ga4.length > 0) loadGa4(ga4);
  if (meta.length > 0) loadMetaPixel(meta);
}

// ---------- Eventos ----------

/** Traducción a los eventos estándar de Meta, donde tienen equivalente. */
const META_EVENTS: Partial<Record<AnalyticsEventName, string>> = {
  landing_view: "PageView",
  configuration_completed: "CompleteRegistration",
  whatsapp_clicked: "Contact",
};

function send(name: AnalyticsEventName, params: AnalyticsParams): void {
  const targets = analyticsTargets(params.brand);
  if (targets.ga4.length > 0) {
    window.gtag?.("event", name, { ...params, send_to: targets.ga4 });
  }
  const metaName = META_EVENTS[name];
  for (const id of targets.meta) {
    if (metaName) window.fbq?.("trackSingle", id, metaName, params);
    else window.fbq?.("trackSingleCustom", id, name, params);
  }
}

export function track(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  if (params.mode === "adults-only") return;
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analítica]", name, params);
  }
  if (!analyticsConfigured) return;
  const consent = getConsent();
  if (consent === "denied") return;
  if (consent === null) {
    if (pending.length < MAX_PENDING) pending.push([name, params]);
    return;
  }
  loadAdapters();
  send(name, params);
}
