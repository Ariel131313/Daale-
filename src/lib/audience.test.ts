/**
 * Separación de públicos: lo más importante del brief. «Una familia nunca debe
 * encontrarse accidentalmente con ofertas para adultos».
 *
 * Los tests recorren todas las marcas, los dos modos del configurador y los dos
 * valores del flag enableAdultCategory, contra todos los tipos de evento del
 * catálogo (también los de la otra marca y los que no corresponden al modo),
 * porque las funciones reciben cualquier cosa que venga del almacenamiento.
 *
 * Ejecutar: npx tsx --test src/lib/audience.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventTypes, services } from "@/lib/test-support/catalogo-completo";

import { budgetBands } from "@/config/budgets";
import { characters } from "@/config/characters";
import { recommendations } from "@/config/recommendations";
import {
  adultCategoryAvailable,
  charactersFor,
  eventTypesFor,
  extrasFor,
  getEventType,
  isCharacterAllowed,
  isEventTypeAllowed,
  isServiceAllowed,
  recommendationsFor,
  sanitizeAnswers,
  servicesFor,
  type AudienceFlags,
} from "@/lib/audience";
import { emptyAnswers } from "@/lib/configurator/state";
import type {
  BrandId,
  Character,
  ConfiguratorAnswers,
  ConfiguratorMode,
  EventAudience,
  EventType,
  Service,
  ServiceAudience,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Combinaciones
// ---------------------------------------------------------------------------

const BRANDS: BrandId[] = ["daale", "noche-magik"];
const MODES: ConfiguratorMode[] = ["general", "adults-only"];
const FLAG_ON: AudienceFlags = { enableAdultCategory: true };
const FLAG_OFF: AudienceFlags = { enableAdultCategory: false };

interface Combo {
  brand: BrandId;
  mode: ConfiguratorMode;
  flags: AudienceFlags;
  label: string;
}

const flagLabel = (flags: AudienceFlags) =>
  flags.enableAdultCategory ? "flag encendido" : "flag apagado";

const COMBOS: Combo[] = BRANDS.flatMap((brand) =>
  MODES.flatMap((mode) =>
    [FLAG_ON, FLAG_OFF].map((flags) => ({
      brand,
      mode,
      flags,
      label: `${brand}, modo ${mode}, ${flagLabel(flags)}`,
    }))
  )
);

/** Sin tipo elegido y todos los tipos del catálogo, de las dos marcas. */
const EVENT_CANDIDATES: (EventType | null)[] = [null, ...eventTypes];

/** Públicos donde hay o puede haber menores. */
const MINOR_SAFE: EventAudience[] = ["with-minors", "all-ages"];

const etLabel = (et: EventType | null) =>
  et ? `${et.id} (${et.audience})` : "sin tipo de evento";

/**
 * La única situación en la que algo "adults-only" puede ofrecerse: Noche
 * Magik, flag encendido, recorrido separado para mayores y un tipo de evento
 * también exclusivo para mayores.
 */
function adultsOnlyPermitted(
  brand: BrandId,
  et: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags
): boolean {
  return (
    brand === "noche-magik" &&
    flags.enableAdultCategory &&
    mode === "adults-only" &&
    et?.audience === "adults-only"
  );
}

/** El público del evento admite solo contenido apto para todo público. */
function onlyAllAges(et: EventType | null): boolean {
  return !et || MINOR_SAFE.includes(et.audience);
}

function eventById(id: string): EventType {
  const et = getEventType(id);
  assert.ok(et, `falta el tipo de evento ${id} en el catálogo`);
  return et;
}

/**
 * Respuestas que disparan todas las condiciones de las sugerencias: sin
 * servicios, con todos los de la marca, con cada uno por separado y con ids
 * de la otra marca; con y sin cantidades grandes de invitados y de chicos.
 */
function answerVariants(brand: BrandId, et: EventType | null): ConfiguratorAnswers[] {
  const brandIds = services.filter((s) => s.brand === brand).map((s) => s.id);
  const allIds = services.map((s) => s.id);
  const serviceSets: string[][] = [[], brandIds, allIds, ...brandIds.map((id) => [id])];
  const counts = [
    { approximateAttendees: "", childrenCount: "", adultsCount: "" },
    { approximateAttendees: "500", childrenCount: "80", adultsCount: "40" },
  ];
  return serviceSets.flatMap((serviceIds) =>
    counts.map((c) => ({
      ...emptyAnswers(),
      ...c,
      eventTypeId: et?.id ?? null,
      serviceIds,
    }))
  );
}

// ---------------------------------------------------------------------------
// Supuestos del catálogo: si alguien los cambia, los filtros dejan de proteger
// ---------------------------------------------------------------------------

