import { budgetBands } from "@/config/budgets";
import { getEventType, sanitizeAnswers } from "@/lib/audience";
import { eventLabel } from "@/lib/configurator/state";
import { parseCount } from "@/lib/numbers";
import type { ConfiguratorState, Lead, UtmParams } from "@/lib/types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lead-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Arma el Lead a partir de las respuestas. No incluye datos personales de
 * menores: solo cantidades y un rango de edad cuando el evento lo pide. Las
 * respuestas se vuelven a limpiar con las reglas de público: el Lead es lo que
 * llegará a un CRM y no puede llevar nada que el evento no admite.
 */
export function buildLead(
  state: ConfiguratorState,
  utm: UtmParams,
  createdAt: string
): Lead {
  const a = sanitizeAnswers(state.answers, state.brand, state.mode);
  const eventType = getEventType(a.eventTypeId);
  const budget = budgetBands.find((b) => b.id === a.budgetBandId);

  const lead: Lead = {
    lead_id: newId(),
    created_at: createdAt,
    brand: state.brand,
    source: utm.utm_source ?? "web",
    client_type: eventType?.clientType ?? null,
    event_type: eventLabel(a),
    client_name: a.clientName.trim(),
    event_date: a.dateStatus === "sin-definir" || !a.eventDate ? null : a.eventDate,
    date_is_tentative: a.dateStatus !== "exacta",
    event_time: a.timeSlot,
    location: a.location.trim() || null,
    approximate_attendees: parseCount(a.approximateAttendees),
    selected_services: [...a.serviceIds],
    selected_characters: [...a.characterIds],
    selected_extras: [...a.extraServiceIds],
    duration: a.duration,
    budget_range: budget ? budget.label : null,
    // El brief fija los campos del Lead: el objetivo de una acción de empresa
    // viaja en notes, con su rótulo, para que no se pierda.
    notes:
      [
        eventType?.isBusiness && a.businessGoal.trim() ? `Objetivo: ${a.businessGoal.trim()}` : "",
        a.ideaNotes.trim(),
        a.notes.trim(),
      ]
        .filter(Boolean)
        .join("\n\n") || null,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    status: "new_lead",
  };

  if (eventType?.isBusiness && a.companyName.trim()) {
    lead.company_name = a.companyName.trim();
  }
  if (eventType?.asksAgeMix) {
    const kids = parseCount(a.childrenCount);
    const adults = parseCount(a.adultsCount);
    if (kids !== null) lead.children_count = kids;
    if (adults !== null) lead.adults_count = adults;
    if (a.ageRange) lead.age_range = a.ageRange;
  }
  return lead;
}

/**
 * Punto de integración futuro con un CRM o DaaleGrowth Agent. Hoy no envía
 * nada a ningún servidor: devuelve el Lead para que quien lo implemente decida
 * cuándo y cómo guardarlo, y lo comunique en el aviso de privacidad.
 */
export interface LeadSink {
  submit(lead: Lead): Promise<{ stored: boolean }>;
}

export const noopLeadSink: LeadSink = {
  async submit() {
    return { stored: false };
  },
};
