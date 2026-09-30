/**
 * Consentimiento de analítica.
 *
 * - Sin IDs de GA4 ni Meta configurados no hay nada que aceptar: el aviso no
 *   aparece y no se carga ningún script.
 * - La decisión se recuerda; si el navegador no deja guardar, vale al menos
 *   mientras la página esté abierta, así el aviso no vuelve a aparecer.
 *
 * Ejecutar: npx tsx --test src/lib/analytics.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  analyticsConfigured,
  consentNeeded,
  getConsent,
  setConsent,
  subscribeConsent,
} from "@/lib/analytics";

class BlockedStorage {
  getItem(): string | null {
    throw new Error("bloqueado");
  }
  setItem(): void {
    throw new Error("bloqueado");
  }
  removeItem(): void {
    throw new Error("bloqueado");
  }
}

const fakeWindow = Object.assign(new EventTarget(), {
  localStorage: new BlockedStorage(),
  sessionStorage: new BlockedStorage(),
});
Object.defineProperty(globalThis, "window", { value: fakeWindow, configurable: true, writable: true });

function storageEvent(key: string | null): Event {
  return Object.assign(new Event("storage"), { key });
}

describe("consentimiento", () => {
  test("sin IDs configurados, el aviso no aparece", () => {
    assert.equal(analyticsConfigured, false, "los tests corren sin IDs de analítica");
    assert.equal(consentNeeded(), false);
  });

  test("con el almacenamiento bloqueado, la decisión queda en memoria y avisa a quien escucha", () => {
    let calls = 0;
    const unsubscribe = subscribeConsent(() => {
      calls += 1;
    });
    assert.equal(getConsent(), null);
    setConsent("denied");
    assert.equal(getConsent(), "denied");
    assert.equal(calls, 1);

    unsubscribe();
    setConsent("granted");
    assert.equal(getConsent(), "granted");
    assert.equal(calls, 1, "después de desuscribirse no llegan más avisos");
  });

  test("un cambio en otra pestaña también avisa; las otras claves no", () => {
    let calls = 0;
    const unsubscribe = subscribeConsent(() => {
      calls += 1;
    });
    fakeWindow.dispatchEvent(storageEvent("dnm:consent:v1"));
    fakeWindow.dispatchEvent(storageEvent(null));
    fakeWindow.dispatchEvent(storageEvent("dnm:probe"));
    unsubscribe();
    assert.equal(calls, 2);
  });
});
