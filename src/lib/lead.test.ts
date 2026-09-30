/**
 * Objeto Lead: la consulta armada en la web, lista para un CRM futuro.
 *
 * Reglas del brief: status siempre "new_lead" (abrir WhatsApp no confirma que
 * se envió nada), cantidades de chicos y adultos y rango de edad solo cuando
 * el evento lo pide y sin datos identificables de menores, empresa solo en
 * B2B, y los UTM tal cual llegaron.
 *
 * Ejecutar: npx tsx --test src/lib/lead.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventTypes } from "@/lib/test-support/catalogo-completo";

import { budgetBands } from "@/config/budgets";
import {
  emptyAnswers,
  initialState,
  reducer,
  type ConfiguratorAction,
} from "@/lib/configurator/state";
import { buildLead, noopLeadSink } from "@/lib/lead";
import type {
  BrandId,
  ConfiguratorAnswers,
  ConfiguratorState,
  DateStatus,
  Lead,
  UtmParams,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

const NOW = "2026-09-24T12:00:00.000Z";

const NO_UTM: UtmParams = { utm_source: null, utm_medium: null, utm_campaign: null };
const CAMPAIGN: UtmParams = {
  utm_source: "instagram",
  utm_medium: "historia-paga",
  utm_campaign: "dia-de-la-familia",
};

const DATE_STATUSES: DateStatus[] = ["exacta", "tentativa", "sin-definir"];

/** Claves que puede tener un Lead: ni una más. */
const REQUIRED_KEYS = [
  "lead_id",
  "created_at",
  "brand",
  "source",
  "client_type",
  "event_type",
  "client_name",
  "event_date",
  "date_is_tentative",
  "event_time",
  "location",
  "approximate_attendees",
  "selected_services",
  "selected_characters",
  "selected_extras",
  "duration",
  "budget_range",
  "notes",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "status",
] as const;
const OPTIONAL_KEYS = ["company_name", "children_count", "adults_count", "age_range"] as const;
const AGE_MIX_KEYS = ["children_count", "adults_count", "age_range"] as const;

function stateWith(brand: BrandId, answers: ConfiguratorAnswers): ConfiguratorState {
  return { ...initialState(brand, "general", NOW), answers };
}

function lead(answers: Partial<ConfiguratorAnswers>, utm: UtmParams = NO_UTM): Lead {
  const full = { ...emptyAnswers(), ...answers };
  const et = eventTypes.find((e) => e.id === full.eventTypeId);
  return buildLead(stateWith(et?.brand ?? "daale", full), utm, NOW);
}

/** Respuestas con todo cargado, incluso lo que el tipo de evento no pide. */
function everything(eventTypeId: string): Partial<ConfiguratorAnswers> {
  return {
    eventTypeId,
    customEventLabel: "Fiesta sorpresa",
    serviceIds: ["daale-personajes"],
    characterIds: ["daale-heroe-aracnido"],
    ideaNotes: "Algo con superhéroes",
    dateStatus: "exacta",
    eventDate: "2026-10-12",
    timeSlot: "tarde",
    duration: "2h",
    location: "Rivadavia",
    approximateAttendees: "40",
    childrenCount: "25",
    adultsCount: "15",
    ageRange: "4-7",
    companyName: "Shopping del Sol",
    businessGoal: "Atraer familias",
    extraServiceIds: ["daale-fotos"],
    budgetBandId: "daale-100-200",
    clientName: "Laura",
    notes: "Hay patio",
  };
}

const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildLead: estado y trazabilidad", () => {
  test("el estado es siempre «new_lead», con cualquier tipo de evento, fecha y campaña", () => {
    for (const et of [null, ...eventTypes]) {
      for (const dateStatus of DATE_STATUSES) {
        for (const utm of [NO_UTM, CAMPAIGN]) {
          const l = lead({ ...everything(et?.id ?? ""), eventTypeId: et?.id ?? null, dateStatus }, utm);
          assert.equal(l.status, "new_lead", `${et?.id ?? "sin tipo"}, ${dateStatus}`);
        }
      }
    }
  });

  test("cada Lead tiene un id propio", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const id = lead({ eventTypeId: "daale-cumple-infantil" }).lead_id;
      assert.equal(typeof id, "string");
      assert.ok(id.length >= 8, `id demasiado corto: ${id}`);
      ids.add(id);
    }
    assert.equal(ids.size, 200, "se repitió un lead_id");
  });

  test("created_at y brand salen de lo que se recibe", () => {
    for (const brand of ["daale", "noche-magik"] as const) {
      const l = buildLead(stateWith(brand, emptyAnswers()), NO_UTM, "2026-10-01T15:30:00.000Z");
      assert.equal(l.created_at, "2026-10-01T15:30:00.000Z");
      assert.equal(l.brand, brand);
    }
  });

  test("abrir WhatsApp no guarda el Lead: el adaptador de hoy no guarda nada", async () => {
    const result = await noopLeadSink.submit(lead(everything("daale-cumple-infantil")));
    assert.deepEqual(result, { stored: false });
  });
});

