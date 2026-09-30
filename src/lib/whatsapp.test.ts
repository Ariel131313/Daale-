/**
 * Mensaje de WhatsApp y enlace wa.me.
 *
 * El brief pide que el mensaje lleve solo los datos efectivamente informados
 * («sin campos vacíos»), que diferencie la marca y que el enlace use wa.me con
 * el encoding correcto. Los UTM viajan en el Lead, nunca en el mensaje.
 *
 * Ejecutar: npx tsx --test src/lib/whatsapp.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventTypes, services } from "@/lib/test-support/catalogo-completo";

import { brands, getBrand } from "@/config/brands";
import { budgetBands } from "@/config/budgets";
import {
  emptyAnswers,
  initialState,
  reducer,
  type ConfiguratorAction,
} from "@/lib/configurator/state";
import { buildLead } from "@/lib/lead";
import type { BrandId, ConfiguratorAnswers, ConfiguratorState } from "@/lib/types";
import {
  AGE_RANGE_LABELS,
  DURATION_LABELS,
  TIME_SLOT_LABELS,
  buildConfiguratorMessage,
  buildDirectMessage,
  dateText,
  formatDate,
  whatsappUrl,
} from "@/lib/whatsapp";

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

const BRANDS: BrandId[] = ["daale", "noche-magik"];
const NOW = "2026-09-24T12:00:00.000Z";

/** Formato de referencia calculado en UTC: no depende del huso de la máquina. */
const REFERENCE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function referenceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return REFERENCE_FORMAT.format(new Date(Date.UTC(y, m - 1, d)));
}

function serviceName(id: string): string {
  const s = services.find((x) => x.id === id);
  assert.ok(s, `falta el servicio ${id} en el catálogo`);
  return s.name;
}

function budgetLabel(id: string): string {
  const b = budgetBands.find((x) => x.id === id);
  assert.ok(b, `falta la banda ${id}`);
  return b.label;
}

/** Corre una función con otro huso horario y lo restaura siempre. */
function inTimeZone<T>(tz: string, fn: () => T): T {
  const before = process.env.TZ;
  // Borrar TZ no devuelve Node al huso del sistema: hay que volver a nombrarlo.
  const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    process.env.TZ = before ?? systemZone;
    if (before === undefined) delete process.env.TZ;
  }
}

/** Node aplica process.env.TZ en caliente; si este entorno no lo hace, se saltea. */
function timeZoneSwitchWorks(): boolean {
  return inTimeZone(
    "America/Argentina/San_Juan",
    () => new Date(2026, 0, 15).getTimezoneOffset() === 180
  );
}

/** Cambia el número de WhatsApp de una marca solo durante la función. */
function withWhatsappNumber<T>(brand: BrandId, number: string | null, fn: () => T): T {
  const original = brands[brand].whatsapp;
  brands[brand].whatsapp = { number, display: null };
  try {
    return fn();
  } finally {
    brands[brand].whatsapp = original;
  }
}

/** Separa el mensaje en encabezado y campos «*Etiqueta:* valor». */
function parseMessage(message: string) {
  const lines = message.split("\n");
  const fields = new Map<string, string>();
  for (const l of lines.slice(2)) {
    const m = /^\*([^*]+):\* (.+)$/.exec(l);
    if (m) fields.set(m[1], m[2]);
  }
  return { lines, header: lines[0], fields };
}

/**
 * Un mensaje bien armado: encabezado, una sola línea en blanco y después solo
 * campos con valor. Nada de "undefined", "null", "NaN", ids internos ni UTM.
 */
