/**
 * Estado del configurador: pasos visibles, navegación y reducer.
 *
 * El reducer es la única puerta por la que entran respuestas (clics, texto y
 * lo recuperado de localStorage), así que acá se prueba que ninguna secuencia
 * de acciones deje algo incompatible con el público del evento. El reducer usa
 * los flags de siteConfig: para probar los dos valores de enableAdultCategory
 * se cambia el flag solo durante el test (withAdultCategory).
 *
 * Ejecutar: npx tsx --test src/lib/configurator/state.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventTypes, services } from "@/lib/test-support/catalogo-completo";

import { budgetBands } from "@/config/budgets";
import { characters } from "@/config/characters";
import { siteConfig } from "@/config/site";
import {
  eventTypesFor,
  getEventType,
  isCharacterAllowed,
  isEventTypeAllowed,
  isServiceAllowed,
  recommendationsFor,
  sanitizeAnswers,
  type AudienceFlags,
} from "@/lib/audience";
import {
  emptyAnswers,
  eventLabel,
  initialState,
  nextView,
  normalizeView,
  previousView,
  reducer,
  serviceNames,
  stepPosition,
  stepsFor,
  type ConfiguratorAction,
} from "@/lib/configurator/state";
import type {
  BrandId,
  ConfiguratorAnswers,
  ConfiguratorMode,
  ConfiguratorState,
  ConfiguratorView,
  EventType,
  StepId,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

const BRANDS: BrandId[] = ["daale", "noche-magik"];
const MODES: ConfiguratorMode[] = ["general", "adults-only"];
const NOW = "2026-09-24T12:00:00.000Z";
const LATER = "2026-09-24T12:05:00.000Z";

const ALL_SERVICE_IDS = services.map((s) => s.id);
const ALL_CHARACTER_IDS = characters.map((c) => c.id);

/**
 * El reducer no recibe flags: usa los de siteConfig. Para probar los dos
 * valores se cambia el flag solo mientras corre la función.
 */
function withAdultCategory<T>(enabled: boolean, fn: () => T): T {
  const flags = siteConfig.flags as { enableAdultCategory: boolean };
  const before = flags.enableAdultCategory;
  flags.enableAdultCategory = enabled;
  try {
    return fn();
  } finally {
    flags.enableAdultCategory = before;
  }
}

function start(brand: BrandId, mode: ConfiguratorMode = "general"): ConfiguratorState {
  return initialState(brand, mode, NOW);
}

function run(state: ConfiguratorState, actions: ConfiguratorAction[]): ConfiguratorState {
  return actions.reduce(reducer, state);
}

function withAnswers(
  brand: BrandId,
  answers: Partial<ConfiguratorAnswers>,
  view: ConfiguratorView = "tipo",
  mode: ConfiguratorMode = "general"
): ConfiguratorState {
  return { ...start(brand, mode), answers: { ...emptyAnswers(), ...answers }, view };
}

const setEventType = (id: string): ConfiguratorAction => ({ type: "setEventType", id, now: NOW });
const toggleService = (id: string): ConfiguratorAction => ({ type: "toggleService", id, now: NOW });
const toggleCharacter = (id: string): ConfiguratorAction => ({ type: "toggleCharacter", id, now: NOW });
const toggleExtra = (id: string): ConfiguratorAction => ({ type: "toggleExtra", id, now: NOW });
const patch = (p: Partial<ConfiguratorAnswers>): ConfiguratorAction => ({ type: "patch", patch: p, now: NOW });
const goTo = (view: ConfiguratorView): ConfiguratorAction => ({ type: "goTo", view, now: NOW });

function eventById(id: string): EventType {
  const et = getEventType(id);
  assert.ok(et, `falta el tipo de evento ${id}`);
  return et;
}

/** Avanza con «Continuar» hasta el resumen y devuelve las vistas recorridas. */
function walkForward(state: ConfiguratorState): ConfiguratorView[] {
  const seen: ConfiguratorView[] = [state.view];
  let s = state;
  for (let i = 0; i < 10 && s.view !== "resumen"; i++) {
    s = reducer(s, goTo(nextView(s)));
    seen.push(s.view);
  }
  return seen;
}

/** Retrocede con «Volver» desde donde esté hasta que no haya más pasos. */
function walkBack(state: ConfiguratorState): ConfiguratorView[] {
  const seen: ConfiguratorView[] = [state.view];
  let s = state;
  for (let i = 0; i < 10; i++) {
    const prev = previousView(s);
    if (prev === null) break;
    s = reducer(s, goTo(prev));
    seen.push(s.view);
  }
  return seen;
}

/**
 * Invariantes del estado después de cualquier acción: lo que queda es de la
 * marca, está permitido para el público del evento y ya está limpio.
 */