describe("Catálogo: supuestos de los que depende la separación", () => {
  test("cumpleaños infantil, institución, 15 y 18 son eventos con menores", () => {
    for (const id of ["daale-cumple-infantil", "daale-institucion", "nm-15", "nm-18"]) {
      assert.equal(
        eventById(id).audience,
        "with-minors",
        `${id} tiene que ser "with-minors": ahí puede haber menores aunque sea de noche`
      );
    }
  });

  test("hay contenido adults-only en el catálogo, así los filtros se prueban de verdad", () => {
    assert.ok(eventTypes.some((e) => e.audience === "adults-only"));
    assert.ok(services.some((s) => s.audience === "adults-only"));
  });

  test("Daale no tiene nada adults-only en tipos, servicios, personajes ni sugerencias", () => {
    const serviceById = new Map(services.map((s) => [s.id, s]));
    assert.deepEqual(
      eventTypes.filter((e) => e.brand === "daale" && e.audience === "adults-only").map((e) => e.id),
      []
    );
    assert.deepEqual(
      services.filter((s) => s.brand === "daale" && s.audience === "adults-only").map((s) => s.id),
      []
    );
    assert.deepEqual(
      characters.filter((c) => c.brand === "daale" && c.audience === "adults-only").map((c) => c.id),
      []
    );
    assert.deepEqual(
      recommendations
        .filter((r) => r.brand === "daale")
        .filter((r) => serviceById.get(r.suggestServiceId)?.audience === "adults-only")
        .map((r) => r.id),
      []
    );
  });

  test("lo adults-only es de Noche Magik y no lleva imagen en la web pública", () => {
    const adultItems: { id: string; brand: BrandId; image?: string }[] = [
      ...eventTypes.filter((e) => e.audience === "adults-only"),
      ...services.filter((s) => s.audience === "adults-only"),
      ...characters.filter((c) => c.audience === "adults-only"),
    ];
    for (const item of adultItems) {
      assert.equal(item.brand, "noche-magik", `${item.id} es adults-only fuera de Noche Magik`);
      assert.equal(item.image, undefined, `${item.id} es adults-only y tiene imagen`);
    }
  });

  test("ninguna sugerencia apunta a un servicio adults-only, inexistente o de otra marca", () => {
    for (const rec of recommendations) {
      const service = services.find((s) => s.id === rec.suggestServiceId);
      assert.ok(service, `la sugerencia ${rec.id} apunta a ${rec.suggestServiceId}, que no existe`);
      assert.equal(service.brand, rec.brand, `la sugerencia ${rec.id} cruza de marca`);
      assert.notEqual(service.audience, "adults-only", `la sugerencia ${rec.id} es para adultos`);
    }
  });

  test("las condiciones de las sugerencias y los personajes nombran tipos de evento de su marca", () => {
    for (const rec of recommendations) {
      for (const id of rec.when.eventTypeIds ?? []) {
        assert.equal(eventById(id).brand, rec.brand, `sugerencia ${rec.id}: ${id}`);
      }
      for (const id of rec.when.hasAnyServiceId ?? []) {
        const s = services.find((x) => x.id === id);
        assert.ok(s, `sugerencia ${rec.id}: el servicio ${id} no existe`);
        assert.equal(s.brand, rec.brand, `sugerencia ${rec.id}: ${id}`);
      }
    }
    for (const c of characters) {
      for (const id of c.suggestedFor) {
        assert.equal(eventById(id).brand, c.brand, `personaje ${c.id}: ${id}`);
      }
    }
  });

  test("los ids son únicos en cada catálogo", () => {
    for (const [name, list] of [
      ["eventTypes", eventTypes],
      ["services", services],
      ["characters", characters],
      ["recommendations", recommendations],
      ["budgetBands", budgetBands],
    ] as const) {
      const ids = list.map((x) => x.id);
      assert.equal(new Set(ids).size, ids.length, `hay ids repetidos en ${name}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tipos de evento
// ---------------------------------------------------------------------------

describe("eventTypesFor", () => {
  for (const c of COMBOS) {
    test(c.label, () => {
      const list = eventTypesFor(c.brand, c.mode, c.flags);
      for (const et of list) {
        assert.equal(et.brand, c.brand, `${et.id} es de otra marca`);
      }
      if (c.mode === "general") {
        assert.ok(list.length > 0, "el modo general tiene que ofrecer tipos de evento");
        assert.deepEqual(
          list.filter((e) => e.audience === "adults-only").map((e) => e.id),
          [],
          "en el modo general nunca aparece un tipo de evento adults-only"
        );
      } else {
        assert.deepEqual(
          list.filter((e) => e.audience !== "adults-only").map((e) => e.id),
          [],
          "el recorrido para mayores solo lista eventos adults-only"
        );
        if (!adultCategoryAvailable(c.brand, c.flags)) {
          assert.deepEqual(list, [], "sin la categoría habilitada, el modo adults-only no tiene tipos");
        }
      }
      const orders = list.map((e) => e.order);
      assert.deepEqual(orders, [...orders].sort((a, b) => a - b), "respeta el orden del catálogo");
    });
  }

  test("con el flag encendido, Noche Magik para mayores lista exactamente sus eventos adults-only", () => {
    const expected = eventTypes
      .filter((e) => e.brand === "noche-magik" && e.audience === "adults-only")
      .map((e) => e.id);
    assert.ok(expected.length > 0);
    assert.deepEqual(
      eventTypesFor("noche-magik", "adults-only", FLAG_ON).map((e) => e.id),
      expected
    );
  });

  test("el flag no cambia en nada el modo general", () => {
    for (const brand of BRANDS) {
      assert.deepEqual(
        eventTypesFor(brand, "general", FLAG_ON).map((e) => e.id),
        eventTypesFor(brand, "general", FLAG_OFF).map((e) => e.id)
      );
    }
  });

  test("isEventTypeAllowed rechaza adults-only en el modo general, otra marca y null", () => {
    for (const c of COMBOS) {
      assert.equal(isEventTypeAllowed(null, c.brand, c.mode, c.flags), false);
      for (const et of eventTypes) {
        const allowed = isEventTypeAllowed(et, c.brand, c.mode, c.flags);
        if (et.brand !== c.brand) assert.equal(allowed, false, `${c.label}: ${et.id}`);
        if (c.mode === "general" && et.audience === "adults-only") {
          assert.equal(allowed, false, `${c.label}: ${et.id}`);
        }
        if (c.mode === "adults-only" && et.audience !== "adults-only") {
          assert.equal(allowed, false, `${c.label}: ${et.id}`);
        }
      }
    }
  });

  test("getEventType devuelve null con id vacío o desconocido", () => {
    assert.equal(getEventType(null), null);
    assert.equal(getEventType(""), null);
    assert.equal(getEventType("no-existe"), null);
    assert.equal(getEventType("nm-15")?.id, "nm-15");
  });
});

// ---------------------------------------------------------------------------
// Regla 1: nada adults-only fuera del recorrido para mayores
// ---------------------------------------------------------------------------

describe("Ningún evento que no sea adults-only recibe algo adults-only", () => {
  for (const c of COMBOS) {
    test(c.label, () => {
      for (const et of EVENT_CANDIDATES) {
        const permitted = adultsOnlyPermitted(c.brand, et, c.mode, c.flags);
        const where = `${c.label}, ${etLabel(et)}`;

        for (const s of servicesFor(c.brand, et, c.mode, c.flags)) {
          if (s.audience === "adults-only") {
            assert.ok(permitted, `${where}: servicio ${s.id} es adults-only`);
          }
        }
        for (const ch of charactersFor(c.brand, et, c.mode, c.flags)) {
          if (ch.audience === "adults-only") {
            assert.ok(permitted, `${where}: personaje ${ch.id} es adults-only`);
          }
        }
        for (const answers of answerVariants(c.brand, et)) {
          for (const { service } of recommendationsFor(c.brand, answers, c.mode, c.flags)) {
            if (service.audience === "adults-only") {
              assert.ok(permitted, `${where}: sugirió ${service.id}, que es adults-only`);
            }
          }
        }
      }
    });
  }

  test("el recorrido habilitado sí ofrece el show para mayores (el filtro no es un bloqueo total)", () => {
    const despedida = eventById("nm-adultos-despedida");
    const ids = servicesFor("noche-magik", despedida, "adults-only", FLAG_ON).map((s) => s.id);
    assert.ok(ids.includes("nm-adultos-show"));
  });

  test("el mismo evento adults-only en el modo general no recibe el show", () => {
    const despedida = eventById("nm-adultos-despedida");
    for (const flags of [FLAG_ON, FLAG_OFF]) {
      const ids = servicesFor("noche-magik", despedida, "general", flags).map((s) => s.id);
      assert.ok(!ids.includes("nm-adultos-show"), flagLabel(flags));
    }
  });
});

// ---------------------------------------------------------------------------
// Regla 2: donde hay menores, solo contenido para todo público
// ---------------------------------------------------------------------------

describe("Eventos con menores (with-minors) solo reciben contenido apto para todo público", () => {
  const withMinors = eventTypes.filter((e) => e.audience === "with-minors");

  test("existen eventos with-minors en las dos marcas", () => {
    for (const brand of BRANDS) {
      assert.ok(withMinors.some((e) => e.brand === brand), brand);
    }
  });

  for (const c of COMBOS) {
    test(c.label, () => {
      for (const et of withMinors) {
        const where = `${c.label}, ${etLabel(et)}`;
        for (const s of servicesFor(c.brand, et, c.mode, c.flags)) {
          assert.equal(s.audience, "all-ages", `${where}: servicio ${s.id}`);
        }
        for (const ch of charactersFor(c.brand, et, c.mode, c.flags)) {
          assert.equal(ch.audience, "all-ages", `${where}: personaje ${ch.id}`);
        }
        for (const answers of answerVariants(c.brand, et)) {
          for (const { service } of recommendationsFor(c.brand, answers, c.mode, c.flags)) {
            assert.equal(service.audience, "all-ages", `${where}: sugirió ${service.id}`);
          }
        }
      }
    });
  }

  test("un evento para todo público o sin tipo elegido tampoco recibe nada para adultos", () => {
    for (const c of COMBOS) {
      for (const et of EVENT_CANDIDATES.filter(onlyAllAges)) {
        const where = `${c.label}, ${etLabel(et)}`;
        for (const s of servicesFor(c.brand, et, c.mode, c.flags)) {
          assert.equal(s.audience, "all-ages", `${where}: servicio ${s.id}`);
        }
        for (const ch of charactersFor(c.brand, et, c.mode, c.flags)) {
          assert.equal(ch.audience, "all-ages", `${where}: personaje ${ch.id}`);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Las reglas con servicios y personajes de prueba. El catálogo actual no tiene
// nada "adults": sin estos casos la regla 2 pasaría sin haberse ejercitado.
// ---------------------------------------------------------------------------

function fakeService(brand: BrandId, audience: ServiceAudience): Service {
  return {
    id: `prueba-${brand}-${audience}`,
    slug: `prueba-${audience}`,
    brand,
    name: `Servicio de prueba ${audience}`,
    shortDescription: "Solo para los tests.",
    category: "prueba",
    audience,
    tags: [],
    pairsWith: [],
    commercialPriority: 999,
    price: null,
    pendingConfirmation: true,
  };
}

function fakeCharacter(brand: BrandId, audience: ServiceAudience): Character {
  return {
    id: `prueba-${brand}-${audience}`,
    brand,
    name: `Personaje de prueba ${audience}`,
    description: "Solo para los tests.",
    audience,
    suggestedFor: [],
    pendingConfirmation: true,
  };
}

describe("Reglas de público con servicios y personajes de prueba", () => {
  for (const c of COMBOS) {
    test(c.label, () => {
      for (const audience of ["adults", "adults-only"] as const) {
        const service = fakeService(c.brand, audience);
        const character = fakeCharacter(c.brand, audience);
        for (const et of EVENT_CANDIDATES) {
          const where = `${c.label}, ${etLabel(et)}, ítem ${audience}`;
          const sOk = isServiceAllowed(service, et, c.mode, c.flags);
          const chOk = isCharacterAllowed(character, et, c.mode, c.flags);

          if (et && et.brand !== c.brand) {
            assert.equal(sOk, false, `${where}: cruzó de marca`);
            assert.equal(chOk, false, `${where}: cruzó de marca`);
            continue;
          }
          if (onlyAllAges(et)) {
            assert.equal(sOk, false, `${where}: servicio para adultos donde puede haber menores`);
            assert.equal(chOk, false, `${where}: personaje para adultos donde puede haber menores`);
          }
          if (audience === "adults-only" && !adultsOnlyPermitted(c.brand, et, c.mode, c.flags)) {
            assert.equal(sOk, false, `${where}: adults-only fuera del recorrido para mayores`);
            assert.equal(chOk, false, `${where}: adults-only fuera del recorrido para mayores`);
          }
        }
      }
    });
  }

  test("un servicio 'adults' sí se ofrece en una fiesta de adultos", () => {
    const service = fakeService("noche-magik", "adults");
    for (const id of ["nm-fiesta", "nm-boliche", "nm-empresa"]) {
      const et = eventById(id);
      assert.equal(et.audience, "adults");
      assert.equal(isServiceAllowed(service, et, "general", FLAG_OFF), true, id);
    }
  });

  test("algo adults-only cargado por error en Daale nunca se ofrece", () => {
    const service = fakeService("daale", "adults-only");
    const character = fakeCharacter("daale", "adults-only");
    const daaleAdultsEvent: EventType = {
      ...eventById("daale-cumple-adultos"),
      id: "prueba-daale-adults-only",
      audience: "adults-only",
    };
    for (const mode of MODES) {
      for (const flags of [FLAG_ON, FLAG_OFF]) {
        assert.equal(isServiceAllowed(service, daaleAdultsEvent, mode, flags), false);
        assert.equal(isCharacterAllowed(character, daaleAdultsEvent, mode, flags), false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Flag apagado
// ---------------------------------------------------------------------------

describe("Con el flag apagado la categoría para mayores no existe", () => {
  test("ningún listado ni sugerencia devuelve algo adults-only, en ninguna marca ni modo", () => {
    for (const brand of BRANDS) {
      for (const mode of MODES) {
        assert.deepEqual(eventTypesFor(brand, mode, FLAG_OFF).filter((e) => e.audience === "adults-only"), []);
        for (const et of EVENT_CANDIDATES) {
          const where = `${brand}, ${mode}, ${etLabel(et)}`;
          assert.ok(
            servicesFor(brand, et, mode, FLAG_OFF).every((s) => s.audience !== "adults-only"),
            where
          );
          assert.ok(
            charactersFor(brand, et, mode, FLAG_OFF).every((ch) => ch.audience !== "adults-only"),
            where
          );
          for (const answers of answerVariants(brand, et)) {
            assert.ok(
              recommendationsFor(brand, answers, mode, FLAG_OFF).every(
                (r) => r.service.audience !== "adults-only"
              ),
              where
            );
          }
        }
      }
    }
  });

  test("el modo adults-only no tiene tipos de evento", () => {
    for (const brand of BRANDS) {
      assert.deepEqual(eventTypesFor(brand, "adults-only", FLAG_OFF), [], brand);
    }
    assert.equal(adultCategoryAvailable("noche-magik", FLAG_OFF), false);
    assert.equal(adultCategoryAvailable("daale", FLAG_ON), false);
    assert.equal(adultCategoryAvailable("noche-magik", FLAG_ON), true);
  });

  test(
    "el modo adults-only tampoco ofrece servicios, personajes ni sugerencias cuando la categoría no está disponible",
    () => {
      for (const brand of BRANDS) {
        for (const flags of [FLAG_OFF, ...(brand === "daale" ? [FLAG_ON] : [])]) {
          const where = `${brand}, ${flagLabel(flags)}`;
          assert.deepEqual(servicesFor(brand, null, "adults-only", flags).map((s) => s.id), [], where);
          assert.deepEqual(charactersFor(brand, null, "adults-only", flags).map((ch) => ch.id), [], where);
          for (const answers of answerVariants(brand, null)) {
            assert.deepEqual(
              recommendationsFor(brand, answers, "adults-only", flags).map((r) => r.service.id),
              [],
              where
            );
          }
        }
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Daale
// ---------------------------------------------------------------------------

describe("Daale nunca ofrece nada adults-only", () => {
  for (const c of COMBOS.filter((x) => x.brand === "daale")) {
    test(c.label, () => {
      assert.ok(eventTypesFor("daale", c.mode, c.flags).every((e) => e.audience !== "adults-only"));
      for (const et of EVENT_CANDIDATES) {
        const where = `${c.label}, ${etLabel(et)}`;
        assert.ok(servicesFor("daale", et, c.mode, c.flags).every((s) => s.audience !== "adults-only"), where);
        assert.ok(charactersFor("daale", et, c.mode, c.flags).every((ch) => ch.audience !== "adults-only"), where);
        for (const answers of answerVariants("daale", et)) {
          assert.ok(
            recommendationsFor("daale", answers, c.mode, c.flags).every(
              (r) => r.service.audience !== "adults-only"
            ),
            where
          );
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Listados: marca y orden
// ---------------------------------------------------------------------------

describe("servicesFor y charactersFor", () => {
  test("nunca mezclan marcas, y con un evento de la otra marca no devuelven nada", () => {
    for (const c of COMBOS) {
      for (const et of EVENT_CANDIDATES) {
        const svc = servicesFor(c.brand, et, c.mode, c.flags);
        const chs = charactersFor(c.brand, et, c.mode, c.flags);
        assert.ok(svc.every((s) => s.brand === c.brand), `${c.label}, ${etLabel(et)}`);
        assert.ok(chs.every((ch) => ch.brand === c.brand), `${c.label}, ${etLabel(et)}`);
        if (et && et.brand !== c.brand) {
          assert.deepEqual(svc, [], `${c.label}, ${etLabel(et)}`);
          assert.deepEqual(chs, [], `${c.label}, ${etLabel(et)}`);
        }
      }
    }
  });

  test("los servicios solo para empresas no aparecen para particulares y viceversa", () => {
    for (const et of eventTypes) {
      for (const s of servicesFor(et.brand, et, "general", FLAG_OFF)) {
        if (s.clientTypes) {
          assert.ok(s.clientTypes.includes(et.clientType), `${et.id} recibió ${s.id}`);
        }
      }
    }
    const infantil = servicesFor("daale", eventById("daale-cumple-infantil"), "general", FLAG_OFF).map((s) => s.id);
    assert.ok(!infantil.includes("daale-mascota"));
    assert.ok(infantil.includes("daale-desayuno"));
    const shopping = servicesFor("daale", eventById("daale-shopping"), "general", FLAG_OFF).map((s) => s.id);
    assert.ok(shopping.includes("daale-mascota"));
    assert.ok(!shopping.includes("daale-desayuno"));
  });

  test("los servicios salen ordenados por prioridad comercial", () => {
    for (const c of COMBOS) {
      const priorities = servicesFor(c.brand, null, c.mode, c.flags).map((s) => s.commercialPriority);
      assert.deepEqual(priorities, [...priorities].sort((a, b) => a - b), c.label);
    }
  });

  test("los personajes sugeridos para el tipo de evento van primero", () => {
    for (const et of eventTypes) {
      const list = charactersFor(et.brand, et, "general", FLAG_OFF);
      const firstOther = list.findIndex((ch) => !ch.suggestedFor.includes(et.id));
      if (firstOther === -1) continue;
      assert.ok(
        list.slice(firstOther).every((ch) => !ch.suggestedFor.includes(et.id)),
        `${et.id}: hay un sugerido después de uno no sugerido`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Sugerencias
// ---------------------------------------------------------------------------

describe("recommendationsFor", () => {
  for (const c of COMBOS) {
    test(`nunca sugiere algo no permitido ni ya elegido (${c.label})`, () => {
      for (const et of EVENT_CANDIDATES) {
        for (const answers of answerVariants(c.brand, et)) {
          const recs = recommendationsFor(c.brand, answers, c.mode, c.flags);
          const ids = recs.map((r) => r.service.id);
          const allowedIds = new Set(servicesFor(c.brand, et, c.mode, c.flags).map((s) => s.id));
          const where = `${c.label}, ${etLabel(et)}, elegidos [${answers.serviceIds.join(", ")}]`;

          assert.equal(new Set(ids).size, ids.length, `${where}: sugerencia repetida`);
          if (et && et.brand !== c.brand) assert.deepEqual(ids, [], where);

          for (const { recommendation, service } of recs) {
            const what = `${where}: sugirió ${service.id}`;
            assert.equal(recommendation.brand, c.brand, what);
            assert.equal(service.brand, c.brand, what);
            assert.equal(recommendation.suggestServiceId, service.id, what);
            assert.ok(!answers.serviceIds.includes(service.id), `${what}, que ya estaba elegido`);
            assert.ok(isServiceAllowed(service, et, c.mode, c.flags), `${what}, que no está permitido`);
            assert.ok(allowedIds.has(service.id), `${what}, que no figura en servicesFor`);
            if (onlyAllAges(et)) assert.equal(service.audience, "all-ages", what);
          }
        }
      }
    });
  }

  test("en una fiesta de 15 sugiere recepción y personajes, y no repite lo elegido", () => {
    const base = { ...emptyAnswers(), eventTypeId: "nm-15" };
    const first = recommendationsFor("noche-magik", base, "general", FLAG_ON).map((r) => r.service.id);
    assert.ok(first.includes("nm-recepcion"));
    assert.ok(first.includes("nm-personajes"));

    const withReception = { ...base, serviceIds: ["nm-recepcion"] };
    const second = recommendationsFor("noche-magik", withReception, "general", FLAG_ON).map((r) => r.service.id);
    assert.ok(!second.includes("nm-recepcion"));
    assert.ok(second.includes("nm-zancudos"), "con recepción elegida se sugieren zancudos");
  });

  test("en un cumpleaños infantil con personajes sugiere maquillaje, fotos y globoflexia", () => {
    const answers = {
      ...emptyAnswers(),
      eventTypeId: "daale-cumple-infantil",
      serviceIds: ["daale-personajes"],
    };
    const ids = recommendationsFor("daale", answers, "general", FLAG_OFF).map((r) => r.service.id);
    for (const id of ["daale-maquillaje", "daale-fotos", "daale-globoflexia"]) {
      assert.ok(ids.includes(id), id);
    }
  });

  test("las cantidades se leen con el mismo criterio que la validación", () => {
    const base = { ...emptyAnswers(), eventTypeId: "daale-cumple-infantil" };
    const suggestsAnimation = (childrenCount: string) =>
      recommendationsFor("daale", { ...base, childrenCount }, "general", FLAG_OFF).some(
        (r) => r.service.id === "daale-animacion"
      );
    assert.ok(suggestsAnimation("25"));
    assert.ok(suggestsAnimation(" 25 "));
    assert.ok(suggestsAnimation("1.500"), "con punto de miles");
    assert.ok(!suggestsAnimation("5"));
    // Lo que la validación rechaza tampoco cuenta: se corrige antes de seguir.
    assert.ok(!suggestsAnimation("25 chicos"));
  });
});

// ---------------------------------------------------------------------------
// sanitizeAnswers: respuestas manipuladas en localStorage
// ---------------------------------------------------------------------------

const ALL_SERVICE_IDS = services.map((s) => s.id);
const ALL_CHARACTER_IDS = characters.map((c) => c.id);

/** Todo lo que alguien podría meter a mano en el almacenamiento. */
function manipulated(eventTypeId: string | null): ConfiguratorAnswers {
  return {
    ...emptyAnswers(),
    eventTypeId,
    customEventLabel: "Fiesta sorpresa",
    serviceIds: [...ALL_SERVICE_IDS, "no-existe"],
    extraServiceIds: [...ALL_SERVICE_IDS, "no-existe"].reverse(),
    characterIds: [...ALL_CHARACTER_IDS, "no-existe"],
    childrenCount: "20",
    adultsCount: "15",
    ageRange: "4-7",
    companyName: "Empresa de prueba",
    businessGoal: "Atraer familias",
    clientName: "Ana",
  };
}

function checkSanitized(
  out: ConfiguratorAnswers,
  brand: BrandId,
  mode: ConfiguratorMode,
  flags: AudienceFlags,
  where: string
) {
  const et = getEventType(out.eventTypeId);
  if (out.eventTypeId !== null) {
    assert.ok(et, `${where}: quedó un tipo de evento inexistente`);
    assert.ok(isEventTypeAllowed(et, brand, mode, flags), `${where}: quedó ${out.eventTypeId}, no permitido`);
  }

  const checkService = (id: string, list: string) => {
    const s = services.find((x) => x.id === id);
    assert.ok(s, `${where}: ${list} conserva ${id}, que no existe`);
    assert.equal(s.brand, brand, `${where}: ${list} conserva ${id}, de otra marca`);
    assert.ok(isServiceAllowed(s, et, mode, flags), `${where}: ${list} conserva ${id}, no permitido`);
    if (s.audience === "adults-only") {
      assert.ok(adultsOnlyPermitted(brand, et, mode, flags), `${where}: ${list} conserva ${id}`);
    }
    if (onlyAllAges(et)) assert.equal(s.audience, "all-ages", `${where}: ${list} conserva ${id}`);
  };
  out.serviceIds.forEach((id) => checkService(id, "serviceIds"));
  out.extraServiceIds.forEach((id) => checkService(id, "extraServiceIds"));
  for (const id of out.extraServiceIds) {
    assert.ok(!out.serviceIds.includes(id), `${where}: ${id} está elegido y también como extra`);
  }

  const opens = out.serviceIds.some((id) => services.find((s) => s.id === id)?.opensCharacters);
  if (!opens) assert.deepEqual(out.characterIds, [], `${where}: personajes sin servicio que los habilite`);
  for (const id of out.characterIds) {
    const ch = characters.find((x) => x.id === id);
    assert.ok(ch, `${where}: personaje ${id} inexistente`);
    assert.equal(ch.brand, brand, `${where}: personaje ${id} de otra marca`);
    assert.ok(isCharacterAllowed(ch, et, mode, flags), `${where}: personaje ${id} no permitido`);
  }

  if (!et?.asksAgeMix) {
    assert.equal(out.childrenCount, "", where);
    assert.equal(out.adultsCount, "", where);
    assert.equal(out.ageRange, null, where);
  }
  if (!et?.isBusiness) {
    assert.equal(out.companyName, "", where);
    assert.equal(out.businessGoal, "", where);
  }
  if (!et?.isOther) assert.equal(out.customEventLabel, "", where);
  assert.equal(out.clientName, "Ana", `${where}: no toca los datos que no dependen del público`);
}

describe("sanitizeAnswers", () => {
  for (const c of COMBOS) {
    test(`limpia cualquier combinación manipulada (${c.label})`, () => {
      for (const eventTypeId of [null, "no-existe", ...eventTypes.map((e) => e.id)]) {
        const where = `${c.label}, evento ${eventTypeId}`;
        const out = sanitizeAnswers(manipulated(eventTypeId), c.brand, c.mode, c.flags);
        checkSanitized(out, c.brand, c.mode, c.flags, where);
        assert.deepEqual(
          sanitizeAnswers(out, c.brand, c.mode, c.flags),
          out,
          `${where}: limpiar dos veces tiene que dar lo mismo`
        );
      }
    });
  }

  test("un evento de 15 con el show para adultos cargado a mano lo pierde", () => {
    for (const mode of MODES) {
      for (const flags of [FLAG_ON, FLAG_OFF]) {
        const out = sanitizeAnswers(
          {
            ...emptyAnswers(),
            eventTypeId: "nm-15",
            serviceIds: ["nm-adultos-show", "nm-recepcion"],
            extraServiceIds: ["nm-adultos-show", "nm-zancudos"],
          },
          "noche-magik",
          mode,
          flags
        );
        const where = `modo ${mode}, ${flagLabel(flags)}`;
        // Un modo para mayores deshabilitado no conserva nada.
        const disabled = mode === "adults-only" && !flags.enableAdultCategory;
        assert.deepEqual(out.serviceIds, disabled ? [] : ["nm-recepcion"], where);
        assert.deepEqual(out.extraServiceIds, disabled ? [] : ["nm-zancudos"], where);
        if (mode === "general") assert.equal(out.eventTypeId, "nm-15", where);
      }
    }
  });

  test("un evento adults-only guardado en el modo general se descarta junto con su show", () => {
    for (const flags of [FLAG_ON, FLAG_OFF]) {
      const out = sanitizeAnswers(
        {
          ...emptyAnswers(),
          eventTypeId: "nm-adultos-despedida",
          serviceIds: ["nm-adultos-show", "nm-hombre-espejo"],
        },
        "noche-magik",
        "general",
        flags
      );
      assert.equal(out.eventTypeId, null, flagLabel(flags));
      assert.deepEqual(out.serviceIds, ["nm-hombre-espejo"], flagLabel(flags));
    }
  });

  test("en el recorrido habilitado para mayores el show se conserva", () => {
    const out = sanitizeAnswers(
      { ...emptyAnswers(), eventTypeId: "nm-adultos-despedida", serviceIds: ["nm-adultos-show"] },
      "noche-magik",
      "adults-only",
      FLAG_ON
    );
    assert.equal(out.eventTypeId, "nm-adultos-despedida");
    assert.deepEqual(out.serviceIds, ["nm-adultos-show"]);
  });

  test("ids de otra marca se quitan: tipo de evento, servicios, extras y personajes", () => {
    const out = sanitizeAnswers(
      {
        ...emptyAnswers(),
        eventTypeId: "nm-15",
        serviceIds: ["daale-personajes", "nm-recepcion", "nm-personajes"],
        extraServiceIds: ["nm-zancudos", "daale-maquillaje"],
        characterIds: ["nm-chocolatero", "daale-heroe-aracnido"],
      },
      "daale",
      "general",
      FLAG_OFF
    );
    assert.equal(out.eventTypeId, null);
    assert.deepEqual(out.serviceIds, ["daale-personajes"]);
    assert.deepEqual(out.extraServiceIds, ["daale-maquillaje"]);
    assert.deepEqual(out.characterIds, ["daale-heroe-aracnido"]);
  });

  test("los personajes sin un servicio que los habilite se borran", () => {
    const base = {
      ...emptyAnswers(),
      eventTypeId: "daale-cumple-infantil",
      characterIds: ["daale-heroe-aracnido"],
    };
    const without = sanitizeAnswers({ ...base, serviceIds: ["daale-animacion"] }, "daale", "general", FLAG_OFF);
    assert.deepEqual(without.characterIds, []);

    const asExtra = sanitizeAnswers(
      { ...base, serviceIds: [], extraServiceIds: ["daale-personajes"] },
      "daale",
      "general",
      FLAG_OFF
    );
    assert.deepEqual(asExtra.characterIds, [], "un extra no habilita personajes");

    const withIt = sanitizeAnswers({ ...base, serviceIds: ["daale-personajes"] }, "daale", "general", FLAG_OFF);
    assert.deepEqual(withIt.characterIds, ["daale-heroe-aracnido"]);

    const otherBrandOpener = sanitizeAnswers(
      { ...base, serviceIds: ["nm-personajes"] },
      "daale",
      "general",
      FLAG_OFF
    );
    assert.deepEqual(otherBrandOpener.characterIds, [], "un servicio de otra marca no habilita personajes");
  });

  test("un extra que repite un servicio ya elegido se quita", () => {
    const out = sanitizeAnswers(
      {
        ...emptyAnswers(),
        eventTypeId: "daale-cumple-infantil",
        serviceIds: ["daale-personajes", "daale-maquillaje"],
        extraServiceIds: ["daale-maquillaje", "daale-fotos"],
      },
      "daale",
      "general",
      FLAG_OFF
    );
    assert.deepEqual(out.extraServiceIds, ["daale-fotos"]);
  });

  test(
    "los ids repetidos se quitan de extras, servicios y personajes",
    () => {
      const out = sanitizeAnswers(
        {
          ...emptyAnswers(),
          eventTypeId: "daale-cumple-infantil",
          serviceIds: ["daale-personajes", "daale-personajes"],
          extraServiceIds: ["daale-fotos", "daale-fotos", "daale-maquillaje"],
          characterIds: ["daale-heroe-aracnido", "daale-heroe-aracnido"],
        },
        "daale",
        "general",
        FLAG_OFF
      );
      assert.deepEqual(out.extraServiceIds, ["daale-fotos", "daale-maquillaje"]);
      assert.deepEqual(out.serviceIds, ["daale-personajes"]);
      assert.deepEqual(out.characterIds, ["daale-heroe-aracnido"]);
    }
  );

  test(
    "una banda de presupuesto de otra marca o inexistente se descarta",
    () => {
      const otherBrand = sanitizeAnswers(
        { ...emptyAnswers(), eventTypeId: "daale-cumple-infantil", budgetBandId: "nm-mas-800" },
        "daale",
        "general",
        FLAG_OFF
      );
      assert.equal(otherBrand.budgetBandId, null);
      const unknown = sanitizeAnswers(
        { ...emptyAnswers(), eventTypeId: "daale-cumple-infantil", budgetBandId: "no-existe" },
        "daale",
        "general",
        FLAG_OFF
      );
      assert.equal(unknown.budgetBandId, null);
    }
  );

  test("una banda de la misma marca se conserva", () => {
    const out = sanitizeAnswers(
      { ...emptyAnswers(), eventTypeId: "daale-cumple-infantil", budgetBandId: "daale-conversar" },
      "daale",
      "general",
      FLAG_OFF
    );
    assert.equal(out.budgetBandId, "daale-conversar");
  });

  test("conserva los datos que corresponden al tipo de evento", () => {
    const b2b = sanitizeAnswers(manipulated("daale-shopping"), "daale", "general", FLAG_OFF);
    assert.equal(b2b.companyName, "Empresa de prueba");
    assert.equal(b2b.businessGoal, "Atraer familias");

    const kids = sanitizeAnswers(manipulated("daale-cumple-infantil"), "daale", "general", FLAG_OFF);
    assert.equal(kids.childrenCount, "20");
    assert.equal(kids.adultsCount, "15");
    assert.equal(kids.ageRange, "4-7");

    const other = sanitizeAnswers(manipulated("daale-otro-particular"), "daale", "general", FLAG_OFF);
    assert.equal(other.customEventLabel, "Fiesta sorpresa");
  });

  test("no modifica el objeto que recibe", () => {
    const input = manipulated("nm-15");
    const copy = structuredClone(input);
    sanitizeAnswers(input, "noche-magik", "general", FLAG_ON);
    assert.deepEqual(input, copy);
  });
});

// ---------------------------------------------------------------------------
// Lo que la marca todavía no confirmó
// ---------------------------------------------------------------------------

describe("servicios y personajes sin confirmar", () => {
  const HIDE: AudienceFlags = { enableAdultCategory: false, showPendingServices: false };
  const pendingServices = services.filter((s) => s.pendingConfirmation);
  const pendingCharacters = characters.filter((c) => c.pendingConfirmation);

  test("el catálogo tiene servicios pendientes para probar", () => {
    assert.ok(pendingServices.length > 0);
  });

  test("con el interruptor encendido se ofrecen (con su etiqueta, en la pantalla)", () => {
    for (const brand of BRANDS) {
      const ids = servicesFor(brand, null, "general", FLAG_OFF).map((s) => s.id);
      for (const s of pendingServices.filter((x) => x.brand === brand && x.audience !== "adults-only")) {
        assert.ok(ids.includes(s.id), s.id);
      }
    }
  });

  test("apagado, no aparecen en listados, personajes, sugerencias ni respuestas guardadas", () => {
    for (const brand of BRANDS) {
      for (const et of [null, ...eventTypesFor(brand, "general", HIDE)]) {
        const listed = servicesFor(brand, et, "general", HIDE);
        assert.ok(!listed.some((s) => s.pendingConfirmation), `${brand} ${et?.id ?? "sin tipo"}`);
        assert.ok(!charactersFor(brand, et, "general", HIDE).some((c) => c.pendingConfirmation));

        const answers = {
          ...emptyAnswers(),
          eventTypeId: et?.id ?? null,
          serviceIds: services.filter((s) => s.brand === brand).map((s) => s.id),
        };
        const suggested = recommendationsFor(brand, { ...answers, serviceIds: [] }, "general", HIDE);
        assert.ok(!suggested.some((r) => r.service.pendingConfirmation), `sugerencias ${et?.id}`);

        const clean = sanitizeAnswers(
          { ...answers, extraServiceIds: pendingServices.map((s) => s.id), characterIds: pendingCharacters.map((c) => c.id) },
          brand,
          "general",
          HIDE
        );
        for (const id of [...clean.serviceIds, ...clean.extraServiceIds]) {
          assert.ok(!pendingServices.some((s) => s.id === id), `${id} quedó en las respuestas`);
        }
        for (const id of clean.characterIds) {
          assert.ok(!pendingCharacters.some((c) => c.id === id), `${id} quedó en las respuestas`);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Sugerencias pertinentes al evento
// ---------------------------------------------------------------------------

describe("las sugerencias hablan del evento elegido", () => {
  const suggestedIds = (eventTypeId: string, serviceIds: string[]) =>
    recommendationsFor(
      "daale",
      { ...emptyAnswers(), eventTypeId, serviceIds },
      "general",
      FLAG_OFF
    ).map((r) => r.service.id);

  test("el maquillaje para «los chicos» solo aparece en celebraciones con chicos", () => {
    assert.ok(suggestedIds("daale-cumple-infantil", ["daale-personajes"]).includes("daale-maquillaje"));
    assert.ok(suggestedIds("daale-familiar", ["daale-personajes"]).includes("daale-maquillaje"));
    for (const id of ["daale-cumple-adultos", "daale-corporativo", "daale-marca", "daale-shopping"]) {
      assert.ok(!suggestedIds(id, ["daale-personajes"]).includes("daale-maquillaje"), id);
    }
  });

  test("ninguna sugerencia de empresa habla de ventas: también le sirve a una escuela", () => {
    for (const r of recommendationsFor("daale", { ...emptyAnswers(), eventTypeId: "daale-institucion" }, "general", FLAG_OFF)) {
      assert.doesNotMatch(r.recommendation.reason, /comercial|venta|marca/i, r.recommendation.id);
    }
  });
});

// ---------------------------------------------------------------------------
// Lo que ya se sumó sigue a la vista
// ---------------------------------------------------------------------------

describe("extrasFor", () => {
  test("devuelve lo sumado aunque la sugerencia ya no aplique, en orden del catálogo", () => {
    const answers = {
      ...emptyAnswers(),
      eventTypeId: "daale-cumple-adultos",
      serviceIds: ["daale-animacion"],
      extraServiceIds: ["daale-fotos", "daale-globoflexia"],
    };
    assert.ok(!recommendationsFor("daale", answers, "general", FLAG_OFF).some((r) => r.service.id === "daale-fotos"));
    const ids = extrasFor("daale", answers, "general", FLAG_OFF).map((s) => s.id);
    assert.deepEqual([...ids].sort(), ["daale-fotos", "daale-globoflexia"]);
  });

  test("nunca devuelve algo que el público del evento no admite ni de otra marca", () => {
    const answers = {
      ...emptyAnswers(),
      eventTypeId: "nm-15",
      extraServiceIds: ["nm-adultos-show", "daale-fotos", "nm-zancudos"],
    };
    for (const flags of [FLAG_ON, FLAG_OFF]) {
      assert.deepEqual(
        extrasFor("noche-magik", answers, "general", flags).map((s) => s.id),
        ["nm-zancudos"]
      );
    }
  });
});