function assertCleanMessage(message: string, brand: BrandId, where: string) {
  const { lines, header } = parseMessage(message);
  assert.equal(header, getBrand(brand).messages.configuratorHeader, `${where}: encabezado`);
  assert.equal(lines[1], "", `${where}: falta la línea en blanco después del encabezado`);
  assert.ok(lines.length > 2, `${where}: el mensaje no tiene campos`);

  for (const l of lines.slice(2)) {
    assert.notEqual(l.trim(), "", `${where}: hay una línea vacía entre los campos`);
    assert.match(l, /^\*[^*]+:\* \S/, `${where}: campo sin valor o mal armado: «${l}»`);
    assert.doesNotMatch(l, /:\*\s*$/, `${where}: campo vacío «${l}»`);
    assert.doesNotMatch(l, /\s$/, `${where}: espacio sobrante al final de «${l}»`);
  }
  assert.doesNotMatch(message, /\b(undefined|null|NaN)\b/, `${where}: se coló un valor vacío`);
  assert.doesNotMatch(message, /\[object Object\]/, where);
  assert.doesNotMatch(message, /utm/i, `${where}: los UTM no van en el mensaje`);
  assert.ok(!message.endsWith("\n"), `${where}: salto de línea sobrante al final`);
}

function fullDaaleAnswers(): ConfiguratorAnswers {
  return {
    ...emptyAnswers(),
    eventTypeId: "daale-cumple-infantil",
    serviceIds: ["daale-maquillaje", "daale-personajes"],
    characterIds: ["daale-heroe-aracnido", "daale-ninja-rojo"],
    ideaNotes: "Temática de superhéroes",
    dateStatus: "exacta",
    eventDate: "2026-10-12",
    timeSlot: "tarde",
    duration: "2h",
    location: "Rivadavia, San Juan",
    approximateAttendees: "40",
    childrenCount: "25",
    adultsCount: "15",
    ageRange: "4-7",
    extraServiceIds: ["daale-fotos"],
    budgetBandId: "daale-100-200",
    clientName: "Laura",
    notes: "El salón tiene patio",
  };
}

function fullNocheMagikBusinessAnswers(): ConfiguratorAnswers {
  return {
    ...emptyAnswers(),
    eventTypeId: "nm-empresa",
    serviceIds: ["nm-recepcion", "nm-hombre-espejo"],
    dateStatus: "tentativa",
    eventDate: "2026-12-11",
    timeSlot: "noche",
    duration: "mas-3h",
    location: "Capital, San Juan",
    approximateAttendees: "150",
    companyName: "Bodega del Valle",
    businessGoal: "Fiesta de fin de año del equipo",
    extraServiceIds: ["nm-animacion"],
    budgetBandId: "nm-conversar",
    clientName: "Martín",
  };
}

function dispatchAll(state: ConfiguratorState, actions: ConfiguratorAction[]) {
  return actions.reduce(reducer, state);
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  test("escribe la fecha completa en español, con el día de la semana", () => {
    const text = formatDate("2026-10-12");
    assert.equal(text, referenceDate("2026-10-12"));
    assert.match(text, /lunes/);
    assert.match(text, /12 de octubre de 2026/);
  });

  test("no corre la fecha por el huso horario", (t) => {
    if (!timeZoneSwitchWorks()) {
      t.skip("este entorno no permite cambiar el huso horario en caliente");
      return;
    }
    const dates = ["2026-10-12", "2026-01-01", "2026-12-31", "2027-03-01", "2028-02-29"];
    const zones = [
      "America/Argentina/San_Juan",
      "UTC",
      "Pacific/Pago_Pago",
      "Pacific/Kiritimati",
      "Asia/Tokyo",
    ];
    // El error típico: new Date("2026-10-12") es medianoche UTC, que en
    // Argentina todavía es el 11. Se verifica que el entorno lo reproduce.
    inTimeZone("America/Argentina/San_Juan", () => {
      assert.equal(new Date("2026-10-12").getDate(), 11, "el entorno no reproduce el corrimiento");
    });
    const zoneBefore = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const tz of zones) {
      inTimeZone(tz, () => {
        for (const iso of dates) {
          assert.equal(formatDate(iso), referenceDate(iso), `${iso} en ${tz}`);
        }
      });
    }
    assert.equal(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      zoneBefore,
      "el test deja el huso horario como estaba"
    );
  });

  test("si el texto no es una fecha lo devuelve sin inventar nada", () => {
    assert.equal(formatDate(""), "");
    assert.equal(formatDate("sin fecha"), "sin fecha");
  });
});

