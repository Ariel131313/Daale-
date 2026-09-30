"use client";

import { AnchorLink } from "@/components/ui/AnchorLink";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { FieldMessage, TextField } from "@/components/ui/Field";
import { hasMedia } from "@/components/ui/Media";
import { eventTypesFor } from "@/lib/audience";
import type { FieldErrors } from "@/lib/configurator/validation";
import type { BrandId, ConfiguratorAnswers, ConfiguratorMode } from "@/lib/types";
import { groupHeading } from "./copy";
import { groupEventTypes } from "./flow";

export function StepTipo({
  brandId,
  mode,
  answers,
  errors,
  businessEntry,
  onSelect,
  onPatch,
}: {
  brandId: BrandId;
  mode: ConfiguratorMode;
  answers: ConfiguratorAnswers;
  errors: FieldErrors;
  businessEntry: boolean;
  onSelect: (id: string) => void;
  onPatch: (patch: Partial<ConfiguratorAnswers>) => void;
}) {
  const list = eventTypesFor(brandId, mode);
  const groups = groupEventTypes(list, businessEntry);
  const showBusinessJump =
    !businessEntry && groups.length > 1 && groups[1]?.clientType === "empresa";

  if (list.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border-2 border-dashed border-field-border bg-surface p-5 text-ink">
        Por ahora no hay opciones disponibles en este recorrido. Podés volver a la página de la marca y
        escribirnos por WhatsApp.
      </p>
    );
  }

  return (
    <fieldset
      id="grupo-eventType"
      aria-describedby={errors.eventType ? "eventType-error" : undefined}
      className="min-w-0"
    >
      <legend className="sr-only">Tipo de evento</legend>

      {businessEntry && groups[0]?.clientType === "empresa" ? (
        <p className="mb-5 text-ink-muted">
          Te mostramos primero las opciones para empresas. Si es una celebración particular, las vas a
          encontrar más abajo.
        </p>
      ) : null}

      {showBusinessJump ? (
        <p className="mb-5">
          <AnchorLink
            href="#grupo-empresa"
            className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
          >
            {brandId === "noche-magik"
              ? "¿Es para una empresa o un boliche? Ver esas opciones"
              : "¿Es para una empresa o institución? Ver esas opciones"}
          </AnchorLink>
        </p>
      ) : null}

      <FieldMessage id="eventType" error={errors.eventType} />

      <div className="flex flex-col gap-9">
        {groups.map((group) => {
          const otherSelected = group.items.find(
            (e) => e.isOther && e.id === answers.eventTypeId
          );
          return (
            <section
              key={group.clientType}
              id={`grupo-${group.clientType}`}
              aria-labelledby={`titulo-grupo-${group.clientType}`}
              className="scroll-mt-6"
            >
              <h2
                id={`titulo-grupo-${group.clientType}`}
                className="mb-3.5 font-display text-[1.35rem] font-semibold leading-tight text-ink"
              >
                {groupHeading(brandId, mode, group.clientType)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((e) => (
                  <ChoiceCard
                    key={e.id}
                    id={`tipo-${e.id}`}
                    name="eventType"
                    type="radio"
                    checked={answers.eventTypeId === e.id}
                    onChange={() => onSelect(e.id)}
                    title={e.label}
                    description={e.description}
                    image={hasMedia(e.image) ? e.image : undefined}
                    compact
                  />
                ))}
              </div>
              {otherSelected ? (
                <TextField
                  id="customEventLabel"
                  className="mt-5 max-w-xl"
                  label={group.clientType === "empresa" ? "¿Qué acción es?" : "¿Qué evento es?"}
                  hint="En pocas palabras alcanza."
                  placeholder={
                    group.clientType === "empresa"
                      ? "Por ejemplo, la inauguración de un local"
                      : "Por ejemplo, una fiesta de egresados"
                  }
                  value={answers.customEventLabel}
                  onChange={(ev) => onPatch({ customEventLabel: ev.target.value })}
                  error={errors.customEventLabel}
                  maxLength={80}
                  autoComplete="off"
                />
              ) : null}
            </section>
          );
        })}
      </div>
    </fieldset>
  );
}
