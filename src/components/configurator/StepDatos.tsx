"use client";

import { Checkbox, PillGroup, TextArea, TextField } from "@/components/ui/Field";
import { getEventType } from "@/lib/audience";
import type { FieldErrors } from "@/lib/configurator/validation";
import type { AgeRange, ConfiguratorAnswers, DurationOption, TimeSlot } from "@/lib/types";
import { AGE_RANGE_LABELS, DURATION_LABELS, TIME_SLOT_LABELS } from "@/lib/whatsapp";
import { useTodayISO } from "./hooks";

function options<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

const timeOptions = options<TimeSlot>(TIME_SLOT_LABELS);
const durationOptions = options<DurationOption>(DURATION_LABELS);
const ageOptions = options<AgeRange>(AGE_RANGE_LABELS);

/** Solo dígitos: los números se guardan como texto, tal cual se escribieron. */
const numberProps = {
  inputMode: "numeric" as const,
  pattern: "[0-9]*",
  autoComplete: "off",
  maxLength: 5,
};

export function StepDatos({
  answers,
  errors,
  onPatch,
}: {
  answers: ConfiguratorAnswers;
  errors: FieldErrors;
  onPatch: (patch: Partial<ConfiguratorAnswers>) => void;
}) {
  const eventType = getEventType(answers.eventTypeId);
  const business = Boolean(eventType?.isBusiness);
  const today = useTodayISO();
  const undefinedDate = answers.dateStatus === "sin-definir";
  const dateQuestion = business ? "¿Cuándo sería la acción?" : "¿Cuándo es?";

  return (
    <div className="flex flex-col gap-9">
      {business ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="companyName"
            label="Empresa o institución"
            optional
            value={answers.companyName}
            onChange={(e) => onPatch({ companyName: e.target.value })}
            autoComplete="organization"
            maxLength={100}
          />
          <TextArea
            id="businessGoal"
            className="sm:col-span-2"
            label="¿Qué buscan con la acción?"
            optional
            hint="Por ejemplo, recibir al público en un fin de semana largo o acompañar un lanzamiento."
            value={answers.businessGoal}
            onChange={(e) => onPatch({ businessGoal: e.target.value })}
            maxLength={400}
            rows={2}
          />
        </div>
      ) : null}

      <fieldset className="min-w-0">
        <legend className="sr-only">Fecha</legend>
        <div className="flex flex-col gap-3">
          {!undefinedDate ? (
            <TextField
              id="eventDate"
              type="date"
              className="max-w-xs"
              label={dateQuestion}
              min={today || undefined}
              value={answers.eventDate}
              onChange={(e) =>
                onPatch({
                  eventDate: e.target.value,
                  dateStatus: answers.dateStatus === "tentativa" ? "tentativa" : "exacta",
                })
              }
              error={errors.eventDate}
            />
          ) : (
            <p className="text-ink-muted">
              <span className="mb-2 block font-semibold text-ink">{dateQuestion}</span>
              Perfecto, la fecha la vemos después. Si ya tenés una idea aproximada, la podés contar en
              las notas del último paso.
            </p>
          )}
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <Checkbox
              id="dateUndefined"
              label="Todavía no la definí"
              checked={undefinedDate}
              onChange={(checked) =>
                onPatch({ dateStatus: checked ? "sin-definir" : "exacta" })
              }
            />
            {!undefinedDate ? (
              <Checkbox
                id="dateTentative"
                label="Es una fecha tentativa"
                checked={answers.dateStatus === "tentativa"}
                onChange={(checked) => onPatch({ dateStatus: checked ? "tentativa" : "exacta" })}
              />
            ) : null}
          </div>
        </div>
      </fieldset>

      <PillGroup<TimeSlot>
        id="timeSlot"
        legend="¿En qué horario?"
        optional
        options={timeOptions}
        value={answers.timeSlot}
        onChange={(timeSlot) => onPatch({ timeSlot })}
      />

      <PillGroup<DurationOption>
        id="duration"
        legend="¿Cuánto tiempo te imaginás?"
        optional
        options={durationOptions}
        value={answers.duration}
        onChange={(duration) => onPatch({ duration })}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="location"
          label={business ? "Lugar o localidad" : "Zona o localidad"}
          optional
          placeholder={business ? "Dirección, local o localidad" : "Barrio, departamento o salón"}
          value={answers.location}
          onChange={(e) => onPatch({ location: e.target.value })}
          autoComplete="off"
          maxLength={100}
        />
        <TextField
          id="approximateAttendees"
          label={business ? "Público estimado" : "Invitados aproximados"}
          optional
          hint={
            business
              ? "Cuántas personas esperan, aunque sea a ojo."
              : "Un número aproximado alcanza."
          }
          value={answers.approximateAttendees}
          onChange={(e) => onPatch({ approximateAttendees: e.target.value })}
          error={errors.approximateAttendees}
          {...numberProps}
        />
      </div>

      {eventType?.asksAgeMix ? (
        <fieldset className="min-w-0 rounded-[var(--radius-card)] border-2 border-line bg-bg-soft p-4 sm:p-6">
          <legend className="sr-only">Chicos y adultos</legend>
          <h2 className="font-display text-[1.35rem] font-semibold leading-tight text-ink">
            ¿Cuántos chicos y cuántos adultos?
          </h2>
          <p className="mb-5 mt-1 text-ink-muted">
            Es opcional y nos ayuda a pensar los juegos. No te pedimos nombres ni datos de los chicos.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              id="childrenCount"
              label="Chicos"
              optional
              value={answers.childrenCount}
              onChange={(e) => onPatch({ childrenCount: e.target.value })}
              error={errors.childrenCount}
              {...numberProps}
            />
            <TextField
              id="adultsCount"
              label="Adultos"
              optional
              value={answers.adultsCount}
              onChange={(e) => onPatch({ adultsCount: e.target.value })}
              error={errors.adultsCount}
              {...numberProps}
            />
          </div>
          <div className="mt-6">
            <PillGroup<AgeRange>
              id="ageRange"
              legend="Edad aproximada de los chicos"
              optional
              options={ageOptions}
              value={answers.ageRange}
              onChange={(ageRange) => onPatch({ ageRange })}
            />
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