function assertStateIsSafe(state: ConfiguratorState, flags: AudienceFlags, where: string) {
  const { brand, mode, answers } = state;
  const et = getEventType(answers.eventTypeId);
  if (answers.eventTypeId !== null) {
    assert.ok(et, `${where}: tipo de evento inexistente ${answers.eventTypeId}`);
    assert.ok(isEventTypeAllowed(et, brand, mode, flags), `${where}: ${et.id} no permitido`);
  }
  const adultsOnlyPermitted =
    brand === "noche-magik" &&
    flags.enableAdultCategory &&
    mode === "adults-only" &&
    et?.audience === "adults-only";
  const onlyAllAges = !et || et.audience === "with-minors" || et.audience === "all-ages";

  for (const id of [...answers.serviceIds, ...answers.extraServiceIds]) {
    const s = services.find((x) => x.id === id);
    assert.ok(s, `${where}: servicio inexistente ${id}`);
    assert.equal(s.brand, brand, `${where}: servicio ${id} de otra marca`);
    assert.ok(isServiceAllowed(s, et, mode, flags), `${where}: servicio ${id} no permitido`);
    if (s.audience === "adults-only") assert.ok(adultsOnlyPermitted, `${where}: quedó ${id}`);
    if (onlyAllAges) assert.equal(s.audience, "all-ages", `${where}: quedó ${id}`);
  }
  for (const id of answers.characterIds) {
    const c = characters.find((x) => x.id === id);
    assert.ok(c, `${where}: personaje inexistente ${id}`);
    assert.equal(c.brand, brand, `${where}: personaje ${id} de otra marca`);
    assert.ok(isCharacterAllowed(c, et, mode, flags), `${where}: personaje ${id} no permitido`);
    if (onlyAllAges) assert.equal(c.audience, "all-ages", `${where}: quedó ${id}`);
  }
  assert.deepEqual(
    sanitizeAnswers(answers, brand, mode, flags),
    answers,
    `${where}: el estado no quedó limpio`
  );
  assert.ok(
    state.view === "resumen" || stepsFor(state).includes(state.view),
    `${where}: la vista ${state.view} no es un paso vigente`
  );
}

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------

