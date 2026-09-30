"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { getBrand } from "@/config/brands";
import { siteConfig } from "@/config/site";
import { Button, ButtonLink } from "@/components/ui/Button";
import { getEventType } from "@/lib/audience";
import { track } from "@/lib/analytics";
import {
  initialState,
  isConfiguratorView,
  nextView,
  previousView,
  reducer,
  stepPosition,
  stepsFor,
  type ConfiguratorAction,
} from "@/lib/configurator/state";
import { hasErrors, validateStep, type FieldErrors } from "@/lib/configurator/validation";
import { clearConfigurator, loadConfigurator, saveConfigurator } from "@/lib/storage";
import type {
  BrandId,
  ConfiguratorAnswers,
  ConfiguratorMode,
  ConfiguratorState,
  ConfiguratorView,
  StepId,
} from "@/lib/types";
import { FIELD_ORDER, STEP_NAMES, stepCopy } from "./copy";
import { ERROR_TARGETS, firstInvalidStep, reachableView } from "./flow";
import { useBusinessEntry } from "./hooks";
import { StepProgress } from "./Progress";
import { StepConfirmar } from "./StepConfirmar";
import { StepDatos } from "./StepDatos";
import { StepServicios } from "./StepServicios";
import { StepSugerencias } from "./StepSugerencias";
import { StepTipo } from "./StepTipo";
import { Summary } from "./Summary";

/**
 * Último estado de historial que dejó Next (con __NA y su árbol de rutas). Si
 * una entrada llega sin él (por ejemplo, después de un ancla «#» escrita a mano
 * en la dirección), se reusa: sin esas claves, el botón Atrás de Next recarga
 * la página entera.
 */
let lastRouterState: Record<string, unknown> = {};

/** Entrada del historial con la vista del configurador, sin pisar la de Next. */
function historyEntry(view: ConfiguratorView): Record<string, unknown> {
  const current: unknown = window.history.state;
  if (current && typeof current === "object") {
    const routerState = { ...(current as Record<string, unknown>) };
    delete routerState.dnmView;
    lastRouterState = routerState;
  }
  return { ...lastRouterState, dnmView: view };
}

/** Tipo de evento elegido en el paso 1 que todavía no se confirmó con «Continuar». */
interface TypeDraft {
  typeId: string;
  label: string;
}

interface LocalState {
  config: ConfiguratorState;
  /** Se recuperaron respuestas guardadas y todavía no se cambió de paso. */
  restored: boolean;
}

/** Envuelve el reducer compartido para recordar si se recuperaron respuestas. */
function localReducer(current: LocalState, action: ConfiguratorAction): LocalState {
  const config = reducer(current.config, action);
  if (action.type === "hydrate") {
    return { config, restored: Boolean(config.answers.eventTypeId) };
  }
  if (action.type === "goTo" || action.type === "reset") {
    return { config, restored: false };
  }
  return { config, restored: current.restored };
}

