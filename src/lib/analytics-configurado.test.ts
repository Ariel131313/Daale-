/**
 * Analítica con IDs configurados: un GA4 compartido del sitio, un GA4 propio
 * de Daale y un Meta Pixel propio de Noche Magik.
 *
 * - Antes de que la persona decida no se carga nada y los eventos esperan.
 * - Al aceptar, se cargan los scripts y salen los eventos en espera.
 * - Cada evento va a las cuentas del sitio y a las de su marca, nunca a las
 *   de la otra marca.
 * - Nada del recorrido para mayores sale del sitio.
 * - gtag recibe objetos arguments (gtag.js no procesa arreglos) y el Pixel
 *   respeta el contrato de cola del fragmento oficial.
 *
 * Los IDs se definen antes de cargar los módulos: por eso los imports son
 * dinámicos. Cada archivo de test corre en su propio proceso.
 *
 * Ejecutar: npx tsx --test src/lib/analytics-configurado.test.ts
 */
import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

process.env.NEXT_PUBLIC_GA4_ID = "G-SITIO";
process.env.NEXT_PUBLIC_GA4_ID_DAALE = "G-DAALE";
process.env.NEXT_PUBLIC_META_PIXEL_ID_NOCHE_MAGIK = "999";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

let reloads = 0;
const scripts: string[] = [];

const fakeWindow = Object.assign(new EventTarget(), {
  localStorage: new MemoryStorage(),
  sessionStorage: new MemoryStorage(),
  location: {
    reload: () => {
      reloads += 1;
    },
  },
});
Object.defineProperty(globalThis, "window", { value: fakeWindow, configurable: true, writable: true });
Object.defineProperty(globalThis, "document", {
  value: {
    createElement: () => ({}),
    head: {
      appendChild: (el: { src?: string }) => {
        if (el.src) scripts.push(el.src);
      },
    },
  },
  configurable: true,
  writable: true,
});

type Analytics = typeof import("@/lib/analytics");
let analytics: Analytics;

interface Tracked {
  dataLayer?: unknown[];
  fbq?: { queue: unknown[][] };
}
const win = fakeWindow as unknown as Tracked;

before(async () => {
  analytics = await import("@/lib/analytics");
});

/** Llamadas de gtag como arreglos, para comparar. */
function gtagCalls(): unknown[][] {
  return (win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

function gtagEvents(): { name: unknown; params: Record<string, unknown> }[] {
  return gtagCalls()
    .filter((call) => call[0] === "event")
    .map((call) => ({ name: call[1], params: call[2] as Record<string, unknown> }));
}

function pixelCalls(): unknown[][] {
  return win.fbq?.queue ?? [];
}

describe("analítica configurada", () => {
  test("hay algo para medir y todavía no se decidió: se pide consentimiento", () => {
    assert.equal(analytics.analyticsConfigured, true);
    assert.deepEqual(analytics.analyticsTools, { ga4: true, meta: true });
    assert.equal(analytics.consentNeeded(), true);
  });

  test("cada marca tiene sus cuentas, además de las compartidas del sitio", () => {
    assert.deepEqual(analytics.analyticsTargets("daale"), { ga4: ["G-SITIO", "G-DAALE"], meta: [] });
    assert.deepEqual(analytics.analyticsTargets("noche-magik"), { ga4: ["G-SITIO"], meta: ["999"] });
    assert.deepEqual(analytics.analyticsTargets("root"), { ga4: ["G-SITIO"], meta: [] });
    assert.deepEqual(analytics.analyticsTargets(undefined), { ga4: ["G-SITIO"], meta: [] });
  });

  test("sin decidir, los eventos esperan y no se carga ningún script", () => {
    analytics.track("landing_view", { brand: "daale" });
    analytics.track("brand_selected", { brand: "noche-magik", location: "tarjeta" });
    assert.deepEqual(scripts, []);
    assert.equal(win.dataLayer, undefined);
    assert.equal(win.fbq, undefined);
  });

  test("al aceptar se cargan los scripts y salen los eventos en espera, cada uno a sus cuentas", () => {
    analytics.setConsent("granted");

    assert.equal(scripts.length, 2);
    assert.match(scripts[0], /googletagmanager\.com\/gtag\/js\?id=G-SITIO$/);
    assert.match(scripts[1], /connect\.facebook\.net\/.+\/fbevents\.js$/);

    for (const entry of win.dataLayer ?? []) {
      assert.equal(Object.prototype.toString.call(entry), "[object Arguments]", "gtag.js solo procesa arguments");
    }
    const configs = gtagCalls().filter((call) => call[0] === "config");
    assert.deepEqual(
      configs.map((call) => call[1]),
      ["G-SITIO", "G-DAALE"]
    );
    for (const call of configs) {
      assert.deepEqual(call[2], { send_page_view: false });
    }

    assert.deepEqual(gtagEvents(), [
      { name: "landing_view", params: { brand: "daale", send_to: ["G-SITIO", "G-DAALE"] } },
      {
        name: "brand_selected",
        params: { brand: "noche-magik", location: "tarjeta", send_to: ["G-SITIO"] },
      },
    ]);
    assert.deepEqual(pixelCalls(), [
      ["init", "999"],
      ["trackSingleCustom", "999", "brand_selected", { brand: "noche-magik", location: "tarjeta" }],
    ]);
    assert.equal(analytics.consentNeeded(), false);
  });

  test("un evento de Noche Magik nunca llega a la cuenta de Daale", () => {
    analytics.track("whatsapp_clicked", { brand: "noche-magik", kind: "directo" });
    const last = gtagEvents().at(-1);
    assert.deepEqual(last, {
      name: "whatsapp_clicked",
      params: { brand: "noche-magik", kind: "directo", send_to: ["G-SITIO"] },
    });
    assert.deepEqual(pixelCalls().at(-1), [
      "trackSingle",
      "999",
      "Contact",
      { brand: "noche-magik", kind: "directo" },
    ]);
  });

  test("nada del recorrido para mayores sale del sitio", () => {
    const before = [gtagCalls().length, pixelCalls().length];
    analytics.track("configurator_started", { brand: "noche-magik", mode: "adults-only" });
    analytics.track("service_selected", {
      brand: "noche-magik",
      mode: "adults-only",
      service_id: "nm-adultos-show",
    });
    analytics.track("whatsapp_clicked", { brand: "noche-magik", mode: "adults-only" });
    assert.deepEqual([gtagCalls().length, pixelCalls().length], before);
  });

  test("cambiar a «no» recarga la página para que los scripts dejen de medir", () => {
    analytics.setConsent("denied");
    assert.equal(reloads, 1);
    const before = gtagCalls().length;
    analytics.track("landing_view", { brand: "daale" });
    assert.equal(gtagCalls().length, before, "rechazado, no se manda nada");
  });

  test("al volver a preguntar, lo que pasa antes de decidir no se manda si la respuesta es «no»", () => {
    analytics.reopenConsent();
    assert.equal(analytics.consentNeeded(), true);
    const before = gtagCalls().length;
    analytics.track("landing_view", { brand: "daale" });
    analytics.setConsent("denied");
    assert.equal(gtagCalls().length, before);
  });
});