describe("buildLead: UTM y origen", () => {
  test("los UTM pasan tal cual", () => {
    const l = lead(everything("daale-shopping"), CAMPAIGN);
    assert.equal(l.utm_source, "instagram");
    assert.equal(l.utm_medium, "historia-paga");
    assert.equal(l.utm_campaign, "dia-de-la-familia");
  });

  test("los UTM que faltan quedan en null, sin inventar valores", () => {
    const partial: UtmParams = { utm_source: null, utm_medium: null, utm_campaign: "qr-folleto" };
    const l = lead(everything("daale-shopping"), partial);
    assert.equal(l.utm_source, null);
    assert.equal(l.utm_medium, null);
    assert.equal(l.utm_campaign, "qr-folleto");
  });

  test("source es utm_source o «web» si la visita no trae campaña", () => {
    assert.equal(lead(everything("daale-shopping"), CAMPAIGN).source, "instagram");
    assert.equal(lead(everything("daale-shopping"), NO_UTM).source, "web");
    assert.equal(
      lead(everything("daale-shopping"), { ...NO_UTM, utm_medium: "cpc", utm_campaign: "x" }).source,
      "web"
    );
  });

  test("no modifica el objeto de UTM que recibe", () => {
    const utm = { ...CAMPAIGN };
    lead(everything("daale-shopping"), utm);
    assert.deepEqual(utm, CAMPAIGN);
  });
});

describe("buildLead: fecha", () => {
  test("date_is_tentative y event_date según el estado de la fecha", () => {
    const cases: [DateStatus, string, string | null, boolean][] = [
      ["exacta", "2026-10-12", "2026-10-12", false],
      ["tentativa", "2026-10-12", "2026-10-12", true],
      ["sin-definir", "", null, true],
      // Si eligió «Todavía no la definí» después de cargar una fecha, no se manda.
      ["sin-definir", "2026-10-12", null, true],
    ];
    for (const [dateStatus, eventDate, expectedDate, tentative] of cases) {
      const l = lead({ eventTypeId: "daale-cumple-infantil", dateStatus, eventDate });
      const where = `${dateStatus} con «${eventDate}»`;
      assert.equal(l.event_date, expectedDate, where);
      assert.equal(l.date_is_tentative, tentative, where);
    }
  });

  test("nunca hay fecha con «sin-definir» ni fecha vacía como texto", () => {
    for (const dateStatus of DATE_STATUSES) {
      const l = lead({ eventTypeId: "daale-cumple-infantil", dateStatus, eventDate: "" });
      assert.equal(l.event_date, null, dateStatus);
    }
  });
});

describe("buildLead: composición de edades", () => {
  const withoutAgeMix = eventTypes.filter((e) => !e.asksAgeMix);
  const withAgeMix = eventTypes.filter((e) => e.asksAgeMix);

  test("hay eventos que piden y que no piden mezcla de edades", () => {
    assert.ok(withoutAgeMix.length > 0);
    assert.ok(withAgeMix.length > 0);
  });

  test("sin children_count, adults_count ni age_range si el evento no pide mezcla de edades", () => {
    for (const et of withoutAgeMix) {
      const l = lead(everything(et.id));
      for (const key of AGE_MIX_KEYS) {
        assert.ok(!has(l, key), `${et.id}: no tiene que existir la clave ${key}`);
      }
    }
  });

  test("sin tipo de evento tampoco hay datos de edades", () => {
    const l = lead({ ...everything("x"), eventTypeId: null });
    for (const key of AGE_MIX_KEYS) assert.ok(!has(l, key), key);
  });

  test("si el evento los pide, van como números y solo lo informado", () => {
    for (const et of withAgeMix) {
      const l = lead(everything(et.id));
      assert.equal(l.children_count, 25, et.id);
      assert.equal(l.adults_count, 15, et.id);
      assert.equal(l.age_range, "4-7", et.id);

      const empty = lead({ ...everything(et.id), childrenCount: "", adultsCount: " ", ageRange: null });
      for (const key of AGE_MIX_KEYS) {
        assert.ok(!has(empty, key), `${et.id}: ${key} vacío no tiene que existir`);
      }

      const zero = lead({ ...everything(et.id), childrenCount: "0", adultsCount: "0" });
      assert.ok(!has(zero, "children_count"), `${et.id}: 0 chicos no es un dato`);
      assert.ok(!has(zero, "adults_count"), `${et.id}: 0 adultos no es un dato`);
    }
  });

  test("no hay ningún campo con datos personales de menores", () => {
    const l = lead(everything("daale-cumple-infantil"));
    const allowed = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);
    for (const key of Object.keys(l)) {
      assert.ok(allowed.has(key), `clave inesperada en el Lead: ${key}`);
    }
    assert.doesNotMatch(Object.keys(l).join(" "), /birth|nacimiento|dni|documento|child_name|nombre_/i);
  });
});

