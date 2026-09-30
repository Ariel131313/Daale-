/**
 * Almacenamiento del configurador.
 *
 * - El recorrido general se recuerda en el dispositivo (localStorage) hasta
 *   siteConfig.storage.ttlDays días.
 * - El recorrido para mayores queda solo en la pestaña (sessionStorage).
 * - Lo guardado con otra forma, de otra versión o vencido se descarta.
 * - Sin almacenamiento disponible, nada se rompe.
 *
 * Ejecutar: npx tsx --test src/lib/storage.test.ts
 */
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import { siteConfig } from "@/config/site";
import { initialState } from "@/lib/configurator/state";
import {
  clearConfigurator,
  hasSavedConfigurator,
  loadConfigurator,
  saveConfigurator,
} from "@/lib/storage";
import type { BrandId, ConfiguratorMode, ConfiguratorState } from "@/lib/types";

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
  keys(): string[] {
    return [...this.data.keys()];
  }
}

/** Almacenamiento bloqueado, como en algunos modos privados. */
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

let local: MemoryStorage;
let session: MemoryStorage;

function installWindow(localStore: object, sessionStore: object): void {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStore, sessionStorage: sessionStore },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  local = new MemoryStorage();
  session = new MemoryStorage();
  installWindow(local, session);
});

const NOW_ISO = "2026-09-24T15:00:00.000Z";
const NOW_MS = Date.parse(NOW_ISO);
const DAY = 24 * 60 * 60 * 1000;

function started(brand: BrandId, mode: ConfiguratorMode, eventTypeId: string | null): ConfiguratorState {
  const s = initialState(brand, mode, NOW_ISO);
  return { ...s, startedAt: NOW_ISO, answers: { ...s.answers, eventTypeId } };
}

function key(brand: BrandId, mode: ConfiguratorMode): string {
  return `${siteConfig.storage.keyPrefix}:configurador:v1:${brand}:${mode}`;
}

describe("dónde se guarda cada recorrido", () => {
  test("el general va al dispositivo; el de mayores, solo a la pestaña", () => {
    saveConfigurator(started("daale", "general", "daale-cumple-infantil"), NOW_MS);
    saveConfigurator(started("noche-magik", "adults-only", "nm-adultos-show"), NOW_MS);

    assert.deepEqual(local.keys(), [key("daale", "general")]);
    assert.deepEqual(session.keys(), [key("noche-magik", "adults-only")]);
  });

  test("cada marca y cada modo se leen por separado", () => {
    saveConfigurator(started("daale", "general", "daale-cumple-infantil"), NOW_MS);
    assert.equal(loadConfigurator("daale", "general", NOW_MS)?.answers.eventTypeId, "daale-cumple-infantil");
    assert.equal(loadConfigurator("noche-magik", "general", NOW_MS), null);
    assert.equal(loadConfigurator("daale", "adults-only", NOW_MS), null);
  });

  test("borrar un recorrido no toca el otro", () => {
    saveConfigurator(started("noche-magik", "general", "nm-15"), NOW_MS);
    saveConfigurator(started("noche-magik", "adults-only", "nm-adultos-show"), NOW_MS);
    clearConfigurator("noche-magik", "adults-only");
    assert.deepEqual(session.keys(), []);
    assert.equal(loadConfigurator("noche-magik", "general", NOW_MS)?.answers.eventTypeId, "nm-15");
  });
});

describe("lo guardado que no sirve se descarta", () => {
  test("JSON roto, otra versión, sin respuestas o sin fecha de guardado", () => {
    const valid = { savedAt: NOW_MS, state: started("daale", "general", "daale-cumple-infantil") };
    const broken = [
      "{",
      "null",
      "42",
      JSON.stringify({ savedAt: NOW_MS }),
      JSON.stringify({ ...valid, savedAt: "ayer" }),
      JSON.stringify({ ...valid, state: { ...valid.state, version: 2 } }),
      JSON.stringify({ ...valid, state: { ...valid.state, answers: null } }),
      JSON.stringify({ ...valid, state: { ...valid.state, answers: "texto" } }),
    ];
    for (const raw of broken) {
      local.setItem(key("daale", "general"), raw);
      assert.equal(loadConfigurator("daale", "general", NOW_MS), null, raw);
      assert.equal(hasSavedConfigurator("daale", "general", NOW_MS), false, raw);
    }
  });

  test("con forma de objeto pero basura adentro, se devuelve y la limpia el reducer", () => {
    const state = { ...started("daale", "general", "daale-cumple-infantil"), answers: { serviceIds: "x" } };
    local.setItem(key("daale", "general"), JSON.stringify({ savedAt: NOW_MS, state }));
    assert.ok(loadConfigurator("daale", "general", NOW_MS));
    assert.equal(
      hasSavedConfigurator("daale", "general", NOW_MS),
      false,
      "sin tipo de evento no hay nada que retomar"
    );
  });

  test(`vence a los ${siteConfig.storage.ttlDays} días y se borra`, () => {
    saveConfigurator(started("daale", "general", "daale-cumple-infantil"), NOW_MS);
    const limit = NOW_MS + siteConfig.storage.ttlDays * DAY;
    assert.ok(loadConfigurator("daale", "general", limit));
    assert.equal(loadConfigurator("daale", "general", limit + 1), null);
    assert.deepEqual(local.keys(), []);
  });

  test("guardado con otra marca adentro no se usa", () => {
    const other = started("noche-magik", "general", "nm-15");
    local.setItem(key("daale", "general"), JSON.stringify({ savedAt: NOW_MS, state: other }));
    assert.equal(loadConfigurator("daale", "general", NOW_MS), null);
  });
});

describe("«Seguir donde quedé»", () => {
  test("solo si ya se eligió un tipo de evento", () => {
    saveConfigurator(started("daale", "general", null), NOW_MS);
    assert.equal(hasSavedConfigurator("daale", "general", NOW_MS), false);
    saveConfigurator(started("daale", "general", "daale-familiar"), NOW_MS);
    assert.equal(hasSavedConfigurator("daale", "general", NOW_MS), true);
  });
});

describe("sin almacenamiento disponible", () => {
  test("guardar, leer y borrar no tiran errores", () => {
    installWindow(new BlockedStorage(), new BlockedStorage());
    assert.equal(saveConfigurator(started("daale", "general", "daale-familiar"), NOW_MS), false);
    assert.equal(loadConfigurator("daale", "general", NOW_MS), null);
    assert.equal(hasSavedConfigurator("daale", "general", NOW_MS), false);
    assert.doesNotThrow(() => clearConfigurator("daale", "general"));
  });
});
