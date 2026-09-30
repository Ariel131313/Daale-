import type { EventType, Service } from "@/lib/types";
import { eventTypes as baseEventTypes } from "./eventTypes";
import { serviceCategories as baseCategories, services as baseServices } from "./services";

/**
 * Catálogo completo de tipos de evento, servicios y categorías.
 *
 * Los catálogos generales (eventTypes.ts, services.ts) no tienen nada
 * exclusivo para mayores. Ese catálogo vive en adultos.ts y se suma acá solo
 * desde la ruta que lo usa, con registerCatalog: así no viaja en el JavaScript
 * de las demás páginas. Registrar no habilita nada por sí solo: qué se ofrece
 * lo deciden las reglas de lib/audience.ts.
 */

interface CatalogExtension {
  categories?: Record<string, string>;
  eventTypes?: EventType[];
  services?: Service[];
}

let extraCategories: Record<string, string> = {};
let extraEventTypes: EventType[] = [];
let extraServices: Service[] = [];

/** Suma solo lo que no existe todavía (por id): registrar dos veces no duplica. */
function merge<T extends { id: string }>(base: T[], current: T[], more: T[] = []): T[] {
  const known = new Set([...base, ...current].map((x) => x.id));
  return [...current, ...more.filter((x) => !known.has(x.id))];
}

export function registerCatalog(extension: CatalogExtension): void {
  extraCategories = { ...extraCategories, ...extension.categories };
  extraEventTypes = merge(baseEventTypes, extraEventTypes, extension.eventTypes);
  extraServices = merge(baseServices, extraServices, extension.services);
}

export function allEventTypes(): EventType[] {
  return extraEventTypes.length > 0 ? [...baseEventTypes, ...extraEventTypes] : baseEventTypes;
}

export function allServices(): Service[] {
  return extraServices.length > 0 ? [...baseServices, ...extraServices] : baseServices;
}

/** Categorías en orden: primero las generales, después las registradas. */
export function allServiceCategories(): Record<string, string> {
  return { ...baseCategories, ...extraCategories };
}
