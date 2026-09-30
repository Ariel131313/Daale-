"use client";

import { budgetBandsFor } from "@/config/budgets";
import { PillGroup, TextArea, TextField } from "@/components/ui/Field";
import { getEventType } from "@/lib/audience";
import type { FieldErrors } from "@/lib/configurator/validation";
import type { BrandId, ConfiguratorAnswers } from "@/lib/types";

export function StepConfirmar({
  brandId,
  answers,
  errors,
  onPatch,
}: {
  brandId: BrandId;
  answers: ConfiguratorAnswers;
  errors: FieldErrors;
  onPatch: (patch: Partial<ConfiguratorAnswers>) => void;
}) {
  const business = Boolean(getEventType(answers.eventTypeId)?.isBusiness);
  const bands = budgetBandsFor(brandId).map((b) => ({ value: b.id, label: b.label }));

  return (
    <div className="flex flex-col gap-9">
      <TextField
        id="clientName"
        className="max-w-md"
        label="Tu nombre"
        hint={
          business
            ? "Con quién hablamos. Si querés, sumá tu cargo en las notas."
            : "Para saber cómo llamarte cuando te respondamos."
        }
        value={answers.clientName}
        onChange={(e) => onPatch({ clientName: e.target.value })}
        error={errors.clientName}
        autoComplete="name"
        maxLength={80}
      />

      {bands.length > 0 ? (
        <div>
          <PillGroup<string>
            id="budgetBandId"
            legend="Presupuesto orientativo"
            optional
            hint="Nos ayuda a armar una propuesta a tu medida. No es una cotización ni un compromiso."
            options={bands}
            value={answers.budgetBandId}
            onChange={(budgetBandId) => onPatch({ budgetBandId })}
          />
          {answers.budgetBandId ? (
            <button
              type="button"
              onClick={() => onPatch({ budgetBandId: null })}
              className="mt-2 inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              Prefiero no indicar presupuesto
            </button>
          ) : null}
        </div>
      ) : null}

      <TextArea
        id="notes"
        className="max-w-2xl"
        label="¿Algo más que quieras contarnos?"
        optional
        hint={
          business
            ? "Horarios de armado, accesos, identidad de la marca o lo que sirva para la propuesta."
            : "Un tema preferido, una sorpresa o lo que te parezca importante."
        }
        value={answers.notes}
        onChange={(e) => onPatch({ notes: e.target.value })}
        maxLength={600}
        rows={3}
      />
    </div>
  );
}