describe("buildLead: empresa", () => {
  test("company_name solo en eventos B2B, sin espacios sobrantes", () => {
    for (const et of eventTypes) {
      const l = lead({ ...everything(et.id), companyName: "  Shopping del Sol  " });
      if (et.isBusiness) {
        assert.equal(l.company_name, "Shopping del Sol", et.id);
      } else {
        assert.ok(!has(l, "company_name"), `${et.id}: un evento particular no lleva empresa`);
      }
    }
  });

  test("un B2B sin empresa escrita no lleva la clave", () => {
    for (const et of eventTypes.filter((e) => e.isBusiness)) {
      assert.ok(!has(lead({ ...everything(et.id), companyName: "   " }), "company_name"), et.id);
    }
  });

  test("client_type sale del tipo de evento", () => {
    for (const et of eventTypes.filter((e) => e.audience !== "adults-only")) {
      assert.equal(lead({ eventTypeId: et.id }).client_type, et.clientType, et.id);
    }
    assert.equal(lead({ eventTypeId: null }).client_type, null);
  });

  test("un tipo solo para mayores no llega al Lead desde el recorrido general", () => {
    const adultsOnly = eventTypes.filter((e) => e.audience === "adults-only");
    assert.ok(adultsOnly.length > 0, "el catálogo tiene tipos adults-only para probar");
    for (const et of adultsOnly) {
      const l = lead({ eventTypeId: et.id, customEventLabel: "x" });
      assert.equal(l.event_type, null, et.id);
      assert.equal(l.client_type, null, et.id);
    }
  });
});

describe("buildLead: datos del evento", () => {
  test("event_type es el nombre legible, o el texto escrito en «Otro»", () => {
    for (const et of eventTypes.filter((e) => e.audience !== "adults-only")) {
      const l = lead({ eventTypeId: et.id, customEventLabel: "Fiesta de egresados" });
      assert.equal(l.event_type, et.isOther ? "Fiesta de egresados" : et.label, et.id);
    }
    const otherEmpty = eventTypes.find((e) => e.isOther);
    assert.ok(otherEmpty);
    assert.equal(lead({ eventTypeId: otherEmpty.id, customEventLabel: "  " }).event_type, otherEmpty.label);
    assert.equal(lead({ eventTypeId: null }).event_type, null);
  });

  test("nombre, zona y asistentes se limpian; vacío es null", () => {
    const l = lead({
      eventTypeId: "daale-cumple-infantil",
      clientName: "  Laura  ",
      location: "  Rawson ",
      approximateAttendees: " 120 ",
    });
    assert.equal(l.client_name, "Laura");
    assert.equal(l.location, "Rawson");
    assert.equal(l.approximate_attendees, 120);

    const empty = lead({ eventTypeId: "daale-cumple-infantil", location: "   ", approximateAttendees: "" });
    assert.equal(empty.location, null);
    assert.equal(empty.approximate_attendees, null);
    assert.equal(lead({ approximateAttendees: "0" }).approximate_attendees, null);
    assert.equal(
      lead({ eventTypeId: "daale-shopping", approximateAttendees: "1.500" }).approximate_attendees,
      1500,
      "con punto de miles"
    );
  });

  test("horario y duración pasan tal cual, o null", () => {
    const l = lead({ eventTypeId: "nm-15", timeSlot: "noche", duration: "mas-3h" });
    assert.equal(l.event_time, "noche");
    assert.equal(l.duration, "mas-3h");
    const empty = lead({ eventTypeId: "nm-15" });
    assert.equal(empty.event_time, null);
    assert.equal(empty.duration, null);
  });

  test("presupuesto: el texto de la banda o null", () => {
    for (const band of budgetBands) {
      const eventTypeId = eventTypes.find((e) => e.brand === band.brand)?.id ?? null;
      assert.equal(lead({ eventTypeId, budgetBandId: band.id }).budget_range, band.label, band.id);
    }
    assert.equal(lead({ eventTypeId: "nm-15" }).budget_range, null);
  });

  test("la idea y las notas se juntan; si no hay ninguna, null", () => {
    assert.equal(
      lead({ ideaNotes: " Algo con luces ", notes: " Llamar a la tarde " }).notes,
      "Algo con luces\n\nLlamar a la tarde"
    );
    assert.equal(lead({ ideaNotes: "Solo la idea" }).notes, "Solo la idea");
    assert.equal(lead({ notes: "Solo notas" }).notes, "Solo notas");
    assert.equal(lead({ ideaNotes: "  ", notes: "\n" }).notes, null);
  });

  test("los servicios, personajes y extras son copias: tocar el Lead no toca las respuestas", () => {
    const answers = { ...emptyAnswers(), ...everything("daale-cumple-infantil") };
    const l = buildLead(stateWith("daale", answers), NO_UTM, NOW);
    assert.deepEqual(l.selected_services, ["daale-personajes"]);
    assert.deepEqual(l.selected_characters, ["daale-heroe-aracnido"]);
    assert.deepEqual(l.selected_extras, ["daale-fotos"]);
    l.selected_services.push("x");
    l.selected_characters.push("x");
    l.selected_extras.push("x");
    assert.deepEqual(answers.serviceIds, ["daale-personajes"]);
    assert.deepEqual(answers.characterIds, ["daale-heroe-aracnido"]);
    assert.deepEqual(answers.extraServiceIds, ["daale-fotos"]);
  });
});

