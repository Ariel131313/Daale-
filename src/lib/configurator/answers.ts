import type {
  AgeRange,
  ConfiguratorAnswers,
  DateStatus,
  DurationOption,
  TimeSlot,
} from "@/lib/types";

export function emptyAnswers(): ConfiguratorAnswers {
  return {
    eventTypeId: null,
    customEventLabel: "",
    serviceIds: [],
    characterIds: [],
    ideaNotes: "",
    dateStatus: "exacta",
    eventDate: "",
    timeSlot: null,
    duration: null,
    location: "",
    approximateAttendees: "",
    childrenCount: "",
    adultsCount: "",
    ageRange: null,
    companyName: "",
    businessGoal: "",
    extraServiceIds: [],
    budgetBandId: null,
    clientName: "",
    notes: "",
  };
}

// Valores válidos de cada opción cerrada. Con Record el compilador avisa si se
// agrega una opción a los tipos y falta acá.
const DATE_STATUSES: Record<DateStatus, true> = { exacta: true, tentativa: true, "sin-definir": true };
const TIME_SLOTS: Record<TimeSlot, true> = { manana: true, tarde: true, noche: true, "no-se": true };
const DURATIONS: Record<DurationOption, true> = {
  "1h": true,
  "2h": true,
  "3h": true,
  "mas-3h": true,
  "no-se": true,
};
const AGE_RANGES: Record<AgeRange, true> = {
  "0-3": true,
  "4-7": true,
  "8-12": true,
  "13-17": true,
  mezcla: true,
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function oneOf<T extends string>(value: unknown, allowed: Record<T, true>): T | null {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(allowed, value)
    ? (value as T)
    : null;
}

/**
 * Respuestas con la forma correcta aunque lo guardado esté incompleto, editado
 * a mano o venga de una versión anterior de la web: cada campo que no tiene el
 * tipo esperado vuelve a su valor vacío. Qué se puede elegir lo decide después
 * sanitizeAnswers, en lib/audience.ts.
 */
export function normalizeAnswers(raw: unknown): ConfiguratorAnswers {
  const empty = emptyAnswers();
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Record<string, unknown>;
  return {
    eventTypeId: textOrNull(r.eventTypeId),
    customEventLabel: text(r.customEventLabel),
    serviceIds: ids(r.serviceIds),
    characterIds: ids(r.characterIds),
    ideaNotes: text(r.ideaNotes),
    dateStatus: oneOf(r.dateStatus, DATE_STATUSES) ?? empty.dateStatus,
    // El formato de la fecha lo revisa la validación del paso, con un mensaje
    // junto al campo: acá solo se asegura que sea texto.
    eventDate: text(r.eventDate),
    timeSlot: oneOf(r.timeSlot, TIME_SLOTS),
    duration: oneOf(r.duration, DURATIONS),
    location: text(r.location),
    approximateAttendees: text(r.approximateAttendees),
    childrenCount: text(r.childrenCount),
    adultsCount: text(r.adultsCount),
    ageRange: oneOf(r.ageRange, AGE_RANGES),
    companyName: text(r.companyName),
    businessGoal: text(r.businessGoal),
    extraServiceIds: ids(r.extraServiceIds),
    budgetBandId: textOrNull(r.budgetBandId),
    clientName: text(r.clientName),
    notes: text(r.notes),
  };
}
