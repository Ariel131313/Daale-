import { allServices } from "@/config/catalog";
import {
  getEventType,
  recommendationsFor,
  sanitizeAnswers,
} from "@/lib/audience";
import type {
  BrandId,
  ConfiguratorAnswers,
  ConfiguratorMode,
  ConfiguratorState,
  ConfiguratorView,
  StepId,
} from "@/lib/types";
import { emptyAnswers } from "./answers";

export { emptyAnswers, normalizeAnswers } from "./answers";

/** Todas las vistas posibles, en el orden del recorrido. */
export const CONFIGURATOR_VIEWS: readonly ConfiguratorView[] = [
  "tipo",
  "servicios",
  "datos",
  "sugerencias",
  "confirmar",
  "resumen",
];

export function isConfiguratorView(value: unknown): value is ConfiguratorView {
  return typeof value === "string" && (CONFIGURATOR_VIEWS as readonly string[]).includes(value);
}

export function initialState(
  brand: BrandId,
  mode: ConfiguratorMode,
  now: string
): ConfiguratorState {
  return {
    version: 1,
    brand,
    mode,
    answers: emptyAnswers(),
    view: "tipo",
    startedAt: null,
    updatedAt: now,
  };
}

/**
 * Pasos visibles. "Sugerencias" solo aparece si hay algo pertinente que
 * sugerir, o si ya se sumó alguna (para poder revisarla o sacarla): la rapidez
 * vale más que mostrar siempre cinco pasos. Por eso el total puede cambiar
 * cuando cambian las respuestas.
 *
 * Mientras la persona está en «Sugerencias», el paso no desaparece aunque
 * destilde la última: un cambio en un control nunca la saca del paso. Al
 * recuperar respuestas guardadas se usa la regla estricta (sticky: false).
 */
export function stepsFor(
  state: ConfiguratorState,
  { sticky = true }: { sticky?: boolean } = {}
): StepId[] {
  const steps: StepId[] = ["tipo", "servicios", "datos"];
  if (
    (sticky && state.view === "sugerencias") ||
    state.answers.extraServiceIds.length > 0 ||
    recommendationsFor(state.brand, state.answers, state.mode).length > 0
  ) {
    steps.push("sugerencias");
  }
  steps.push("confirmar");
  return steps;
}

export function stepPosition(state: ConfiguratorState, step: StepId) {
  const steps = stepsFor(state);
  const index = steps.indexOf(step);
  return { number: index + 1, total: steps.length, steps };
}

export function nextView(state: ConfiguratorState): ConfiguratorView {
  if (state.view === "resumen") return "resumen";
  const steps = stepsFor(state);
  const index = steps.indexOf(state.view);
  if (index === -1) return steps[0];
  return index === steps.length - 1 ? "resumen" : steps[index + 1];
}

export function previousView(state: ConfiguratorState): ConfiguratorView | null {
  const steps = stepsFor(state);
  if (state.view === "resumen") return steps[steps.length - 1];
  const index = steps.indexOf(state.view);
  return index > 0 ? steps[index - 1] : null;
}

/**
 * Si la vista guardada ya no existe (por ejemplo, "sugerencias" dejó de
 * aplicar), se vuelve al paso anterior más cercano que siga vigente. Con
 * strict, ni siquiera el paso actual se sostiene (para lo recuperado).
 */
export function normalizeView(state: ConfiguratorState, strict = false): ConfiguratorView {
  if (state.view === "resumen") return "resumen";
  const steps = stepsFor(state, { sticky: !strict });
  if (steps.includes(state.view)) return state.view;
  return steps[Math.min(steps.length - 1, 2)];
}

export type ConfiguratorAction =
  | { type: "hydrate"; state: ConfiguratorState }
  | { type: "setEventType"; id: string; now: string }
  | { type: "patch"; patch: Partial<ConfiguratorAnswers>; now: string }
  | { type: "toggleService"; id: string; now: string }
  | { type: "toggleCharacter"; id: string; now: string }
  | { type: "toggleExtra"; id: string; now: string }
  | { type: "goTo"; view: ConfiguratorView; now: string }
  | { type: "reset"; now: string };

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function withAnswers(
  state: ConfiguratorState,
  answers: ConfiguratorAnswers,
  now: string
): ConfiguratorState {
  const clean = sanitizeAnswers(answers, state.brand, state.mode);
  const next = { ...state, answers: clean, updatedAt: now };
  return { ...next, view: normalizeView(next) };
}

export function reducer(
  state: ConfiguratorState,
  action: ConfiguratorAction
): ConfiguratorState {
  switch (action.type) {
    case "hydrate": {
      // Lo guardado puede venir incompleto o editado a mano: solo se toma lo que
      // tiene la forma esperada. Marca y modo son siempre los de esta pantalla.
      const saved: Partial<Record<keyof ConfiguratorState, unknown>> =
        action.state && typeof action.state === "object" ? action.state : {};
      const next: ConfiguratorState = {
        ...state,
        answers: sanitizeAnswers(
          saved.answers as ConfiguratorAnswers,
          state.brand,
          state.mode
        ),
        view: isConfiguratorView(saved.view) ? saved.view : state.view,
        startedAt: typeof saved.startedAt === "string" ? saved.startedAt : state.startedAt,
        updatedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : state.updatedAt,
      };
      return { ...next, view: normalizeView(next, true) };
    }
    case "setEventType": {
      const started = state.startedAt ?? action.now;
      const changed = state.answers.eventTypeId !== action.id;
      return withAnswers(
        { ...state, startedAt: started },
        { ...state.answers, eventTypeId: action.id, customEventLabel: changed ? "" : state.answers.customEventLabel },
        action.now
      );
    }
    case "patch":
      return withAnswers(state, { ...state.answers, ...action.patch }, action.now);
    case "toggleService": {
      const serviceIds = toggle(state.answers.serviceIds, action.id);
      const extraServiceIds = state.answers.extraServiceIds.filter(
        (id) => id !== action.id
      );
      return withAnswers(
        state,
        { ...state.answers, serviceIds, extraServiceIds },
        action.now
      );
    }
    case "toggleCharacter":
      return withAnswers(
        state,
        { ...state.answers, characterIds: toggle(state.answers.characterIds, action.id) },
        action.now
      );
    case "toggleExtra":
      return withAnswers(
        state,
        { ...state.answers, extraServiceIds: toggle(state.answers.extraServiceIds, action.id) },
        action.now
      );
    case "goTo":
      return { ...state, view: action.view, updatedAt: action.now };
    case "reset":
      return initialState(state.brand, state.mode, action.now);
  }
}

/** Nombres legibles de los servicios elegidos, en el orden del catálogo. */
export function serviceNames(ids: string[]): string[] {
  return allServices()
    .filter((s) => ids.includes(s.id))
    .sort((a, b) => a.commercialPriority - b.commercialPriority)
    .map((s) => s.name);
}

export function eventLabel(answers: ConfiguratorAnswers): string | null {
  const eventType = getEventType(answers.eventTypeId);
  if (!eventType) return null;
  if (eventType.isOther && answers.customEventLabel.trim()) {
    return answers.customEventLabel.trim();
  }
  return eventType.label;
}
