import { budgetBands } from "@/config/budgets";
import { allEventTypes, allServices } from "@/config/catalog";
import { characters } from "@/config/characters";
import { recommendations } from "@/config/recommendations";
import { siteConfig } from "@/config/site";
import { normalizeAnswers } from "./configurator/answers";
import { parseCount } from "./numbers";
import type {
  BrandId,
  Character,
  ConfiguratorAnswers,
  ConfiguratorMode,
  EventType,
  Recommendation,
  Service,
  ServiceAudience,
} from "./types";

/**
 * Separación de públicos. Todo listado de tipos de evento, servicios,
 * personajes y sugerencias pasa por acá: ningún componente filtra por su cuenta.
 *
 * Reglas:
 * 1. Lo exclusivo para mayores ("adults-only") solo existe con el flag activo,
 *    solo en Noche Magik, solo en el modo "adults-only" y solo si el tipo de
 *    evento elegido también es "adults-only".
 * 2. Lo pensado para público adulto ("adults") no se ofrece donde hay o puede
 *    haber menores.
 * 3. En el modo general los tipos de evento "adults-only" no existen.
 */

export interface AudienceFlags {
  enableAdultCategory: boolean;
  /** Apagado, lo que la marca no confirmó no se ofrece (ver site.ts). */
  showPendingServices?: boolean;
}

/** Lo no confirmado se ofrece solo si el interruptor lo permite. */
function offered(item: { pendingConfirmation: boolean }, flags: AudienceFlags): boolean {
  return !item.pendingConfirmation || flags.showPendingServices !== false;
}

const defaultFlags: AudienceFlags = siteConfig.flags;

export function adultCategoryAvailable(
  brand: BrandId,
  flags: AudienceFlags = defaultFlags
): boolean {
  return brand === "noche-magik" && flags.enableAdultCategory;
}

export function getEventType(id: string | null): EventType | null {
  if (!id) return null;
  return allEventTypes().find((e) => e.id === id) ?? null;
}

export function eventTypesFor(
  brand: BrandId,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): EventType[] {
  return allEventTypes()
    .filter((e) => e.brand === brand)
    .filter((e) =>
      mode === "adults-only"
        ? adultCategoryAvailable(brand, flags) && e.audience === "adults-only"
        : e.audience !== "adults-only"
    )
    .sort((a, b) => a.order - b.order);
}

function audienceAllowed(
  itemAudience: ServiceAudience,
  itemBrand: BrandId,
  eventType: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags
): boolean {
  // Un modo para mayores que no está habilitado no ofrece nada, ni siquiera lo
  // apto para todo público: el recorrido directamente no existe.
  if (mode === "adults-only" && !adultCategoryAvailable(itemBrand, flags)) {
    return false;
  }
  if (itemAudience === "adults-only") {
    return (
      adultCategoryAvailable(itemBrand, flags) &&
      mode === "adults-only" &&
      eventType?.audience === "adults-only"
    );
  }
  if (itemAudience === "adults") {
    return eventType?.audience === "adults" || eventType?.audience === "adults-only";
  }
  return true;
}

/** Un tipo de evento es válido en el modo actual y para la marca. */
export function isEventTypeAllowed(
  eventType: EventType | null,
  brand: BrandId,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): boolean {
  if (!eventType) return false;
  return eventTypesFor(brand, mode, flags).some((e) => e.id === eventType.id);
}

export function isServiceAllowed(
  service: Service,
  eventType: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): boolean {
  if (eventType && service.brand !== eventType.brand) return false;
  if (!offered(service, flags)) return false;
  if (!audienceAllowed(service.audience, service.brand, eventType, mode, flags)) {
    return false;
  }
  if (service.clientTypes && eventType) {
    return service.clientTypes.includes(eventType.clientType);
  }
  return true;
}

export function servicesFor(
  brand: BrandId,
  eventType: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): Service[] {
  return allServices()
    .filter((s) => s.brand === brand)
    .filter((s) => isServiceAllowed(s, eventType, mode, flags))
    .sort((a, b) => a.commercialPriority - b.commercialPriority);
}