describe("dateText", () => {
  const base = { ...emptyAnswers(), eventDate: "2026-10-12" };

  test("fecha exacta: solo la fecha", () => {
    assert.equal(dateText({ ...base, dateStatus: "exacta" }), referenceDate("2026-10-12"));
  });

  test("fecha tentativa: la fecha con la aclaración", () => {
    assert.equal(
      dateText({ ...base, dateStatus: "tentativa" }),
      `${referenceDate("2026-10-12")} (tentativa)`
    );
  });

  test("«sin-definir» dice «Todavía no la definí» aunque haya quedado una fecha cargada", () => {
    assert.equal(dateText({ ...base, dateStatus: "sin-definir" }), "Todavía no la definí");
  });

  test("sin fecha cargada tampoco inventa una", () => {
    for (const dateStatus of ["exacta", "tentativa"] as const) {
      assert.equal(dateText({ ...base, dateStatus, eventDate: "" }), "Todavía no la definí");
    }
  });
});

// ---------------------------------------------------------------------------
// Mensaje del configurador
// ---------------------------------------------------------------------------

describe("buildConfiguratorMessage", () => {
  test("empieza con el encabezado de la marca y una sola línea en blanco", () => {
    for (const brand of BRANDS) {
      const answers = { ...emptyAnswers(), eventTypeId: eventTypes.find((e) => e.brand === brand)!.id };
      assertCleanMessage(buildConfiguratorMessage(brand, answers), brand, brand);
    }
  });

  test("un evento completo de Daale lleva todos los datos informados", () => {
    const message = buildConfiguratorMessage("daale", fullDaaleAnswers());
    assertCleanMessage(message, "daale", "Daale completo");
    const { fields } = parseMessage(message);

    assert.equal(fields.get("Marca"), "Daale");
    assert.equal(fields.get("Tipo de evento"), "Cumpleaños infantil");
    assert.equal(fields.get("Fecha"), referenceDate("2026-10-12"));
    assert.equal(fields.get("Horario"), TIME_SLOT_LABELS.tarde);
    assert.equal(fields.get("Duración"), DURATION_LABELS["2h"]);
    assert.equal(fields.get("Zona"), "Rivadavia, San Juan");
    assert.equal(fields.get("Invitados"), "40 aprox. (25 chicos y 15 adultos)");
    assert.equal(fields.get("Edad de los chicos"), AGE_RANGE_LABELS["4-7"]);
    // En el orden del catálogo, no en el orden en que se eligieron.
    assert.equal(
      fields.get("Servicios"),
      `${serviceName("daale-personajes")}, ${serviceName("daale-maquillaje")}`
    );
    assert.equal(fields.get("Personajes"), "Héroe arácnido, Ninja rojo");
    assert.equal(fields.get("Sumé también"), serviceName("daale-fotos"));
    assert.equal(fields.get("Mi idea"), "Temática de superhéroes");
    assert.equal(fields.get("Presupuesto"), `${budgetLabel("daale-100-200")} (orientativo)`);
    assert.equal(fields.get("Nombre"), "Laura");
    assert.equal(fields.get("Notas"), "El salón tiene patio");
    assert.ok(!fields.has("Empresa o institución"), "un cumpleaños no es B2B");
  });

  test("un evento de empresa de Noche Magik usa las palabras de B2B", () => {
    const message = buildConfiguratorMessage("noche-magik", fullNocheMagikBusinessAnswers());
    assertCleanMessage(message, "noche-magik", "Noche Magik empresa");
    const { fields } = parseMessage(message);

    assert.equal(fields.get("Marca"), "Noche Magik");
    assert.equal(fields.get("Tipo de evento"), "Evento de empresa");
    assert.equal(fields.get("Empresa o institución"), "Bodega del Valle");
    assert.equal(fields.get("Objetivo"), "Fiesta de fin de año del equipo");
    assert.equal(fields.get("Fecha"), `${referenceDate("2026-12-11")} (tentativa)`);
    assert.equal(fields.get("Horario"), "Noche");
    assert.equal(fields.get("Duración"), "Más de 3 horas");
    assert.equal(fields.get("Público estimado"), "150 aprox.");
    assert.ok(!fields.has("Invitados"), "en B2B se habla de público estimado");
    assert.equal(fields.get("Presupuesto"), "Prefiero conversarlo");
    assert.equal(fields.get("Nombre"), "Martín");
  });

  test("con lo mínimo no aparece ningún campo vacío", () => {
    for (const et of eventTypes.filter((e) => e.audience !== "adults-only")) {
      const answers = { ...emptyAnswers(), eventTypeId: et.id, dateStatus: "sin-definir" as const };
      const message = buildConfiguratorMessage(et.brand, answers);
      assertCleanMessage(message, et.brand, et.id);
      const { fields } = parseMessage(message);
      assert.deepEqual(
        [...fields.keys()],
        ["Marca", "Tipo de evento", "Fecha"],
        `${et.id}: solo marca, tipo y el estado de la fecha`
      );
    }
  });

  test("un tipo solo para mayores no aparece en un mensaje del recorrido general", () => {
    for (const et of eventTypes.filter((e) => e.audience === "adults-only")) {
      const answers = { ...emptyAnswers(), eventTypeId: et.id, dateStatus: "sin-definir" as const };
      const message = buildConfiguratorMessage(et.brand, answers);
      assert.ok(!message.includes(et.label), `${et.id}: se coló «${et.label}»`);
      assert.ok(!parseMessage(message).fields.has("Tipo de evento"), et.id);
    }
  });

  test("los campos con solo espacios no generan líneas («Zona: » sin valor)", () => {
    const answers: ConfiguratorAnswers = {
      ...fullDaaleAnswers(),
      location: "   ",
      clientName: " ",
      notes: "\n\t ",
      ideaNotes: "  ",
      approximateAttendees: " ",
      childrenCount: "",
      adultsCount: "  ",
      customEventLabel: "   ",
    };
    const message = buildConfiguratorMessage("daale", answers);
    assertCleanMessage(message, "daale", "espacios");
    const { fields } = parseMessage(message);
    for (const label of ["Zona", "Nombre", "Notas", "Mi idea", "Invitados"]) {
      assert.ok(!fields.has(label), `no tiene que aparecer «${label}»`);
    }
    assert.doesNotMatch(message, /Zona:\*?\s*(\n|$)/);
  });

  test("recorta los espacios de los textos", () => {
    const message = buildConfiguratorMessage("daale", {
      ...fullDaaleAnswers(),
      location: "  Rawson  ",
      clientName: "  Laura  ",
    });
    const { fields } = parseMessage(message);
    assert.equal(fields.get("Zona"), "Rawson");
    assert.equal(fields.get("Nombre"), "Laura");
  });

  test("fecha «sin-definir» dice «Todavía no la definí»", () => {
    const message = buildConfiguratorMessage("daale", {
      ...fullDaaleAnswers(),
      dateStatus: "sin-definir",
    });
    assert.equal(parseMessage(message).fields.get("Fecha"), "Todavía no la definí");
    assert.doesNotMatch(message, /octubre/, "la fecha que quedó cargada no se manda");
  });

  test("fecha tentativa lleva la aclaración", () => {
    const message = buildConfiguratorMessage("daale", {
      ...fullDaaleAnswers(),
      dateStatus: "tentativa",
    });
    assert.match(parseMessage(message).fields.get("Fecha") ?? "", /\(tentativa\)$/);
  });

  test("sin nombre no hay línea de nombre; con nombre, sí", () => {
    const without = parseMessage(
      buildConfiguratorMessage("daale", { ...fullDaaleAnswers(), clientName: "" })
    );
    assert.ok(!without.fields.has("Nombre"));
    const withName = parseMessage(buildConfiguratorMessage("daale", fullDaaleAnswers()));
    assert.equal(withName.fields.get("Nombre"), "Laura");
  });

  test("sin servicios, personajes ni extras no aparecen esas líneas", () => {
    const message = buildConfiguratorMessage("daale", {
      ...fullDaaleAnswers(),
      serviceIds: [],
      characterIds: [],
      extraServiceIds: [],
    });
    const { fields } = parseMessage(message);
    for (const label of ["Servicios", "Personajes", "Sumé también"]) {
      assert.ok(!fields.has(label), label);
    }
  });

  test("los servicios salen con su nombre, nunca con el id interno", () => {
    for (const answers of [fullDaaleAnswers(), fullNocheMagikBusinessAnswers()]) {
      const brand = answers.eventTypeId?.startsWith("nm-") ? "noche-magik" : "daale";
      const message = buildConfiguratorMessage(brand, answers);
      assert.doesNotMatch(message, /\b(daale|nm)-[a-z-]+/, brand);
    }
  });

  test("en un evento particular no aparecen empresa ni objetivo aunque estén cargados", () => {
    const message = buildConfiguratorMessage("daale", {
      ...fullDaaleAnswers(),
      companyName: "Empresa X",
      businessGoal: "Vender más",
    });
    assert.doesNotMatch(message, /Empresa X|Vender más|Empresa o institución|Objetivo/);
  });

  test("si el evento no pide mezcla de edades no se mencionan chicos, adultos ni edades", () => {
    for (const et of eventTypes.filter((e) => !e.asksAgeMix)) {
      const message = buildConfiguratorMessage(et.brand, {
        ...emptyAnswers(),
        eventTypeId: et.id,
        approximateAttendees: "80",
        childrenCount: "30",
        adultsCount: "50",
        ageRange: "13-17",
      });
      assertCleanMessage(message, et.brand, et.id);
      assert.doesNotMatch(message, /chicos|adultos\)|Edad de los chicos|13 a 17/, et.id);
      assert.match(message, /80 aprox\.$/m, et.id);
    }
  });

  test("con solo chicos o solo adultos arma la línea de invitados sin huecos", () => {
    const only = (patch: Partial<ConfiguratorAnswers>) =>
      parseMessage(
        buildConfiguratorMessage("daale", {
          ...fullDaaleAnswers(),
          approximateAttendees: "",
          childrenCount: "",
          adultsCount: "",
          ...patch,
        })
      ).fields.get("Invitados");
    assert.equal(only({ childrenCount: "25" }), "25 chicos");
    assert.equal(only({ adultsCount: "15" }), "15 adultos");
    assert.equal(only({ childrenCount: "25", adultsCount: "15" }), "25 chicos y 15 adultos");
    assert.equal(only({ approximateAttendees: "40", childrenCount: "25" }), "40 aprox. (25 chicos)");
    assert.equal(only({}), undefined);
  });

  test("el tipo «Otro» usa el texto que escribió la persona", () => {
    const message = buildConfiguratorMessage("daale", {
      ...emptyAnswers(),
      eventTypeId: "daale-otro-particular",
      customEventLabel: "  Fiesta de egresados  ",
    });
    assert.equal(parseMessage(message).fields.get("Tipo de evento"), "Fiesta de egresados");
  });

  test("el presupuesto «Prefiero conversarlo» no lleva monto y las bandas dicen que son orientativas", () => {
    for (const band of budgetBands) {
      const brand = band.brand;
      const eventTypeId = eventTypes.find((e) => e.brand === brand)!.id;
      const value = parseMessage(
        buildConfiguratorMessage(brand, { ...emptyAnswers(), eventTypeId, budgetBandId: band.id })
      ).fields.get("Presupuesto");
      if (band.isConversation) {
        assert.equal(value, "Prefiero conversarlo", band.id);
      } else {
        assert.equal(value, `${band.label} (orientativo)`, band.id);
      }
    }
  });

  test("cada marca se nombra solo a sí misma", () => {
    const daale = buildConfiguratorMessage("daale", fullDaaleAnswers());
    assert.match(daale, /Daale/);
    assert.doesNotMatch(daale, /Noche Magik/i);

    const nm = buildConfiguratorMessage("noche-magik", fullNocheMagikBusinessAnswers());
    assert.match(nm, /Noche Magik/);
    assert.doesNotMatch(nm, /Daale/i);
  });

  test("los UTM no aparecen en el mensaje aunque la visita venga de una campaña", () => {
    const utm = {
      utm_source: "instagram",
      utm_medium: "historia-paga",
      utm_campaign: "primavera-2026",
    };
    const state: ConfiguratorState = {
      ...initialState("daale", "general", NOW),
      answers: fullDaaleAnswers(),
    };
    const lead = buildLead(state, utm, NOW);
    assert.equal(lead.utm_campaign, "primavera-2026", "los UTM viajan en el Lead");

    const message = buildConfiguratorMessage("daale", state.answers);
    for (const value of Object.values(utm)) {
      assert.ok(!message.includes(value), `el mensaje no lleva «${value}»`);
    }
    assert.doesNotMatch(message, /utm|campaña|fuente/i);
  });

  test("flujo real: lo que deja pasar el reducer nunca pone un show para mayores en un evento de 15", () => {
    const adultShow = services.find((s) => s.audience === "adults-only");
    assert.ok(adultShow, "el catálogo tiene un servicio adults-only para probar");

    for (const eventTypeId of ["nm-15", "nm-18", "nm-casamiento", "nm-fiesta"]) {
      const state = dispatchAll(initialState("noche-magik", "general", NOW), [
        { type: "setEventType", id: eventTypeId, now: NOW },
        { type: "toggleService", id: adultShow.id, now: NOW },
        { type: "toggleService", id: "nm-recepcion", now: NOW },
        { type: "toggleExtra", id: adultShow.id, now: NOW },
        { type: "patch", patch: { serviceIds: [adultShow.id, "nm-recepcion"] }, now: NOW },
      ]);
      const message = buildConfiguratorMessage("noche-magik", state.answers);
      assert.ok(!message.includes(adultShow.name), `${eventTypeId}: se coló «${adultShow.name}»`);
      assert.match(message, /Recepción de invitados/, eventTypeId);
      assertCleanMessage(message, "noche-magik", eventTypeId);
    }
  });

  test(
    "defensa en profundidad: aunque las respuestas lleguen sin limpiar, un evento de 15 no manda un show para mayores",
    () => {
      const message = buildConfiguratorMessage("noche-magik", {
        ...emptyAnswers(),
        eventTypeId: "nm-15",
        serviceIds: ["nm-adultos-show", "nm-recepcion"],
      });
      assert.ok(!message.includes(serviceName("nm-adultos-show")));
    }
  );
});