describe("buildLead: forma del objeto", () => {
  test("tiene todas las claves obligatorias y ninguna desconocida", () => {
    const allowed = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);
    for (const et of [null, ...eventTypes]) {
      for (const answers of [{ eventTypeId: et?.id ?? null }, { ...everything(et?.id ?? ""), eventTypeId: et?.id ?? null }]) {
        const l = lead(answers, CAMPAIGN);
        for (const key of REQUIRED_KEYS) assert.ok(has(l, key), `${et?.id}: falta ${key}`);
        for (const key of Object.keys(l)) assert.ok(allowed.has(key), `${et?.id}: sobra ${key}`);
      }
    }
  });

  test("se puede pasar a JSON sin perder nada: sin undefined, NaN ni funciones", () => {
    for (const et of [null, ...eventTypes]) {
      const l = lead({ ...everything(et?.id ?? ""), eventTypeId: et?.id ?? null }, CAMPAIGN);
      assert.deepEqual(JSON.parse(JSON.stringify(l)), l, `${et?.id}`);
      for (const [key, value] of Object.entries(l)) {
        assert.notEqual(value, undefined, `${et?.id}: ${key} es undefined`);
        if (typeof value === "number") assert.ok(Number.isFinite(value), `${et?.id}: ${key} es ${value}`);
      }
    }
  });
});

describe("buildLead: separación de públicos", () => {
  test("flujo real: un evento de 15 armado con el reducer nunca lleva el show para mayores", () => {
    const actions: ConfiguratorAction[] = [
      { type: "setEventType", id: "nm-15", now: NOW },
      { type: "toggleService", id: "nm-adultos-show", now: NOW },
      { type: "toggleService", id: "nm-recepcion", now: NOW },
      { type: "toggleExtra", id: "nm-adultos-show", now: NOW },
      { type: "patch", patch: { extraServiceIds: ["nm-adultos-show", "nm-zancudos"] }, now: NOW },
    ];
    const state = actions.reduce(reducer, initialState("noche-magik", "general", NOW));
    const l = buildLead(state, CAMPAIGN, NOW);
    assert.equal(l.event_type, "Celebración de 15");
    assert.deepEqual(l.selected_services, ["nm-recepcion"]);
    assert.deepEqual(l.selected_extras, ["nm-zancudos"]);
  });

  test(
    "defensa en profundidad: sin pasar por el reducer, un evento de 15 tampoco lleva el show para mayores",
    () => {
      const l = lead({
        eventTypeId: "nm-15",
        serviceIds: ["nm-adultos-show", "nm-recepcion"],
        extraServiceIds: ["nm-adultos-show"],
      });
      assert.ok(!l.selected_services.includes("nm-adultos-show"));
      assert.ok(!l.selected_extras.includes("nm-adultos-show"));
    }
  );
});

describe("buildLead: acciones de empresa", () => {
  test("el objetivo viaja en notes, con su rótulo y antes de la idea y las notas", () => {
    const l = lead({
      eventTypeId: "daale-shopping",
      businessGoal: "  Atraer familias el fin de semana  ",
      ideaNotes: "Algo con superhéroes",
      notes: "Hay escenario",
    });
    assert.equal(
      l.notes,
      ["Objetivo: Atraer familias el fin de semana", "Algo con superhéroes", "Hay escenario"].join("\n\n")
    );
  });

  test("en un evento particular no aparece ningún objetivo", () => {
    const l = lead({ eventTypeId: "daale-cumple-infantil", businessGoal: "no debería viajar", notes: "Hay patio" });
    assert.equal(l.notes, "Hay patio");
  });
});