export function isCharacterAllowed(
  character: Character,
  eventType: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): boolean {
  if (eventType && character.brand !== eventType.brand) return false;
  if (!offered(character, flags)) return false;
  return audienceAllowed(character.audience, character.brand, eventType, mode, flags);
}

/** Personajes permitidos; los sugeridos para el tipo de evento van primero. */
export function charactersFor(
  brand: BrandId,
  eventType: EventType | null,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): Character[] {
  const allowed = characters
    .filter((c) => c.brand === brand)
    .filter((c) => isCharacterAllowed(c, eventType, mode, flags));
  if (!eventType) return allowed;
  const suggested = allowed.filter((c) => c.suggestedFor.includes(eventType.id));
  const rest = allowed.filter((c) => !c.suggestedFor.includes(eventType.id));
  return [...suggested, ...rest];
}

function conditionMatches(
  rec: Recommendation,
  answers: ConfiguratorAnswers,
  eventType: EventType | null
): boolean {
  const w = rec.when;
  if (w.eventTypeIds && (!eventType || !w.eventTypeIds.includes(eventType.id))) {
    return false;
  }
  if (w.audienceIn && (!eventType || !w.audienceIn.includes(eventType.audience))) {
    return false;
  }
  if (w.clientType && eventType?.clientType !== w.clientType) return false;
  if (w.hasAnyServiceId && !w.hasAnyServiceId.some((id) => answers.serviceIds.includes(id))) {
    return false;
  }
  if (w.minAttendees !== undefined) {
    const total = parseCount(answers.approximateAttendees);
    if (total === null || total < w.minAttendees) return false;
  }
  if (w.minChildren !== undefined) {
    const kids = parseCount(answers.childrenCount);
    if (kids === null || kids < w.minChildren) return false;
  }
  return true;
}

export interface ApplicableRecommendation {
  recommendation: Recommendation;
  service: Service;
}

/** Pocas y bien elegidas: el paso de sugerencias no es otro catálogo. */
export const MAX_SUGGESTIONS = 4;

/**
 * Sugerencias para las respuestas actuales. No son siempre las mismas: primero
 * va lo que combina con lo último que eligió la persona (pairsWith del
 * catálogo), y después lo que sugieren las reglas por tipo de evento y
 * cantidades. Si una regla habla del mismo servicio, se usa su explicación,
 * que es más específica.
 *
 * Se descarta lo ya elegido y, sobre todo, lo que el público del evento no
 * admite: una fiesta de 15 nunca recibe una sugerencia para adultos, aunque
 * alguien cargue mal una regla o una combinación.
 */
export function recommendationsFor(
  brand: BrandId,
  answers: ConfiguratorAnswers,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): ApplicableRecommendation[] {
  const eventType = getEventType(answers.eventTypeId);
  const findService = (id: string) => allServices().find((s) => s.id === id);
  const usable = (service: Service | undefined): service is Service =>
    Boolean(
      service &&
        service.brand === brand &&
        !answers.serviceIds.includes(service.id) &&
        isServiceAllowed(service, eventType, mode, flags)
    );

  const byRule = new Map<string, Recommendation>();
  for (const rec of recommendations) {
    if (rec.brand !== brand || byRule.has(rec.suggestServiceId)) continue;
    if (conditionMatches(rec, answers, eventType)) byRule.set(rec.suggestServiceId, rec);
  }

  const result: ApplicableRecommendation[] = [];
  const offer = (service: Service | undefined, fallback: () => Recommendation) => {
    if (!usable(service) || result.some((r) => r.service.id === service.id)) return;
    result.push({ recommendation: byRule.get(service.id) ?? fallback(), service });
  };

  // 1) Lo que combina con lo elegido, empezando por lo último que se marcó.
  for (const chosenId of [...answers.serviceIds].reverse()) {
    const chosen = findService(chosenId);
    if (!chosen || !isServiceAllowed(chosen, eventType, mode, flags)) continue;
    for (const pairId of chosen.pairsWith) {
      offer(findService(pairId), () => ({
        id: `combina-${chosen.id}-${pairId}`,
        brand,
        suggestServiceId: pairId,
        // Sin la descripción del servicio: puede hablar de un público que no es
        // el de este evento (por ejemplo, de chicos en un cumpleaños de adultos).
        reason: `Combina con «${chosen.name}», que ya elegiste.`,
        when: {},
      }));
    }
  }

  // 2) Las reglas por tipo de evento y cantidades.
  for (const [serviceId, rec] of byRule) {
    offer(findService(serviceId), () => rec);
  }

  return result.slice(0, MAX_SUGGESTIONS);
}

