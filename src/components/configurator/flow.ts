import { allServiceCategories } from "@/config/catalog";
import { stepsFor } from "@/lib/configurator/state";
import { hasErrors, validateStep } from "@/lib/configurator/validation";
import type {
  ClientType,
  ConfiguratorState,
  ConfiguratorView,
  EventType,
  Service,
  StepId,
} from "@/lib/types";

/**
 * Lógica de recorrido propia de la pantalla: a qué vista se puede llegar y cómo
 * se agrupan en pantalla las listas que ya vienen filtradas de lib/audience.ts.
 * Nada de esto decide qué se ofrece: solo cómo se muestra.
 */

/** Primer paso visible que todavía tiene errores, o null si todo está completo. */
export function firstInvalidStep(state: ConfiguratorState, now: Date): StepId | null {
  for (const step of stepsFor(state)) {
    if (hasErrors(validateStep(step, state.answers, now))) return step;
  }
  return null;
}

/**
 * Vista a la que se puede ir de verdad. Si se pide un paso posterior a uno
 * incompleto (con el botón atrás del navegador o al recuperar respuestas
 * guardadas), se queda en el primer paso que falta completar.
 */
export function reachableView(
  state: ConfiguratorState,
  requested: ConfiguratorView,
  now: Date
): ConfiguratorView {
  const steps = stepsFor(state);
  const target: ConfiguratorView =
    requested === "resumen" || steps.includes(requested)
      ? requested
      : steps[Math.min(steps.length - 1, 2)];
  const limit = target === "resumen" ? steps.length : steps.indexOf(target);
  for (let i = 0; i < limit; i += 1) {
    if (hasErrors(validateStep(steps[i], state.answers, now))) return steps[i];
  }
  return target;
}

export interface EventTypeGroup {
  clientType: ClientType;
  items: EventType[];
}

/** Agrupa por tipo de cliente, respetando el orden en que llegan. */
export function groupEventTypes(list: EventType[], businessFirst: boolean): EventTypeGroup[] {
  const order: ClientType[] = businessFirst ? ["empresa", "particular"] : ["particular", "empresa"];
  return order
    .map((clientType) => ({
      clientType,
      items: list.filter((e) => e.clientType === clientType),
    }))
    .filter((g) => g.items.length > 0);
}

export interface ServiceGroup {
  category: string;
  label: string;
  items: Service[];
}

/**
 * Agrupa por categoría en el orden de serviceCategories. Si el evento es de un
 * tipo de cliente y hay categorías pensadas solo para ese tipo (por ejemplo, las
 * propuestas para empresas), van primero: es lo que esa persona vino a buscar.
 */
export function groupServices(list: Service[], eventType: EventType | null): ServiceGroup[] {
  const serviceCategories = allServiceCategories();
  const keys = Object.keys(serviceCategories);
  const groups = keys
    .map((category) => ({
      category,
      label: serviceCategories[category],
      items: list.filter((s) => s.category === category),
    }))
    .filter((g) => g.items.length > 0);

  // Categorías que no figuran en serviceCategories no se pierden.
  const known = new Set(keys);
  const unknown = list.filter((s) => !known.has(s.category));
  if (unknown.length > 0) {
    groups.push({ category: "otros", label: "Otras propuestas", items: unknown });
  }

  if (!eventType) return groups;
  const specific = (g: ServiceGroup) =>
    g.items.every((s) => s.clientTypes?.length === 1 && s.clientTypes[0] === eventType.clientType);
  return [...groups.filter(specific), ...groups.filter((g) => !specific(g))];
}

/** Cómo encontrar en pantalla el control de cada error, para llevarle el foco. */
export const ERROR_TARGETS: Record<string, string> = {
  eventType: "#grupo-eventType input",
  customEventLabel: "#customEventLabel",
  services: "#grupo-services input",
  eventDate: "#eventDate",
  approximateAttendees: "#approximateAttendees",
  childrenCount: "#childrenCount",
  adultsCount: "#adultsCount",
  clientName: "#clientName",
};

/**
 * Grilla de tarjetas con foto. En el celular la foto se vuelve apaisada para
 * que la lista no se haga eterna; desde tablet recupera la proporción 3:2.
 */
export const CARD_GRID =
  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&_figure]:aspect-[2/1] sm:[&_figure]:aspect-[3/2] [&_img]:object-[50%_30%]";
