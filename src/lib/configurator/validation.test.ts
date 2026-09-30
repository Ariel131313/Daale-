/**
 * Validación del configurador.
 *
 * El brief pide preguntar solo lo indispensable: tipo de evento, algo para
 * llevar (o la idea escrita) y el nombre antes de enviar. La fecha puede ser
 * tentativa o quedar sin definir, y los mensajes van en español argentino con
 * voseo, sin tecnicismos.
 *
 * Todas las pruebas de fecha usan un «hoy» fijo: 24 de septiembre de 2026.
 *
 * Ejecutar: npx tsx --test src/lib/configurator/validation.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { eventTypes } from "@/lib/test-support/catalogo-completo";

import { emptyAnswers } from "@/lib/configurator/state";
import {
  hasErrors,
  isReadyToSend,
  validateStep,
  type FieldErrors,
} from "@/lib/configurator/validation";
import type { ConfiguratorAnswers, DateStatus, StepId } from "@/lib/types";

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

/** Mediodía del 24/09/2026 en la hora local de la máquina. */
const TODAY = new Date(2026, 8, 24, 12, 0, 0);
const ALL_STEPS: StepId[] = ["tipo", "servicios", "datos", "sugerencias", "confirmar"];
const NUMBER_FIELDS = ["approximateAttendees", "childrenCount", "adultsCount"] as const;

function answers(patch: Partial<ConfiguratorAnswers> = {}): ConfiguratorAnswers {
  return { ...emptyAnswers(), ...patch };
}

/** Respuestas que pasan todos los pasos. */
function ready(patch: Partial<ConfiguratorAnswers> = {}): ConfiguratorAnswers {
  return answers({
    eventTypeId: "daale-cumple-infantil",
    serviceIds: ["daale-personajes"],
    dateStatus: "exacta",
    eventDate: "2026-10-12",
    clientName: "Laura",
    ...patch,
  });
}

function errorsOf(step: StepId, patch: Partial<ConfiguratorAnswers>, now: Date = TODAY): FieldErrors {
  return validateStep(step, answers(patch), now);
}

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

function timeZoneSwitchWorks(): boolean {
  return inTimeZone(
    "America/Argentina/San_Juan",
    () => new Date(2026, 0, 15).getTimezoneOffset() === 180
  );
}