/**
 * Sugerencias que la persona ya sumó, en el orden del catálogo. Siguen a la
 * vista aunque su sugerencia haya dejado de aplicar (por ejemplo, porque cambió
 * lo que eligió en el paso anterior), para que siempre se puedan sacar.
 */
export function extrasFor(
  brand: BrandId,
  answers: ConfiguratorAnswers,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): Service[] {
  const eventType = getEventType(answers.eventTypeId);
  return allServices()
    .filter((s) => s.brand === brand && answers.extraServiceIds.includes(s.id))
    .filter((s) => isServiceAllowed(s, eventType, mode, flags))
    .sort((a, b) => a.commercialPriority - b.commercialPriority);
}

/**
 * Quita de las respuestas todo lo que el tipo de evento actual no admite. Se
 * aplica al cambiar de tipo de evento, al recuperar respuestas guardadas y otra
 * vez al armar el mensaje y el Lead, así nada incompatible sobrevive en el
 * almacenamiento ni llega a WhatsApp. Primero normaliza la forma: lo guardado
 * puede venir incompleto o editado a mano.
 */
export function sanitizeAnswers(
  raw: ConfiguratorAnswers,
  brand: BrandId,
  mode: ConfiguratorMode,
  flags: AudienceFlags = defaultFlags
): ConfiguratorAnswers {
  const answers = normalizeAnswers(raw);
  let eventType = getEventType(answers.eventTypeId);
  if (eventType && !isEventTypeAllowed(eventType, brand, mode, flags)) {
    eventType = null;
  }

  const allowedService = (id: string) => {
    const s = allServices().find((x) => x.id === id);
    return Boolean(s && s.brand === brand && isServiceAllowed(s, eventType, mode, flags));
  };
  const allowedCharacter = (id: string) => {
    const c = characters.find((x) => x.id === id);
    return Boolean(c && c.brand === brand && isCharacterAllowed(c, eventType, mode, flags));
  };

  const unique = (ids: string[]) => [...new Set(ids)];
  const serviceIds = unique(answers.serviceIds.filter(allowedService));
  const extraServiceIds = unique(
    answers.extraServiceIds.filter((id) => allowedService(id) && !serviceIds.includes(id))
  );
  const opensCharacters = serviceIds.some(
    (id) => allServices().find((s) => s.id === id)?.opensCharacters
  );
  const budget = budgetBands.find((b) => b.id === answers.budgetBandId);

  return {
    ...answers,
    eventTypeId: eventType ? eventType.id : null,
    customEventLabel: eventType?.isOther ? answers.customEventLabel : "",
    serviceIds,
    extraServiceIds,
    characterIds: opensCharacters ? unique(answers.characterIds.filter(allowedCharacter)) : [],
    budgetBandId: budget && budget.brand === brand ? budget.id : null,
    childrenCount: eventType?.asksAgeMix ? answers.childrenCount : "",
    adultsCount: eventType?.asksAgeMix ? answers.adultsCount : "",
    ageRange: eventType?.asksAgeMix ? answers.ageRange : null,
    companyName: eventType?.isBusiness ? answers.companyName : "",
    businessGoal: eventType?.isBusiness ? answers.businessGoal : "",
  };
}
