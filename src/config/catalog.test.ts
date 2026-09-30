/**
 * Catálogo separado: lo exclusivo para mayores no está en los catálogos
 * generales y solo existe después de registrarlo, como hace la ruta
 * /noche-magik/mayores. Este archivo no importa el catálogo completo de los
 * otros tests: arranca sin nada registrado (cada archivo corre en su proceso).
 *
 * Ejecutar: npx tsx --test src/config/catalog.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { adultCatalog } from "@/config/adultos";
import { allEventTypes, allServiceCategories, allServices, registerCatalog } from "@/config/catalog";
import { eventTypes } from "@/config/eventTypes";
import { serviceCategories, services } from "@/config/services";

describe("catálogo separado para mayores", () => {
  test("los catálogos generales no tienen nada exclusivo para mayores", () => {
    assert.ok(!eventTypes.some((e) => e.audience === "adults-only"));
    assert.ok(!services.some((s) => s.audience === "adults-only"));
    assert.ok(!Object.keys(serviceCategories).includes("adultos"));
  });

  test("el catálogo para mayores es solo de Noche Magik y solo para mayores", () => {
    assert.ok(adultCatalog.eventTypes.length > 0 && adultCatalog.services.length > 0);
    for (const item of [...adultCatalog.eventTypes, ...adultCatalog.services]) {
      assert.equal(item.brand, "noche-magik", item.id);
      assert.equal(item.audience, "adults-only", item.id);
    }
    for (const s of adultCatalog.services) {
      assert.equal(s.image, undefined, `${s.id}: la web pública no muestra material sensible`);
      assert.ok(s.category in adultCatalog.categories, `${s.id}: categoría ${s.category}`);
    }
  });

  test("sin registrar, no existe en el catálogo completo", () => {
    assert.ok(!allEventTypes().some((e) => e.audience === "adults-only"));
    assert.ok(!allServices().some((s) => s.audience === "adults-only"));
    assert.ok(!("adultos" in allServiceCategories()));
  });

  test("al registrarlo se suma, sin duplicar ni pisar lo general", () => {
    registerCatalog(adultCatalog);
    registerCatalog(adultCatalog);
    const ids = allEventTypes().map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, "sin ids repetidos");
    for (const e of adultCatalog.eventTypes) assert.ok(ids.includes(e.id), e.id);
    const serviceIds = allServices().map((s) => s.id);
    assert.equal(new Set(serviceIds).size, serviceIds.length);
    for (const s of adultCatalog.services) assert.ok(serviceIds.includes(s.id), s.id);
    assert.deepEqual(Object.keys(allServiceCategories()).slice(0, Object.keys(serviceCategories).length), Object.keys(serviceCategories));
    assert.equal(allServiceCategories().adultos, adultCatalog.categories.adultos);

    // Un id general no se puede reemplazar registrando otro con el mismo id.
    const first = services[0];
    registerCatalog({ services: [{ ...first, name: "otro nombre" }] });
    assert.equal(allServices().find((s) => s.id === first.id)?.name, first.name);
  });
});