function prefersReducedMotion(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Configurador visual progresivo. Un mismo motor para las dos marcas y para el
 * recorrido de mayores: qué se ofrece lo deciden las funciones de
 * lib/audience.ts según la marca, el modo y el tipo de evento.
 */
export function Configurator({ brandId, mode }: { brandId: BrandId; mode: ConfiguratorMode }) {
  const brand = getBrand(brandId);
  const [local, dispatch] = useReducer(localReducer, undefined, () => ({
    config: initialState(brandId, mode, ""),
    restored: false,
  }));
  const state = local.config;
  const restored = local.restored;
  const businessEntry = useBusinessEntry();

  /** Intento de avanzar con errores: desde ahí los mensajes se ven y se actualizan. */
  const [attempt, setAttempt] = useState<{ view: ConfiguratorView; at: number } | null>(null);
  /** Se entró a un paso con «Editar» desde el resumen. */
  const [returnToSummary, setReturnToSummary] = useState(false);
  /**
   * En el paso 1, elegir otro tipo (con el mouse o recorriendo con las flechas)
   * no cambia nada hasta tocar «Continuar»: recién ahí se ajusta lo que el
   * nuevo tipo no admite. Así recorrer las opciones nunca borra datos.
   */
  const [draft, setDraft] = useState<TypeDraft | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef(false);
  const stateRef = useRef(state);
  const initialViewRef = useRef<ConfiguratorView>("tipo");
  const pathRef = useRef<string | null>(null);
  const completedRef = useRef(false);

  // Recupera las respuestas guardadas después de montar: el HTML estático y la
  // primera pintura del cliente coinciden, y recién después aparece lo guardado.
  useEffect(() => {
    pathRef.current = window.location.pathname;
    const saved = loadConfigurator(brandId, mode, Date.now());
    let view: ConfiguratorView = "tipo";
    if (saved) {
      const probe = reducer(initialState(brandId, mode, saved.updatedAt), {
        type: "hydrate",
        state: saved,
      });
      view = reachableView(probe, probe.view, new Date());
      dispatch({ type: "hydrate", state: { ...saved, view } });
    }
    initialViewRef.current = view;
    try {
      window.history.replaceState(historyEntry(view), "");
    } catch {
      // Sin historial manipulable, el botón atrás simplemente sale de la página.
    }
  }, [brandId, mode]);

  // Guarda en cada cambio. Sin nada elegido no queda nada guardado.
  useEffect(() => {
    stateRef.current = state;
    if (!state.updatedAt) return;
    if (!state.startedAt && !state.answers.eventTypeId && state.view === "tipo") {
      clearConfigurator(state.brand, state.mode);
      return;
    }
    saveConfigurator(state, Date.now());
  }, [state]);

  // Al cambiar de paso: foco en el título y scroll al comienzo del configurador.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    headingRef.current?.focus({ preventScroll: true });
    const root = rootRef.current;
    if (root) {
      const top = root.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [state.view, state.updatedAt]);

  // El botón atrás del navegador recorre los pasos en vez de salir del configurador.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const data: unknown = event.state;
      if (!data || typeof data !== "object") {
        // Navegación a un ancla «#» de esta misma página: no es un cambio de
        // paso. Se vuelve a sellar la entrada para que Atrás siga funcionando.
        if (window.location.pathname === pathRef.current) {
          try {
            window.history.replaceState(historyEntry(stateRef.current.view), "");
          } catch {
            // Sin historial manipulable no hay nada que sellar.
          }
        }
        return;
      }
      const stored = (data as Record<string, unknown>).dnmView;
      let requested: ConfiguratorView;
      if (isConfiguratorView(stored)) {
        requested = stored;
      } else if (window.location.pathname === pathRef.current) {
        requested = initialViewRef.current;
      } else {
        return;
      }
      const view = reachableView(stateRef.current, requested, new Date());
      pendingFocus.current = true;
      setDraft(null);
      setAttempt(null);
      setReturnToSummary(false);
      setConfirmReset(false);
      dispatch({ type: "goTo", view, now: new Date().toISOString() });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const view = state.view;
  /** El estado como quedaría con el borrador del paso 1 confirmado. */
  const withDraft = (d: TypeDraft | null, at: string): ConfiguratorState => {
    if (!d) return state;
    const typed = reducer(state, { type: "setEventType", id: d.typeId, now: at });
    return reducer(typed, { type: "patch", patch: { customEventLabel: d.label }, now: at });
  };
  // Lo que se ve: con el tipo elegido aunque todavía no esté confirmado, así el
  // «Paso X de Y» y el campo de «Otro» responden en el momento.
  const shown = view === "tipo" ? withDraft(draft, state.updatedAt) : state;
  const answers = shown.answers;
  const eventType = getEventType(answers.eventTypeId);
  const steps = stepsFor(shown);

  const errors: FieldErrors =
    attempt && attempt.view === view && view !== "resumen"
      ? validateStep(view, answers, new Date(attempt.at))
      : {};
  const showErrorNote = hasErrors(errors);

  // ---------- Navegación ----------

  const navigate = (target: ConfiguratorView) => {
    pendingFocus.current = true;
    setDraft(null);
    setAttempt(null);
    setConfirmReset(false);
    dispatch({ type: "goTo", view: target, now: new Date().toISOString() });
    try {
      window.history.pushState(historyEntry(target), "");
    } catch {
      // Sin historial, la navegación interna sigue funcionando igual.
    }
    if (target === "resumen" && !completedRef.current) {
      completedRef.current = true;
      track("configuration_completed", {
        brand: brandId,
        mode,
        event_type: answers.eventTypeId ?? undefined,
        client_type: eventType?.clientType,
        services_count: answers.serviceIds.length,
        characters_count: answers.characterIds.length,
        extras_count: answers.extraServiceIds.length,
        has_date: answers.dateStatus !== "sin-definir" && Boolean(answers.eventDate),
        has_budget: Boolean(answers.budgetBandId),
      });
    }
  };

  const focusFirstError = (found: FieldErrors) => {
    requestAnimationFrame(() => {
      for (const key of FIELD_ORDER) {
        if (!found[key]) continue;
        const el = document.querySelector<HTMLElement>(ERROR_TARGETS[key] ?? `#${key}`);
        if (el) {
          el.focus({ preventScroll: true });
          el.scrollIntoView({
            block: "center",
            behavior: prefersReducedMotion() ? "auto" : "smooth",
          });
          return;
        }
      }
    });
  };

  /** Confirma el tipo elegido en el paso 1 y registra el comienzo en la analítica. */
  const commitDraft = (d: TypeDraft, at: string) => {
    const next = getEventType(d.typeId);
    if (!state.startedAt) track("configurator_started", { brand: brandId, mode });
    if (next && next.clientType !== getEventType(state.answers.eventTypeId)?.clientType) {
      track("client_type_selected", { brand: brandId, mode, client_type: next.clientType });
    }
    dispatch({ type: "setEventType", id: d.typeId, now: at });
    dispatch({ type: "patch", patch: { customEventLabel: d.label }, now: at });
  };

  const handleContinue = () => {
    if (view === "resumen") return;
    const now = new Date();
    const found = validateStep(view, answers, now);
    if (hasErrors(found)) {
      setAttempt({ view, at: now.getTime() });
      focusFirstError(found);
      return;
    }
    // El estado con el tipo ya confirmado: de ahí salen el paso siguiente y lo
    // que falta completar.
    const confirming = view === "tipo" && draft ? draft : null;
    const base = confirming ? withDraft(confirming, now.toISOString()) : state;
    if (confirming) commitDraft(confirming, now.toISOString());
    if (returnToSummary) {
      const missing = firstInvalidStep(base, now);
      if (missing && missing !== view) {
        navigate(missing);
        setAttempt({ view: missing, at: now.getTime() });
        return;
      }
      setReturnToSummary(false);
      navigate("resumen");
      return;
    }
    navigate(nextView(base));
  };

  const handleBack = () => {
    const previous = previousView(state);
    if (previous) navigate(previous);
  };

  const handleEdit = (step: StepId) => {
    setReturnToSummary(true);
    navigate(step);
  };

  // ---------- Respuestas ----------

  const now = () => new Date().toISOString();

  const handleSelectType = (id: string) => {
    // Volver al tipo ya confirmado deja todo como estaba, texto de «Otro» incluido.
    if (id === state.answers.eventTypeId) {
      setDraft(null);
      return;
    }
    setDraft((current) => ({ typeId: id, label: current?.typeId === id ? current.label : "" }));
  };

  const handlePatch = (patch: Partial<ConfiguratorAnswers>) => {
    // El texto de «Otro» de un tipo todavía no confirmado vive en el borrador.
    if (draft && patch.customEventLabel !== undefined) {
      const { customEventLabel, ...rest } = patch;
      setDraft({ ...draft, label: customEventLabel });
      if (Object.keys(rest).length === 0) return;
      dispatch({ type: "patch", patch: rest, now: now() });
      return;
    }
    dispatch({ type: "patch", patch, now: now() });
  };

  const handleToggleService = (id: string) => {
    if (!answers.serviceIds.includes(id)) {
      track("service_selected", {
        brand: brandId,
        mode,
        service_id: id,
        event_type: answers.eventTypeId ?? undefined,
        source: "servicios",
      });
    }
    dispatch({ type: "toggleService", id, now: now() });
  };

  const handleToggleCharacter = (id: string) => {
    if (!answers.characterIds.includes(id)) {
      track("character_selected", {
        brand: brandId,
        mode,
        character_id: id,
        event_type: answers.eventTypeId ?? undefined,
      });
    }
    dispatch({ type: "toggleCharacter", id, now: now() });
  };

  const handleToggleExtra = (id: string) => {
    if (!answers.extraServiceIds.includes(id)) {
      track("service_selected", {
        brand: brandId,
        mode,
        service_id: id,
        event_type: answers.eventTypeId ?? undefined,
        source: "sugerencias",
      });
    }
    dispatch({ type: "toggleExtra", id, now: now() });
  };

  const openResetConfirm = () => {
    setConfirmReset(true);
    requestAnimationFrame(() => resetCancelRef.current?.focus());
  };

  const cancelReset = () => {
    setConfirmReset(false);
    requestAnimationFrame(() => resetTriggerRef.current?.focus());
  };

  const handleReset = () => {
    clearConfigurator(brandId, mode);
    completedRef.current = false;
    initialViewRef.current = "tipo";
    pendingFocus.current = true;
    setDraft(null);
    setConfirmReset(false);
    setReturnToSummary(false);
    setAttempt(null);
    dispatch({ type: "reset", now: now() });
    try {
      window.history.replaceState(historyEntry("tipo"), "");
    } catch {
      // Nada que actualizar.
    }
  };

  // ---------- Textos de la vista ----------

  const isSummary = view === "resumen";
  const position = isSummary ? null : stepPosition(shown, view);
  const copy = isSummary ? null : stepCopy(view, mode, eventType);
  const title = copy ? copy.title : brand.summaryTitle;
  const intro = copy
    ? copy.intro
    : "Revisá que esté todo bien. Podés editar cualquier parte antes de mandarla.";
  const narrow = view === "datos" || view === "confirmar" || isSummary;
  const hasPrevious = previousView(shown) !== null;

  let continueLabel = "Continuar";
  if (returnToSummary) continueLabel = "Guardar y volver al resumen";
  else if (view === "confirmar") continueLabel = "Ver el resumen";
  else if (view === "sugerencias" && answers.extraServiceIds.length === 0) {
    continueLabel = "Continuar sin sumar";
  }

  const started = Boolean(state.startedAt || state.answers.eventTypeId);
  const selectedCount = answers.serviceIds.length;

  return (
    <div ref={rootRef} className="bg-bg">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10">
        {mode === "adults-only" ? (
          <p className="mb-5 inline-flex min-h-9 items-center rounded-full border-2 border-accent-2 bg-surface px-3.5 text-base font-semibold text-ink">
            Recorrido solo para mayores de 18
          </p>
        ) : null}

        <div className="max-w-xl">
          <StepProgress
            motif={brand.motif}
            number={position ? position.number : steps.length}
            total={steps.length}
            stepName={isSummary ? "Resumen" : STEP_NAMES[view as StepId]}
            complete={isSummary}
          />
        </div>

        <div className={narrow ? "max-w-3xl" : ""}>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-7 font-display text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] font-semibold leading-[1.08] text-ink sm:mt-9"
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[1.0625rem] text-ink-muted">{intro}</p>

          {restored ? (
            <p
              role="status"
              className="mt-5 max-w-2xl rounded-xl border-2 border-line bg-surface px-4 py-3 text-ink"
            >
              Seguís donde lo dejaste: recuperamos tus respuestas de la última vez.
            </p>
          ) : null}

          <div className="mt-8 sm:mt-10">
            {view === "tipo" ? (
              <StepTipo
                brandId={brandId}
                mode={mode}
                answers={answers}
                errors={errors}
                businessEntry={businessEntry}
                onSelect={handleSelectType}
                onPatch={handlePatch}
              />
            ) : null}
            {view === "servicios" ? (
              <StepServicios
                brandId={brandId}
                mode={mode}
                answers={answers}
                errors={errors}
                onToggleService={handleToggleService}
                onToggleCharacter={handleToggleCharacter}
                onPatch={handlePatch}
              />
            ) : null}
            {view === "datos" ? (
              <StepDatos answers={answers} errors={errors} onPatch={handlePatch} />
            ) : null}
            {view === "sugerencias" ? (
              <StepSugerencias
                brandId={brandId}
                mode={mode}
                answers={answers}
                onToggleExtra={handleToggleExtra}
              />
            ) : null}
            {view === "confirmar" ? (
              <StepConfirmar
                brandId={brandId}
                answers={answers}
                errors={errors}
                onPatch={handlePatch}
              />
            ) : null}
            {isSummary ? <Summary state={state} steps={steps} onEdit={handleEdit} /> : null}
          </div>

          <div className="mt-10 border-t-2 border-line pt-6">
            {showErrorNote ? (
              <p role="alert" className="mb-4 font-semibold text-error">
                Revisá lo marcado arriba para seguir.
              </p>
            ) : null}
            <div aria-live="polite">
              {view === "servicios" && selectedCount > 0 ? (
                <p className="mb-4 text-ink-muted">
                  {selectedCount === 1 ? "Elegiste 1 opción." : `Elegiste ${selectedCount} opciones.`}
                </p>
              ) : null}
            </div>

            <div
              className={`gap-3 ${
                isSummary ? "flex" : "grid grid-cols-[auto_1fr] sm:flex sm:items-center sm:justify-between"
              }`}
            >
              {hasPrevious ? (
                <Button variant="secondary" size="lg" onClick={handleBack}>
                  Volver
                </Button>
              ) : (
                <ButtonLink href={brand.path} variant="secondary" size="lg">
                  Volver
                </ButtonLink>
              )}
              {!isSummary ? (
                <Button size="lg" onClick={handleContinue} className="sm:min-w-60">
                  {continueLabel}
                </Button>
              ) : null}
            </div>
          </div>

          {started ? (
            <div className="mt-10">
              {confirmReset ? (
                <div
                  role="group"
                  aria-labelledby="pregunta-borrar"
                  className="max-w-xl rounded-xl border-2 border-dashed border-field-border bg-surface p-4 sm:p-5"
                >
                  <p id="pregunta-borrar" className="font-semibold text-ink">
                    ¿Borramos todas tus respuestas? No se puede deshacer.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <Button variant="secondary" onClick={handleReset}>
                      Sí, borrar todo
                    </Button>
                    <button
                      ref={resetCancelRef}
                      type="button"
                      onClick={cancelReset}
                      className="inline-flex min-h-11 items-center px-2 font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
                    >
                      No, seguir con mi evento
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  ref={resetTriggerRef}
                  type="button"
                  onClick={openResetConfirm}
                  className="inline-flex min-h-11 items-center font-semibold text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink hover:decoration-4"
                >
                  Borrar respuestas y empezar de nuevo
                </button>
              )}
              <p className="mt-1 max-w-xl text-base text-ink-muted">
                {mode === "adults-only" ? (
                  "Tus respuestas quedan solo en esta pestaña y se borran al cerrarla."
                ) : (
                  <>
                    Tus respuestas quedan guardadas solo en este navegador, hasta{" "}
                    {siteConfig.storage.ttlDays} días, para que puedas seguir más tarde.
                  </>
                )}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