describe("emptyAnswers e initialState", () => {
  test("las respuestas vacías no tienen nada elegido", () => {
    const a = emptyAnswers();
    assert.equal(a.eventTypeId, null);
    assert.deepEqual(a.serviceIds, []);
    assert.deepEqual(a.characterIds, []);
    assert.deepEqual(a.extraServiceIds, []);
    assert.equal(a.budgetBandId, null);
    assert.equal(a.clientName, "");
    assert.equal(a.eventDate, "");
  });

  test("cada llamada devuelve listas nuevas: una configuración no contamina la siguiente", () => {
    const a = emptyAnswers();
    a.serviceIds.push("daale-personajes");
    a.extraServiceIds.push("daale-fotos");
    a.characterIds.push("daale-ninja-rojo");
    const b = emptyAnswers();
    assert.deepEqual(b.serviceIds, []);
    assert.deepEqual(b.extraServiceIds, []);
    assert.deepEqual(b.characterIds, []);
  });

  test("el estado inicial arranca en el primer paso, sin fecha de inicio", () => {
    for (const brand of BRANDS) {
      for (const mode of MODES) {
        const s = initialState(brand, mode, NOW);
        assert.equal(s.version, 1);
        assert.equal(s.brand, brand);
        assert.equal(s.mode, mode);
        assert.equal(s.view, "tipo");
        assert.equal(s.startedAt, null);
        assert.equal(s.updatedAt, NOW);
        assert.deepEqual(s.answers, emptyAnswers());
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Pasos visibles
// ---------------------------------------------------------------------------

describe("stepsFor", () => {
  test("siempre empieza en «tipo», termina en «confirmar» y tiene 4 o 5 pasos", () => {
    for (const et of [null, ...eventTypes]) {
      const brand = et?.brand ?? "daale";
      for (const serviceIds of [[], services.filter((s) => s.brand === brand).map((s) => s.id)]) {
        const steps = stepsFor(withAnswers(brand, { eventTypeId: et?.id ?? null, serviceIds }));
        const where = `${et?.id ?? "sin tipo"}, ${serviceIds.length} servicios`;
        assert.equal(steps[0], "tipo", where);
        assert.equal(steps[1], "servicios", where);
        assert.equal(steps[2], "datos", where);
        assert.equal(steps[steps.length - 1], "confirmar", where);
        assert.ok(steps.length === 4 || steps.length === 5, `${where}: ${steps.length} pasos`);
        assert.equal(new Set(steps).size, steps.length, `${where}: paso repetido`);
      }
    }
  });

  test("«sugerencias» aparece exactamente cuando hay algo pertinente para sugerir", () => {
    for (const brand of BRANDS) {
      const brandServices = services.filter((s) => s.brand === brand).map((s) => s.id);
      for (const et of [null, ...eventTypes.filter((e) => e.brand === brand)]) {
        for (const serviceIds of [[], ...brandServices.map((id) => [id])]) {
          for (const counts of [
            {},
            { approximateAttendees: "300", childrenCount: "40" },
          ]) {
            const state = withAnswers(brand, { eventTypeId: et?.id ?? null, serviceIds, ...counts });
            const expected = recommendationsFor(brand, state.answers, state.mode).length > 0;
            assert.equal(
              stepsFor(state).includes("sugerencias"),
              expected,
              `${brand}, ${et?.id ?? "sin tipo"}, [${serviceIds.join(", ")}]`
            );
          }
        }
      }
    }
  });

  test("saltea «sugerencias» cuando no aplica", () => {
    const cases: [BrandId, Partial<ConfiguratorAnswers>][] = [
      ["daale", { eventTypeId: "daale-cumple-adultos" }],
      ["daale", { eventTypeId: "daale-cumple-adultos", serviceIds: ["daale-animacion"] }],
      ["noche-magik", { eventTypeId: "nm-casamiento" }],
      ["noche-magik", { eventTypeId: "nm-show", serviceIds: ["nm-hombre-espejo"] }],
    ];
    for (const [brand, answers] of cases) {
      assert.deepEqual(
        stepsFor(withAnswers(brand, answers)),
        ["tipo", "servicios", "datos", "confirmar"],
        answers.eventTypeId ?? ""
      );
    }
  });

  test("muestra «sugerencias» cuando aplica", () => {
    const cases: [BrandId, Partial<ConfiguratorAnswers>][] = [
      ["daale", { eventTypeId: "daale-cumple-infantil" }],
      ["daale", { eventTypeId: "daale-cumple-adultos", serviceIds: ["daale-personajes"] }],
      ["daale", { eventTypeId: "daale-shopping" }],
      ["noche-magik", { eventTypeId: "nm-15" }],
      ["noche-magik", { eventTypeId: "nm-casamiento", approximateAttendees: "150" }],
    ];
    for (const [brand, answers] of cases) {
      assert.deepEqual(
        stepsFor(withAnswers(brand, answers)),
        ["tipo", "servicios", "datos", "sugerencias", "confirmar"],
        JSON.stringify(answers)
      );
    }
  });

  test("si ya eligió todo lo que se le sugeriría, el paso desaparece", () => {
    const state = withAnswers("noche-magik", {
      eventTypeId: "nm-15",
      serviceIds: ["nm-recepcion", "nm-personajes", "nm-zancudos"],
    });
    assert.ok(!stepsFor(state).includes("sugerencias"));
  });

  test("con el flag apagado, el modo para mayores no tiene sugerencias", () => {
    withAdultCategory(false, () => {
      for (const et of eventTypes.filter((e) => e.brand === "noche-magik")) {
        const state = withAnswers(
          "noche-magik",
          { eventTypeId: et.id, serviceIds: ["nm-recepcion"], approximateAttendees: "500" },
          "tipo",
          "adults-only"
        );
        assert.ok(!stepsFor(state).includes("sugerencias"), et.id);
      }
    });
  });

  test("stepPosition da el «Paso X de Y» real", () => {
    const five = withAnswers("noche-magik", { eventTypeId: "nm-15" });
    const order: StepId[] = ["tipo", "servicios", "datos", "sugerencias", "confirmar"];
    assert.deepEqual(
      order.map((step) => {
        const p = stepPosition(five, step);
        return `${p.number}/${p.total}`;
      }),
      ["1/5", "2/5", "3/5", "4/5", "5/5"]
    );
    const four = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" });
    assert.equal(stepPosition(four, "confirmar").number, 4);
    assert.equal(stepPosition(four, "confirmar").total, 4);
  });
});

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------

describe("nextView y previousView", () => {
  const scenarios: [string, BrandId, Partial<ConfiguratorAnswers>][] = [
    ["Daale sin sugerencias", "daale", { eventTypeId: "daale-cumple-adultos", serviceIds: ["daale-animacion"] }],
    ["Daale con sugerencias", "daale", { eventTypeId: "daale-cumple-infantil", serviceIds: ["daale-personajes"] }],
    ["Noche Magik sin sugerencias", "noche-magik", { eventTypeId: "nm-casamiento", serviceIds: ["nm-hombre-espejo"] }],
    ["Noche Magik con sugerencias", "noche-magik", { eventTypeId: "nm-15", serviceIds: ["nm-recepcion"] }],
  ];

  for (const [name, brand, answers] of scenarios) {
    test(`recorre todos los pasos hasta el resumen y vuelve al principio (${name})`, () => {
      const state = withAnswers(brand, answers);
      const steps = stepsFor(state);
      const forward = walkForward(state);
      assert.deepEqual(forward, [...steps, "resumen"]);

      const atSummary = { ...state, view: "resumen" as const };
      assert.equal(nextView(atSummary), "resumen", "el resumen es el final");
      assert.deepEqual(walkBack(atSummary), ["resumen", ...[...steps].reverse()]);
    });
  }

  test("en el primer paso no hay «Volver»", () => {
    assert.equal(previousView(start("daale")), null);
    assert.equal(previousView(start("noche-magik")), null);
  });

  test("desde el resumen, «Volver» lleva al último paso", () => {
    assert.equal(previousView(withAnswers("daale", { eventTypeId: "daale-cumple-infantil" }, "resumen")), "confirmar");
  });

  test("si «sugerencias» deja de aplicar, avanzar y volver lo saltean", () => {
    const fromDatos = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" }, "datos");
    assert.equal(nextView(fromDatos), "confirmar");
    const fromConfirm = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" }, "confirmar");
    assert.equal(previousView(fromConfirm), "datos");

    const withRecs = withAnswers("noche-magik", { eventTypeId: "nm-15" }, "datos");
    assert.equal(nextView(withRecs), "sugerencias");
    assert.equal(previousView({ ...withRecs, view: "confirmar" }), "sugerencias");
  });

  test("normalizeView estricto lleva una vista vencida al paso vigente más cercano", () => {
    const stale = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" }, "sugerencias");
    assert.equal(normalizeView(stale, true), "datos");
    const valid = withAnswers("noche-magik", { eventTypeId: "nm-15" }, "sugerencias");
    assert.equal(normalizeView(valid, true), "sugerencias");
    assert.equal(normalizeView({ ...valid, view: "resumen" }, true), "resumen");
  });

  test("mientras se está en «Sugerencias», el paso se sostiene aunque quede vacío", () => {
    const current = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" }, "sugerencias");
    assert.equal(normalizeView(current), "sugerencias");
    const elsewhere = withAnswers("noche-magik", { eventTypeId: "nm-casamiento" }, "servicios");
    assert.ok(!stepsFor(elsewhere).includes("sugerencias"));
  });
});

// ---------------------------------------------------------------------------
// Reducer: tipo de evento
// ---------------------------------------------------------------------------

describe("reducer: tipo de evento", () => {
  test("el primer tipo elegido marca el inicio y no se pisa después", () => {
    let s = reducer(start("daale"), { type: "setEventType", id: "daale-cumple-infantil", now: NOW });
    assert.equal(s.startedAt, NOW);
    assert.equal(s.updatedAt, NOW);
    s = reducer(s, { type: "setEventType", id: "daale-familiar", now: LATER });
    assert.equal(s.startedAt, NOW);
    assert.equal(s.updatedAt, LATER);
    assert.equal(s.answers.eventTypeId, "daale-familiar");
  });

  test("pasar de un cumpleaños infantil a un shopping borra edades y servicios solo para particulares", () => {
    const s = run(start("daale"), [
      setEventType("daale-cumple-infantil"),
      toggleService("daale-personajes"),
      toggleService("daale-desayuno"),
      toggleCharacter("daale-heroe-aracnido"),
      patch({ childrenCount: "25", adultsCount: "15", ageRange: "4-7" }),
      setEventType("daale-shopping"),
    ]);
    assert.equal(s.answers.eventTypeId, "daale-shopping");
    assert.deepEqual(s.answers.serviceIds, ["daale-personajes"], "el desayuno sorpresa es solo para particulares");
    assert.deepEqual(s.answers.characterIds, ["daale-heroe-aracnido"], "los personajes siguen valiendo");
    assert.equal(s.answers.childrenCount, "");
    assert.equal(s.answers.adultsCount, "");
    assert.equal(s.answers.ageRange, null);
  });

  test("pasar de un shopping a un cumpleaños borra empresa, objetivo y servicios de empresa", () => {
    const s = run(start("daale"), [
      setEventType("daale-shopping"),
      toggleService("daale-mascota"),
      toggleService("daale-intervencion"),
      toggleService("daale-animacion"),
      patch({ companyName: "Shopping del Sol", businessGoal: "Atraer familias" }),
      toggleExtra("daale-recepcion"),
      setEventType("daale-cumple-infantil"),
    ]);
    assert.deepEqual(s.answers.serviceIds, ["daale-animacion"]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-recepcion"]);
    assert.equal(s.answers.companyName, "");
    assert.equal(s.answers.businessGoal, "");
  });

  test("el texto de «Otro» se borra al cambiar de tipo y se conserva si elige el mismo", () => {
    let s = run(start("daale"), [
      setEventType("daale-otro-particular"),
      patch({ customEventLabel: "Fiesta de egresados" }),
      setEventType("daale-otro-particular"),
    ]);
    assert.equal(s.answers.customEventLabel, "Fiesta de egresados");
    s = reducer(s, setEventType("daale-otro-empresa"));
    assert.equal(s.answers.customEventLabel, "", "otro «Otro» empieza vacío");
    s = run(s, [patch({ customEventLabel: "Kermés" }), setEventType("daale-familiar")]);
    assert.equal(s.answers.customEventLabel, "");
    s = reducer(s, setEventType("daale-otro-particular"));
    assert.equal(s.answers.customEventLabel, "");
  });

  test("en el recorrido general no se puede elegir un tipo para mayores, con el flag en cualquier valor", () => {
    for (const enabled of [true, false]) {
      withAdultCategory(enabled, () => {
        for (const et of eventTypes.filter((e) => e.audience === "adults-only")) {
          const s = reducer(start("noche-magik"), setEventType(et.id));
          assert.equal(s.answers.eventTypeId, null, `${et.id}, flag ${enabled}`);
        }
      });
    }
  });

  test("no se puede elegir un tipo de otra marca ni uno inexistente", () => {
    assert.equal(reducer(start("daale"), setEventType("nm-15")).answers.eventTypeId, null);
    assert.equal(reducer(start("noche-magik"), setEventType("daale-cumple-infantil")).answers.eventTypeId, null);
    assert.equal(reducer(start("daale"), setEventType("no-existe")).answers.eventTypeId, null);
  });

  test("con el flag apagado, el modo para mayores no deja elegir ni sumar nada", () => {
    withAdultCategory(false, () => {
      for (const brand of BRANDS) {
        for (const et of eventTypes) {
          const s = run(start(brand, "adults-only"), [
            setEventType(et.id),
            ...ALL_SERVICE_IDS.map(toggleService),
            ...ALL_SERVICE_IDS.map(toggleExtra),
          ]);
          const where = `${brand}, ${et.id}`;
          assert.equal(s.answers.eventTypeId, null, where);
          assert.deepEqual(s.answers.serviceIds, [], where);
          assert.deepEqual(s.answers.extraServiceIds, [], where);
        }
      }
    });
  });

  test("con el flag encendido, el recorrido para mayores acepta solo sus tipos, y el show solo ahí", () => {
    withAdultCategory(true, () => {
      const adults = run(start("noche-magik", "adults-only"), [
        setEventType("nm-adultos-despedida"),
        toggleService("nm-adultos-show"),
      ]);
      assert.equal(adults.answers.eventTypeId, "nm-adultos-despedida");
      assert.deepEqual(adults.answers.serviceIds, ["nm-adultos-show"]);

      for (const et of eventTypes.filter((e) => e.audience !== "adults-only")) {
        const s = reducer(start("noche-magik", "adults-only"), setEventType(et.id));
        assert.equal(s.answers.eventTypeId, null, `${et.id} no es del recorrido para mayores`);
      }

      const toMinors = run(adults, [setEventType("nm-15")]);
      assert.equal(toMinors.answers.eventTypeId, null);
      assert.deepEqual(toMinors.answers.serviceIds, [], "el show no sobrevive al cambio");

      for (const brand of BRANDS) {
        const general = run(start(brand), [
          setEventType(brand === "daale" ? "daale-cumple-adultos" : "nm-fiesta"),
          toggleService("nm-adultos-show"),
          toggleExtra("nm-adultos-show"),
        ]);
        assert.deepEqual(general.answers.serviceIds, [], `${brand}: el show no entra al recorrido general`);
        assert.deepEqual(general.answers.extraServiceIds, [], brand);
      }
    });
  });

  test("el interruptor de prueba realmente cambia el flag que usa el reducer", () => {
    // Si audience.ts deja de leer siteConfig.flags, los tests con
    // withAdultCategory dejarían de probar lo que dicen: este test lo avisa.
    withAdultCategory(true, () => {
      assert.ok(eventTypesFor("noche-magik", "adults-only").length > 0);
    });
    withAdultCategory(false, () => {
      assert.deepEqual(eventTypesFor("noche-magik", "adults-only"), []);
    });
  });
});

// ---------------------------------------------------------------------------
// Reducer: servicios, personajes y extras
// ---------------------------------------------------------------------------

describe("reducer: servicios, personajes y extras", () => {
  const base = () => run(start("daale"), [setEventType("daale-cumple-infantil")]);

  test("toggleService agrega y quita", () => {
    let s = reducer(base(), toggleService("daale-animacion"));
    assert.deepEqual(s.answers.serviceIds, ["daale-animacion"]);
    s = reducer(s, toggleService("daale-maquillaje"));
    assert.deepEqual(s.answers.serviceIds, ["daale-animacion", "daale-maquillaje"]);
    s = reducer(s, toggleService("daale-animacion"));
    assert.deepEqual(s.answers.serviceIds, ["daale-maquillaje"]);
  });

  test("quitar «Personajes» borra los personajes elegidos", () => {
    let s = run(base(), [toggleService("daale-personajes"), toggleCharacter("daale-ninja-rojo")]);
    assert.deepEqual(s.answers.characterIds, ["daale-ninja-rojo"]);
    s = reducer(s, toggleService("daale-personajes"));
    assert.deepEqual(s.answers.characterIds, []);
  });

  test("sin un servicio que los habilite, no se pueden elegir personajes", () => {
    const s = run(base(), [toggleService("daale-animacion"), toggleCharacter("daale-ninja-rojo")]);
    assert.deepEqual(s.answers.characterIds, []);
  });

  test("toggleCharacter agrega y quita, y no acepta personajes de otra marca", () => {
    let s = run(base(), [
      toggleService("daale-personajes"),
      toggleCharacter("daale-ninja-rojo"),
      toggleCharacter("nm-chocolatero"),
    ]);
    assert.deepEqual(s.answers.characterIds, ["daale-ninja-rojo"]);
    s = reducer(s, toggleCharacter("daale-ninja-rojo"));
    assert.deepEqual(s.answers.characterIds, []);
  });

  test("un servicio no permitido se ignora: otra marca, inexistente o para mayores", () => {
    const s = run(base(), [
      toggleService("nm-recepcion"),
      toggleService("no-existe"),
      toggleService("nm-adultos-show"),
    ]);
    assert.deepEqual(s.answers.serviceIds, []);

    const quince = run(start("noche-magik"), [setEventType("nm-15"), toggleService("nm-adultos-show")]);
    assert.deepEqual(quince.answers.serviceIds, []);
  });

  test("elegir como servicio algo que estaba como extra lo saca de los extras", () => {
    let s = run(base(), [toggleExtra("daale-fotos"), toggleExtra("daale-globoflexia")]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-fotos", "daale-globoflexia"]);
    s = reducer(s, toggleService("daale-fotos"));
    assert.deepEqual(s.answers.serviceIds, ["daale-fotos"]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-globoflexia"]);
  });

  test("toggleExtra agrega y quita; un extra que ya es servicio se ignora", () => {
    let s = run(base(), [toggleService("daale-personajes"), toggleExtra("daale-maquillaje")]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-maquillaje"]);
    s = reducer(s, toggleExtra("daale-personajes"));
    assert.deepEqual(s.answers.extraServiceIds, ["daale-maquillaje"]);
    s = reducer(s, toggleExtra("daale-maquillaje"));
    assert.deepEqual(s.answers.extraServiceIds, []);
  });

  test("elegir una sugerencia como extra no hace desaparecer el paso de sugerencias", () => {
    // Un casamiento de 150 invitados solo recibe una sugerencia: animación.
    let s = run(start("noche-magik"), [
      setEventType("nm-casamiento"),
      patch({ approximateAttendees: "150" }),
      goTo("sugerencias"),
    ]);
    const recs = recommendationsFor("noche-magik", s.answers, s.mode).map((r) => r.service.id);
    assert.deepEqual(recs, ["nm-animacion"]);

    s = reducer(s, toggleExtra("nm-animacion"));
    assert.equal(s.view, "sugerencias", "sigue en el paso: puede arrepentirse");
    assert.deepEqual(s.answers.extraServiceIds, ["nm-animacion"]);
    assert.ok(
      recommendationsFor("noche-magik", s.answers, s.mode).some((r) => r.service.id === "nm-animacion"),
      "la sugerencia elegida sigue visible para poder quitarla"
    );
  });

  test("patch con ids manipulados se limpia", () => {
    const s = run(start("noche-magik"), [
      setEventType("nm-15"),
      patch({
        eventTypeId: "nm-adultos-show",
        serviceIds: ["nm-adultos-show", "daale-personajes", "nm-recepcion", "nm-recepcion"],
        extraServiceIds: ["nm-recepcion", "nm-adultos-show", "nm-zancudos", "nm-zancudos"],
        characterIds: ["nm-chocolatero"],
        budgetBandId: "daale-mas-400",
      }),
    ]);
    assert.equal(s.answers.eventTypeId, null, "un tipo para mayores no entra por patch");
    assert.deepEqual(s.answers.serviceIds, ["nm-recepcion"]);
    assert.deepEqual(s.answers.extraServiceIds, ["nm-zancudos"]);
    assert.deepEqual(s.answers.characterIds, []);
    assert.equal(s.answers.budgetBandId, null);
  });
});

// ---------------------------------------------------------------------------
// Reducer: separación de públicos en cualquier secuencia de acciones
// ---------------------------------------------------------------------------

describe("reducer: ninguna secuencia de acciones deja algo incompatible con el público", () => {
  for (const brand of BRANDS) {
    for (const mode of MODES) {
      for (const enabled of [true, false]) {
        const label = `${brand}, modo ${mode}, flag ${enabled ? "encendido" : "apagado"}`;
        test(label, () => {
          withAdultCategory(enabled, () => {
            const flags: AudienceFlags = { enableAdultCategory: enabled };
            for (const first of [...eventTypes.map((e) => e.id), "no-existe"]) {
              const actions: ConfiguratorAction[] = [
                setEventType(first),
                ...ALL_SERVICE_IDS.map(toggleService),
                ...ALL_CHARACTER_IDS.map(toggleCharacter),
                ...ALL_SERVICE_IDS.map(toggleExtra),
                patch({
                  serviceIds: [...ALL_SERVICE_IDS, ...ALL_SERVICE_IDS],
                  extraServiceIds: [...ALL_SERVICE_IDS].reverse(),
                  characterIds: ALL_CHARACTER_IDS,
                  childrenCount: "30",
                  adultsCount: "20",
                  ageRange: "13-17",
                  companyName: "Empresa",
                  businessGoal: "Objetivo",
                  approximateAttendees: "500",
                  budgetBandId: budgetBands.find((b) => b.brand !== brand)?.id ?? null,
                }),
                goTo("datos"),
                ...eventTypes.map((e) => setEventType(e.id)),
                ...ALL_SERVICE_IDS.map(toggleService),
              ];
              let s = start(brand, mode);
              actions.forEach((action, i) => {
                s = reducer(s, action);
                assertStateIsSafe(s, flags, `${label}, desde ${first}, acción ${i} (${action.type})`);
              });
            }
          });
        });
      }
    }
  }

  test("Daale nunca termina con nada para mayores, en ningún modo ni flag", () => {
    for (const mode of MODES) {
      for (const enabled of [true, false]) {
        withAdultCategory(enabled, () => {
          for (const et of eventTypes) {
            const s = run(start("daale", mode), [
              setEventType(et.id),
              ...ALL_SERVICE_IDS.map(toggleService),
              ...ALL_SERVICE_IDS.map(toggleExtra),
            ]);
            const all = [...s.answers.serviceIds, ...s.answers.extraServiceIds];
            for (const id of all) {
              assert.equal(services.find((x) => x.id === id)?.brand, "daale", id);
              assert.notEqual(services.find((x) => x.id === id)?.audience, "adults-only", id);
            }
          }
        });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Reducer: respuestas recuperadas del almacenamiento
// ---------------------------------------------------------------------------

describe("reducer: hydrate", () => {
  test("respuestas manipuladas en localStorage se limpian al recuperarlas", () => {
    const stored: ConfiguratorState = {
      ...start("noche-magik"),
      startedAt: NOW,
      view: "servicios",
      answers: {
        ...emptyAnswers(),
        eventTypeId: "nm-15",
        serviceIds: ["nm-adultos-show", "nm-recepcion", "nm-recepcion", "daale-personajes"],
        extraServiceIds: ["nm-zancudos", "nm-zancudos", "nm-adultos-show", "nm-recepcion"],
        characterIds: ["nm-chocolatero", "daale-ninja-rojo"],
        budgetBandId: "daale-mas-400",
        childrenCount: "30",
        companyName: "No corresponde",
        clientName: "Sofía",
      },
    };
    for (const enabled of [true, false]) {
      withAdultCategory(enabled, () => {
        const s = reducer(start("noche-magik"), { type: "hydrate", state: stored });
        const where = `flag ${enabled}`;
        assert.equal(s.answers.eventTypeId, "nm-15", where);
        assert.deepEqual(s.answers.serviceIds, ["nm-recepcion"], where);
        assert.deepEqual(s.answers.extraServiceIds, ["nm-zancudos"], where);
        assert.deepEqual(s.answers.characterIds, [], `${where}: sin «Personajes de películas» no hay personajes`);
        assert.equal(s.answers.budgetBandId, null, where);
        assert.equal(s.answers.childrenCount, "", where);
        assert.equal(s.answers.companyName, "", where);
        assert.equal(s.answers.clientName, "Sofía", `${where}: lo que no depende del público se conserva`);
        assert.equal(s.startedAt, NOW, where);
        assert.equal(s.view, "servicios", where);
      });
    }
  });

  test("no deja cambiar de marca ni de modo desde lo guardado", () => {
    withAdultCategory(true, () => {
      const stored: ConfiguratorState = {
        ...start("noche-magik", "adults-only"),
        answers: {
          ...emptyAnswers(),
          eventTypeId: "nm-adultos-despedida",
          serviceIds: ["nm-adultos-show"],
        },
      };
      const general = reducer(start("noche-magik"), { type: "hydrate", state: stored });
      assert.equal(general.mode, "general");
      assert.equal(general.answers.eventTypeId, null, "el tipo para mayores no entra al recorrido general");
      assert.deepEqual(general.answers.serviceIds, []);

      const daale = reducer(start("daale"), { type: "hydrate", state: stored });
      assert.equal(daale.brand, "daale");
      assert.equal(daale.mode, "general");
      assert.equal(daale.answers.eventTypeId, null);
      assert.deepEqual(daale.answers.serviceIds, []);
    });
  });

  test("una vista guardada que ya no aplica vuelve a un paso vigente", () => {
    const stale: ConfiguratorState = {
      ...start("noche-magik"),
      view: "sugerencias",
      answers: { ...emptyAnswers(), eventTypeId: "nm-casamiento" },
    };
    assert.equal(reducer(start("noche-magik"), { type: "hydrate", state: stale }).view, "datos");

    const unknown = { ...stale, view: "pantalla-que-no-existe" } as unknown as ConfiguratorState;
    const s = reducer(start("noche-magik"), { type: "hydrate", state: unknown });
    assert.ok((stepsFor(s) as ConfiguratorView[]).includes(s.view), `quedó en ${s.view}`);
  });

  test(
    "respuestas guardadas con campos faltantes o de otro tipo no rompen el configurador",
    () => {
      const broken = [
        { eventTypeId: "daale-cumple-infantil", serviceIds: ["daale-personajes"] },
        { ...emptyAnswers(), serviceIds: "daale-personajes" },
        { ...emptyAnswers(), extraServiceIds: null },
        null,
      ];
      for (const answers of broken) {
        const stored = { ...start("daale"), answers } as unknown as ConfiguratorState;
        const s = reducer(start("daale"), { type: "hydrate", state: stored });
        assert.ok(Array.isArray(s.answers.serviceIds));
        assert.ok(Array.isArray(s.answers.extraServiceIds));
        assert.ok(Array.isArray(s.answers.characterIds));
        assert.equal(typeof s.answers.clientName, "string");
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Reducer: goTo, patch, reset e inmutabilidad
// ---------------------------------------------------------------------------

describe("reducer: goTo, patch y reset", () => {
  test("goTo cambia la vista y la hora de actualización", () => {
    const s = reducer(start("daale"), { type: "goTo", view: "datos", now: LATER });
    assert.equal(s.view, "datos");
    assert.equal(s.updatedAt, LATER);
  });

  test("patch cambia solo lo pedido", () => {
    const before = run(start("daale"), [setEventType("daale-cumple-infantil"), toggleService("daale-animacion")]);
    const s = reducer(before, { type: "patch", patch: { location: "Rawson", clientName: "Ana" }, now: LATER });
    assert.equal(s.answers.location, "Rawson");
    assert.equal(s.answers.clientName, "Ana");
    assert.deepEqual(s.answers.serviceIds, ["daale-animacion"]);
    assert.equal(s.answers.eventTypeId, "daale-cumple-infantil");
    assert.equal(s.updatedAt, LATER);
  });

  test("reset vuelve a cero y conserva marca y modo", () => {
    for (const brand of BRANDS) {
      for (const mode of MODES) {
        const busy: ConfiguratorState = {
          ...start(brand, mode),
          view: "confirmar",
          startedAt: NOW,
          answers: {
            ...emptyAnswers(),
            eventTypeId: brand === "daale" ? "daale-cumple-infantil" : "nm-15",
            serviceIds: [brand === "daale" ? "daale-animacion" : "nm-recepcion"],
            clientName: "Ana",
            notes: "Algo",
          },
        };
        const s = reducer(busy, { type: "reset", now: LATER });
        assert.deepEqual(s, initialState(brand, mode, LATER), `${brand}, ${mode}`);
      }
    }
  });

  test("ninguna acción modifica el estado que recibe", () => {
    const state = run(start("daale"), [
      setEventType("daale-cumple-infantil"),
      toggleService("daale-personajes"),
      toggleCharacter("daale-ninja-rojo"),
      toggleExtra("daale-fotos"),
    ]);
    const snapshot = structuredClone(state);
    const actions: ConfiguratorAction[] = [
      setEventType("daale-shopping"),
      toggleService("daale-personajes"),
      toggleCharacter("daale-ninja-rojo"),
      toggleExtra("daale-fotos"),
      patch({ serviceIds: [] }),
      goTo("resumen"),
      { type: "reset", now: LATER },
      { type: "hydrate", state: start("daale") },
    ];
    for (const action of actions) {
      reducer(state, action);
      assert.deepEqual(state, snapshot, action.type);
    }
  });
});

// ---------------------------------------------------------------------------
// Textos derivados
// ---------------------------------------------------------------------------

describe("serviceNames y eventLabel", () => {
  test("serviceNames devuelve nombres en el orden del catálogo e ignora ids desconocidos", () => {
    const names = serviceNames(["daale-fotos", "no-existe", "daale-personajes", "daale-maquillaje"]);
    const byPriority = ["daale-personajes", "daale-maquillaje", "daale-fotos"]
      .map((id) => services.find((s) => s.id === id)!)
      .sort((a, b) => a.commercialPriority - b.commercialPriority)
      .map((s) => s.name);
    assert.deepEqual(names, byPriority);
    assert.deepEqual(serviceNames([]), []);
  });

  test("eventLabel: nombre del tipo, texto propio en «Otro», null sin tipo", () => {
    assert.equal(eventLabel(emptyAnswers()), null);
    assert.equal(eventLabel({ ...emptyAnswers(), eventTypeId: "no-existe" }), null);
    for (const et of eventTypes) {
      const custom = { ...emptyAnswers(), eventTypeId: et.id, customEventLabel: "  Kermés  " };
      assert.equal(eventLabel(custom), et.isOther ? "Kermés" : et.label, et.id);
      const blank = { ...emptyAnswers(), eventTypeId: et.id, customEventLabel: "   " };
      assert.equal(eventLabel(blank), et.label, et.id);
    }
  });

  test("todos los tipos de evento usados en estos tests existen", () => {
    for (const id of [
      "daale-cumple-infantil",
      "daale-cumple-adultos",
      "daale-shopping",
      "daale-otro-particular",
      "daale-otro-empresa",
      "daale-familiar",
      "nm-15",
      "nm-casamiento",
      "nm-show",
      "nm-fiesta",
      "nm-adultos-despedida",
    ]) {
      eventById(id);
    }
  });
});

// ---------------------------------------------------------------------------
// Una sugerencia sumada siempre se puede revisar y sacar
// ---------------------------------------------------------------------------

describe("sugerencias sumadas que dejan de aplicar", () => {
  test("el paso sigue mientras haya algo sumado, y al sacarlo desaparece", () => {
    let s = run(start("daale"), [
      setEventType("daale-cumple-adultos"),
      toggleService("daale-personajes"),
      toggleExtra("daale-fotos"),
    ]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-fotos"]);
    // Cambia lo elegido: la sugerencia del rincón de fotos ya no aplica.
    s = run(s, [toggleService("daale-personajes"), toggleService("daale-animacion")]);
    assert.deepEqual(s.answers.extraServiceIds, ["daale-fotos"]);
    assert.ok(stepsFor(s).includes("sugerencias"), "sin el paso no habría dónde sacarla");

    s = run(s, [toggleExtra("daale-fotos")]);
    assert.deepEqual(s.answers.extraServiceIds, []);
    assert.ok(!stepsFor(s).includes("sugerencias"));
  });

  test("destildar la última estando en «Sugerencias» no saca a la persona del paso", () => {
    let s = run(start("daale"), [
      setEventType("daale-cumple-adultos"),
      toggleService("daale-personajes"),
      toggleExtra("daale-fotos"),
      toggleService("daale-personajes"),
      toggleService("daale-animacion"),
      goTo("sugerencias"),
    ]);
    s = run(s, [toggleExtra("daale-fotos")]);
    assert.equal(s.view, "sugerencias", "un cambio en un control no cambia de pantalla");
    assert.ok(stepsFor(s).includes("sugerencias"));
    assert.equal(nextView(s), "confirmar");

    // Al irse, el paso deja de existir: Volver desde el final salta a «Fecha y lugar».
    s = run(s, [goTo("confirmar")]);
    assert.ok(!stepsFor(s).includes("sugerencias"));
    assert.equal(previousView(s), "datos");
  });

  test("al recuperar respuestas, «Sugerencias» vacía no se sostiene", () => {
    const stored: ConfiguratorState = {
      ...start("daale"),
      view: "sugerencias",
      answers: { ...emptyAnswers(), eventTypeId: "daale-cumple-adultos", serviceIds: ["daale-animacion"] },
    };
    const s = reducer(start("daale"), { type: "hydrate", state: stored });
    assert.notEqual(s.view, "sugerencias");
  });
});