// ---------------------------------------------------------------------------
// «Hablar directamente»
// ---------------------------------------------------------------------------

describe("buildDirectMessage", () => {
  test("cada marca tiene su propio saludo y no nombra a la otra", () => {
    const daale = buildDirectMessage("daale");
    const nm = buildDirectMessage("noche-magik");
    assert.equal(daale, getBrand("daale").messages.direct);
    assert.equal(nm, getBrand("noche-magik").messages.direct);
    assert.notEqual(daale, nm);
    assert.match(daale, /Daale/);
    assert.doesNotMatch(daale, /Noche Magik/);
    assert.match(nm, /Noche Magik/);
    assert.doesNotMatch(nm, /Daale/);
  });

  test("es distinto del encabezado del configurador", () => {
    for (const brand of BRANDS) {
      assert.notEqual(buildDirectMessage(brand), getBrand(brand).messages.configuratorHeader, brand);
    }
  });
});

// ---------------------------------------------------------------------------
// Enlace wa.me
// ---------------------------------------------------------------------------

describe("whatsappUrl", () => {
  test("cada marca abre su propio número", () => {
    withWhatsappNumber("daale", "5492640000001", () =>
      withWhatsappNumber("noche-magik", "5492640000002", () => {
        assert.ok(whatsappUrl("daale", "Hola")?.startsWith("https://wa.me/5492640000001?text="));
        assert.ok(
          whatsappUrl("noche-magik", "Hola")?.startsWith("https://wa.me/5492640000002?text=")
        );
      })
    );
  });

  test("los números configurados hoy tienen un formato que wa.me acepta", () => {
    for (const brand of BRANDS) {
      const number = getBrand(brand).whatsapp.number;
      if (number === null) continue;
      assert.match(number, /^\d{10,15}$/, `${brand}: solo dígitos, con código de país`);
      assert.ok(whatsappUrl(brand, "Hola"), `${brand}: el número configurado no abre ningún chat`);
    }
  });

  test("codifica acentos, ñ, saltos de línea, &, ?, #, + y signos de apertura", () => {
    const text = "¿Tenés fecha? Sí & no #1\nMañana está: 50% ñandú + 2 / ¡Dale!";
    withWhatsappNumber("daale", "5492640000001", () => {
      const url = whatsappUrl("daale", text);
      assert.ok(url);
      const query = url.slice(url.indexOf("?text=") + "?text=".length);

      assert.equal(url.split("?").length, 2, "un solo «?», el que separa el texto");
      assert.ok(!url.includes("#"), "un «#» sin codificar cortaría el mensaje");
      assert.doesNotMatch(query, /[\s&?#+]/, "espacios, &, ?, # y + van codificados");
      assert.doesNotMatch(query, /[^\x21-\x7e]/, "nada fuera de ASCII visible");

      for (const [raw, encoded] of [
        ["\n", "%0A"],
        ["&", "%26"],
        ["?", "%3F"],
        ["#", "%23"],
        ["+", "%2B"],
        ["%", "%25"],
        ["ñ", "%C3%B1"],
        ["á", "%C3%A1"],
        ["é", "%C3%A9"],
        ["í", "%C3%AD"],
        ["ú", "%C3%BA"],
        ["¿", "%C2%BF"],
        ["¡", "%C2%A1"],
      ]) {
        assert.ok(query.includes(encoded), `«${JSON.stringify(raw)}» tiene que ir como ${encoded}`);
      }

      assert.equal(decodeURIComponent(query), text, "decodificado vuelve a ser el mismo texto");
      assert.equal(new URL(url).searchParams.get("text"), text, "leído como parámetro, igual");
    });
  });

  test("el mensaje completo del configurador va y vuelve sin perder nada", () => {
    withWhatsappNumber("noche-magik", "5492640000002", () => {
      const message = buildConfiguratorMessage("noche-magik", fullNocheMagikBusinessAnswers());
      const url = whatsappUrl("noche-magik", message);
      assert.ok(url);
      assert.equal(new URL(url).searchParams.get("text"), message);
      assert.equal(new URL(url).hostname, "wa.me");
    });
  });

  test("devuelve null si el número falta o es inválido: nunca abre un chat equivocado", () => {
    const invalid = [
      null,
      "",
      "123",
      "123456789",
      "+5492644398407",
      "54 9 264 439-8407",
      "549-264-4398407",
      "5492644398407abc",
      "1234567890123456",
      "https://wa.me/5492644398407",
    ];
    for (const brand of BRANDS) {
      for (const number of invalid) {
        withWhatsappNumber(brand, number, () => {
          assert.equal(whatsappUrl(brand, "Hola"), null, `${brand}: ${JSON.stringify(number)}`);
        });
      }
      withWhatsappNumber(brand, "5492644398407", () => {
        assert.ok(whatsappUrl(brand, "Hola"), `${brand}: un número válido sí arma el enlace`);
      });
    }
  });
});
