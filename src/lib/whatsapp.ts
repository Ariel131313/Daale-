import { budgetBands } from "@/config/budgets";
import { characters } from "@/config/characters";
import { getBrand } from "@/config/brands";
import { getEventType, sanitizeAnswers } from "@/lib/audience";
import { eventLabel, serviceNames } from "@/lib/configurator/state";
import type {
  AgeRange,
  BrandId,
  ConfiguratorAnswers,
  ConfiguratorMode,
  DurationOption,
  TimeSlot,
} from "@/lib/types";

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
  "no-se": "Todavía no lo sé",
};

export const DURATION_LABELS: Record<DurationOption, string> = {
  "1h": "1 hora",
  "2h": "2 horas",
  "3h": "3 horas",
  "mas-3h": "Más de 3 horas",
  "no-se": "Todavía no lo sé",
};

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  "0-3": "0 a 3 años",
  "4-7": "4 a 7 años",
  "8-12": "8 a 12 años",
  "13-17": "13 a 17 años",
  mezcla: "Edades variadas",
};

/** "2026-10-12" -> "lunes, 12 de octubre de 2026", sin corrimientos de huso. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function line(label: string, value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? `*${label}:* ${v}` : null;
}

function peopleLine(answers: ConfiguratorAnswers, asksAgeMix: boolean): string | null {
  const total = answers.approximateAttendees.trim();
  const kids = asksAgeMix ? answers.childrenCount.trim() : "";
  const adults = asksAgeMix ? answers.adultsCount.trim() : "";
  const detail = [kids && `${kids} chicos`, adults && `${adults} adultos`]
    .filter(Boolean)
    .join(" y ");
  if (total && detail) return `${total} aprox. (${detail})`;
  if (total) return `${total} aprox.`;
  return detail || null;
}

export function dateText(answers: ConfiguratorAnswers): string {
  if (answers.dateStatus === "sin-definir" || !answers.eventDate) {
    return "Todavía no la definí";
  }
  const formatted = formatDate(answers.eventDate);
  return answers.dateStatus === "tentativa" ? `${formatted} (tentativa)` : formatted;
}

/**
 * Mensaje del configurador. Solo lleva los datos que la persona completó:
 * ninguna línea vacía ni "Zona: -". Los UTM no van en el mensaje.
 *
 * Vuelve a limpiar las respuestas con las reglas de público de la marca y el
 * modo: aunque alguien arme el mensaje con datos sin pasar por el reducer, un
 * evento con menores nunca lleva algo para mayores. Sin modo, se asume el
 * recorrido general, que es el más restrictivo.
 */
export function buildConfiguratorMessage(
  brandId: BrandId,
  raw: ConfiguratorAnswers,
  mode: ConfiguratorMode = "general"
): string {
  const answers = sanitizeAnswers(raw, brandId, mode);
  const brand = getBrand(brandId);
  const eventType = getEventType(answers.eventTypeId);
  const budget = budgetBands.find((b) => b.id === answers.budgetBandId);
  const characterNames = characters
    .filter((c) => answers.characterIds.includes(c.id))
    .map((c) => c.name);

  const lines = [
    line("Marca", brand.name),
    line("Tipo de evento", eventLabel(answers)),
    eventType?.isBusiness ? line("Empresa o institución", answers.companyName) : null,
    eventType?.isBusiness ? line("Objetivo", answers.businessGoal) : null,
    line("Fecha", dateText(answers)),
    line("Horario", answers.timeSlot ? TIME_SLOT_LABELS[answers.timeSlot] : null),
    line("Duración", answers.duration ? DURATION_LABELS[answers.duration] : null),
    line("Zona", answers.location),
    line(eventType?.isBusiness ? "Público estimado" : "Invitados", peopleLine(answers, Boolean(eventType?.asksAgeMix))),
    eventType?.asksAgeMix && answers.ageRange
      ? line("Edad de los chicos", AGE_RANGE_LABELS[answers.ageRange])
      : null,
    line("Servicios", serviceNames(answers.serviceIds).join(", ")),
    line("Personajes", characterNames.join(", ")),
    line("Sumé también", serviceNames(answers.extraServiceIds).join(", ")),
    line("Mi idea", answers.ideaNotes),
    budget
      ? line("Presupuesto", budget.isConversation ? "Prefiero conversarlo" : `${budget.label} (orientativo)`)
      : null,
    line("Nombre", answers.clientName),
    line("Notas", answers.notes),
  ].filter((l): l is string => Boolean(l));

  return `${brand.messages.configuratorHeader}\n\n${lines.join("\n")}`;
}

export function buildDirectMessage(brandId: BrandId): string {
  return getBrand(brandId).messages.direct;
}

/**
 * Enlace wa.me con el texto codificado. Devuelve null si la marca no tiene
 * número configurado: en ese caso no se abre ningún chat.
 */
export function whatsappUrl(brandId: BrandId, text: string): string | null {
  const number = getBrand(brandId).whatsapp.number;
  if (!number || !/^\d{10,15}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