/** Palabras sueltas, sin signos. \b no sirve con letras acentuadas. */
function words(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Todos los mensajes que la validación puede mostrar hoy. */
function allMessages(): string[] {
  const sources: FieldErrors[] = [
    errorsOf("tipo", {}),
    errorsOf("tipo", { eventTypeId: "daale-otro-particular" }),
    errorsOf("servicios", {}),
    errorsOf("datos", { approximateAttendees: "x", childrenCount: "x", adultsCount: "x" }),
    errorsOf("datos", { eventDate: "2020-01-01" }),
    errorsOf("datos", { eventDate: "zzz" }),
    errorsOf("confirmar", {}),
  ];
  return [...new Set(sources.flatMap((e) => Object.values(e)).filter((m): m is string => Boolean(m)))];
}

// ---------------------------------------------------------------------------
// Paso 1: tipo de evento
// ---------------------------------------------------------------------------

describe("paso «tipo»", () => {
  test("sin tipo de evento no se puede avanzar", () => {
    assert.ok(errorsOf("tipo", {}).eventType);
    assert.ok(errorsOf("tipo", { eventTypeId: "no-existe" }).eventType);
  });

  test("cualquier tipo del catálogo alcanza", () => {
    for (const et of eventTypes.filter((e) => !e.isOther)) {
      assert.equal(hasErrors(errorsOf("tipo", { eventTypeId: et.id })), false, et.id);
    }
  });

  test("en «Otro» hay que contar en pocas palabras qué evento es", () => {
    for (const et of eventTypes.filter((e) => e.isOther)) {
      for (const label of ["", " ", "a", "  a  "]) {
        const e = errorsOf("tipo", { eventTypeId: et.id, customEventLabel: label });
        assert.ok(e.customEventLabel, `${et.id} con «${label}»`);
        assert.equal(e.eventType, undefined);
      }
      for (const label of ["Kermés", "Ok", "  Fiesta de egresados  "]) {
        assert.equal(
          hasErrors(errorsOf("tipo", { eventTypeId: et.id, customEventLabel: label })),
          false,
          `${et.id} con «${label}»`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Paso 2: servicios
// ---------------------------------------------------------------------------

describe("paso «servicios»", () => {
  test("sin servicios ni idea escrita no se puede avanzar", () => {
    assert.ok(errorsOf("servicios", {}).services);
    assert.ok(errorsOf("servicios", { ideaNotes: "  ab  " }).services);
  });

  test("alcanza con un servicio", () => {
    assert.equal(hasErrors(errorsOf("servicios", { serviceIds: ["daale-animacion"] })), false);
  });

  test("alcanza con escribir la idea, aunque no encuentre la tarjeta exacta", () => {
    assert.equal(hasErrors(errorsOf("servicios", { ideaNotes: "Un show de burbujas" })), false);
  });

  test("los extras no reemplazan la elección del paso", () => {
    assert.ok(errorsOf("servicios", { extraServiceIds: ["daale-fotos"] }).services);
  });
});

// ---------------------------------------------------------------------------
// Paso 3: datos del evento
// ---------------------------------------------------------------------------

describe("paso «datos»: fecha", () => {
  test("una fecha pasada se rechaza, sea exacta o tentativa", () => {
    for (const dateStatus of ["exacta", "tentativa"] as DateStatus[]) {
      for (const eventDate of ["2026-09-23", "2026-01-01", "2025-12-31", "2000-02-29"]) {
        const e = errorsOf("datos", { dateStatus, eventDate });
        assert.ok(e.eventDate, `${dateStatus} ${eventDate}`);
        assert.match(e.eventDate ?? "", /ya pasó/);
      }
    }
  });

  test("una fecha que no es del calendario se rechaza con su propio mensaje", () => {
    for (const dateStatus of ["exacta", "tentativa"] as DateStatus[]) {
      for (const eventDate of ["zzz", "12/10/2026", "2026-02-30", "2026-13-01", "2026-9-5", "2026-10-12T10:00"]) {
        const e = errorsOf("datos", { dateStatus, eventDate });
        assert.ok(e.eventDate, `${dateStatus} ${eventDate}`);
        assert.match(e.eventDate ?? "", /no es válida/, eventDate);
      }
    }
  });

  test("hoy y cualquier día futuro se aceptan", () => {
    for (const dateStatus of ["exacta", "tentativa"] as DateStatus[]) {
      for (const eventDate of ["2026-09-24", "2026-09-25", "2026-12-31", "2027-02-28", "2030-06-15"]) {
        assert.equal(errorsOf("datos", { dateStatus, eventDate }).eventDate, undefined, `${dateStatus} ${eventDate}`);
      }
    }
  });

  test("«hoy» cambia a la medianoche local, no antes", () => {
    const lateToday = new Date(2026, 8, 24, 23, 59, 59);
    assert.equal(errorsOf("datos", { eventDate: "2026-09-24" }, lateToday).eventDate, undefined);
    const earlyTomorrow = new Date(2026, 8, 25, 0, 0, 1);
    assert.ok(errorsOf("datos", { eventDate: "2026-09-24" }, earlyTomorrow).eventDate);
  });

  test("a la noche en Argentina, hoy sigue siendo hoy aunque en UTC ya sea mañana", (t) => {
    if (!timeZoneSwitchWorks()) {
      t.skip("este entorno no permite cambiar el huso horario en caliente");
      return;
    }
    inTimeZone("America/Argentina/San_Juan", () => {
      // 23:30 del 24 en San Juan = 02:30 del 25 en UTC.
      const night = new Date("2026-09-25T02:30:00Z");
      assert.equal(errorsOf("datos", { eventDate: "2026-09-24" }, night).eventDate, undefined);
      assert.ok(errorsOf("datos", { eventDate: "2026-09-23" }, night).eventDate);
    });
  });

  test("con fecha exacta o tentativa, la fecha hace falta y el mensaje ofrece la salida", () => {
    for (const dateStatus of ["exacta", "tentativa"] as DateStatus[]) {
      const e = errorsOf("datos", { dateStatus, eventDate: "" });
      assert.ok(e.eventDate, dateStatus);
      assert.match(e.eventDate ?? "", /Todavía no la definí/);
    }
  });

  test("«Todavía no la definí» permite avanzar sin fecha", () => {
    assert.equal(hasErrors(errorsOf("datos", { dateStatus: "sin-definir", eventDate: "" })), false);
  });

  test("«Todavía no la definí» ignora una fecha vieja que haya quedado cargada", () => {
    assert.equal(hasErrors(errorsOf("datos", { dateStatus: "sin-definir", eventDate: "2020-01-01" })), false);
  });

  test("ningún otro dato del paso es obligatorio", () => {
    const e = errorsOf("datos", {
      dateStatus: "sin-definir",
      timeSlot: null,
      duration: null,
      location: "",
      approximateAttendees: "",
      childrenCount: "",
      adultsCount: "",
      ageRange: null,
      companyName: "",
      businessGoal: "",
    });
    assert.deepEqual(e, {});
  });

  test("en eventos de empresa, empresa y objetivo tampoco son obligatorios", () => {
    for (const et of eventTypes.filter((e) => e.isBusiness)) {
      assert.deepEqual(errorsOf("datos", { eventTypeId: et.id, dateStatus: "sin-definir" }), {}, et.id);
    }
  });
});

describe("paso «datos»: cantidades", () => {
  // Con punto de miles, como se escribe en Argentina: "1.500" son mil quinientas personas.
  const valid = ["", "   ", "1", "40", " 40 ", "150", "99999", "1.500", "12.345", "99.999"];
  const invalid = [
    "0",
    "00",
    "-5",
    "3.5",
    "2,5",
    "1.5",
    "1.50",
    "0.500",
    "1,500",
    "123.456",
    "1.500.000",
    "abc",
    "40 personas",
    "unos 40",
    "1e3",
    "+5",
    "0x10",
    "Infinity",
    "NaN",
    "100000",
    "٤٠",
  ];

  for (const field of NUMBER_FIELDS) {
    test(`${field}: acepta enteros positivos o vacío`, () => {
      for (const value of valid) {
        const e = errorsOf("datos", { dateStatus: "sin-definir", [field]: value });
        assert.equal(e[field], undefined, `«${value}»`);
      }
    });

    test(`${field}: rechaza lo que no es un entero positivo, con el error en su campo`, () => {
      for (const value of invalid) {
        const e = errorsOf("datos", { dateStatus: "sin-definir", [field]: value });
        assert.ok(e[field], `«${value}» tendría que rechazarse`);
        assert.match(e[field] ?? "", /número/, `«${value}»: el mensaje dice qué escribir`);
        for (const other of NUMBER_FIELDS.filter((f) => f !== field)) {
          assert.equal(e[other], undefined, `«${value}» no marca ${other}`);
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Paso 4 y 5
// ---------------------------------------------------------------------------

describe("paso «sugerencias»", () => {
  test("es opcional: nunca frena el avance", () => {
    assert.deepEqual(validateStep("sugerencias", emptyAnswers(), TODAY), {});
    assert.deepEqual(validateStep("sugerencias", ready({ extraServiceIds: [] }), TODAY), {});
  });
});

describe("paso «confirmar»", () => {
  test("el nombre es obligatorio al final", () => {
    for (const clientName of ["", "   ", "A", " b "]) {
      assert.ok(errorsOf("confirmar", { clientName }).clientName, `«${clientName}»`);
    }
  });

  test("con un nombre alcanza; presupuesto y notas son opcionales", () => {
    for (const clientName of ["Ana", "Al", "  María José  ", "Ñata"]) {
      assert.deepEqual(errorsOf("confirmar", { clientName, budgetBandId: null, notes: "" }), {}, clientName);
    }
  });

  test("teléfono y correo no se piden: la conversación sigue por WhatsApp", () => {
    const keys = ALL_STEPS.flatMap((step) => Object.keys(validateStep(step, emptyAnswers(), TODAY)));
    assert.doesNotMatch(keys.join(" "), /phone|telefono|email|mail/i);
  });
});

// ---------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------

describe("mensajes de error", () => {
  const messages = allMessages();

  test("hay un mensaje por cada situación", () => {
    assert.equal(messages.length, 10, messages.join("\n"));
  });

  test("están en voseo, con una indicación concreta de qué hacer", () => {
    const voseo = new Set(["Elegí", "elegí", "Contanos", "Escribí", "escribí", "marcá", "Marcá"]);
    const otherForms = new Set([
      "Elige", "elige", "Elija", "elija",
      "Escribe", "escribe", "Escriba", "escriba",
      "Cuéntanos", "Cuéntenos", "Marque", "marque",
      "Selecciona", "Seleccione", "Ingresa", "Ingrese", "Introduce", "Introduzca",
      "tú", "Tú", "usted", "Usted", "puedes", "debes", "tienes", "quieres",
    ]);
    for (const m of messages) {
      const w = words(m);
      assert.ok(w.some((x) => voseo.has(x)), `sin verbo en voseo: «${m}»`);
      for (const x of w) assert.ok(!otherForms.has(x), `«${x}» no es voseo: «${m}»`);
    }
  });

  test("no son técnicos ni usan guion largo ni lenguaje inclusivo", () => {
    const technical = /\b(error|inv[aá]lid[oa]|formato|requerido|obligatorio|campo|undefined|null|NaN|string|input|valor)\b/i;
    for (const m of messages) {
      assert.doesNotMatch(m, technical, m);
      assert.ok(!m.includes("—"), `guion largo en «${m}»`);
      assert.doesNotMatch(m, /@|\b\w+x\b|todes|chiques/i, m);
    }
  });

  test("empiezan con mayúscula y terminan con punto", () => {
    for (const m of messages) {
      assert.match(m, /^[A-ZÁÉÍÓÚÑ¿¡]/, m);
      assert.ok(m.endsWith("."), m);
    }
  });

  test("cada error queda en la clave del campo al que se asocia", () => {
    const keys = new Set([
      ...Object.keys(errorsOf("tipo", {})),
      ...Object.keys(errorsOf("tipo", { eventTypeId: "daale-otro-particular" })),
      ...Object.keys(errorsOf("servicios", {})),
      ...Object.keys(errorsOf("datos", { approximateAttendees: "x", childrenCount: "x", adultsCount: "x" })),
      ...Object.keys(errorsOf("confirmar", {})),
    ]);
    assert.deepEqual(
      [...keys].sort(),
      [
        "adultsCount",
        "approximateAttendees",
        "childrenCount",
        "clientName",
        "customEventLabel",
        "eventDate",
        "eventType",
        "services",
      ]
    );
  });
});

// ---------------------------------------------------------------------------
// hasErrors e isReadyToSend
// ---------------------------------------------------------------------------

describe("hasErrors", () => {
  test("solo cuenta los mensajes con texto", () => {
    assert.equal(hasErrors({}), false);
    assert.equal(hasErrors({ eventDate: undefined }), false);
    assert.equal(hasErrors({ eventDate: "" }), false);
    assert.equal(hasErrors({ eventDate: "La fecha ya pasó." }), true);
  });
});

describe("isReadyToSend", () => {
  test("con lo indispensable completo se puede enviar", () => {
    assert.equal(isReadyToSend(ready(), TODAY), true);
  });

  test("sin fecha definida también se puede enviar", () => {
    assert.equal(isReadyToSend(ready({ dateStatus: "sin-definir", eventDate: "" }), TODAY), true);
  });

  test("con solo la idea escrita, sin servicios, también", () => {
    assert.equal(isReadyToSend(ready({ serviceIds: [], ideaNotes: "Algo con burbujas" }), TODAY), true);
  });

  test("falta cualquier cosa indispensable y no se puede enviar", () => {
    const missing: [string, Partial<ConfiguratorAnswers>][] = [
      ["sin tipo", { eventTypeId: null }],
      ["«Otro» sin texto", { eventTypeId: "daale-otro-particular", customEventLabel: "" }],
      ["sin servicios ni idea", { serviceIds: [], ideaNotes: "" }],
      ["sin fecha y sin marcar «Todavía no la definí»", { eventDate: "" }],
      ["fecha pasada", { eventDate: "2026-09-01" }],
      ["número inválido", { approximateAttendees: "muchos" }],
      ["sin nombre", { clientName: "" }],
    ];
    for (const [why, patch] of missing) {
      assert.equal(isReadyToSend(ready(patch), TODAY), false, why);
    }
  });

  test("usa el «hoy» que recibe", () => {
    const a = ready({ eventDate: "2026-10-12" });
    assert.equal(isReadyToSend(a, new Date(2026, 9, 12, 20, 0)), true);
    assert.equal(isReadyToSend(a, new Date(2026, 9, 13, 9, 0)), false);
  });
});
