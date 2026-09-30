"use client";

import { useState } from "react";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { hasMedia } from "@/components/ui/Media";
import { extrasFor, getEventType, recommendationsFor, servicesFor } from "@/lib/audience";
import type { BrandId, ConfiguratorAnswers, ConfiguratorMode } from "@/lib/types";
import { CARD_GRID } from "./flow";

/**
 * Sugerencias opcionales. Cada una explica por qué aparece y se suma con un
 * toque; nunca se dice que el servicio esté disponible. Lo que ya se sumó sigue
 * en la lista, marcado, aunque la sugerencia haya dejado de aplicar: así
 * siempre se puede sacar desde acá. Mientras se está en el paso, lo destildado
 * no desaparece (el foco no se pierde y se puede volver a marcar).
 */
export function StepSugerencias({
  brandId,
  mode,
  answers,
  onToggleExtra,
}: {
  brandId: BrandId;
  mode: ConfiguratorMode;
  answers: ConfiguratorAnswers;
  onToggleExtra: (id: string) => void;
}) {
  const list = recommendationsFor(brandId, answers, mode);
  const suggested = new Set(list.map((r) => r.service.id));
  // Lo sumado cuya sugerencia ya no aplica, tal como estaba al entrar al paso.
  const [keptIds] = useState(() =>
    extrasFor(brandId, answers, mode)
      .filter((s) => !suggested.has(s.id))
      .map((s) => s.id)
  );
  const kept = servicesFor(brandId, getEventType(answers.eventTypeId), mode).filter(
    (s) => keptIds.includes(s.id) && !suggested.has(s.id)
  );

  if (list.length === 0 && kept.length === 0) {
    return <p className="text-ink-muted">No hay sugerencias para este evento. Podés continuar.</p>;
  }

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Sugerencias para sumar</legend>
      <div className={CARD_GRID}>
        {list.map(({ recommendation, service }) => (
          <ChoiceCard
            key={recommendation.id}
            id={`extra-${service.id}`}
            name="extras"
            type="checkbox"
            checked={answers.extraServiceIds.includes(service.id)}
            onChange={() => onToggleExtra(service.id)}
            title={service.name}
            description={recommendation.reason}
            image={hasMedia(service.image) ? service.image : undefined}
            pending={service.pendingConfirmation}
            compact
          />
        ))}
        {kept.map((service) => (
          <ChoiceCard
            key={service.id}
            id={`extra-${service.id}`}
            name="extras"
            type="checkbox"
            checked={answers.extraServiceIds.includes(service.id)}
            onChange={() => onToggleExtra(service.id)}
            title={service.name}
            description={service.shortDescription}
            image={hasMedia(service.image) ? service.image : undefined}
            pending={service.pendingConfirmation}
            compact
          />
        ))}
      </div>
      <p className="mt-5 text-base text-ink-muted">
        Sumarlas no reserva nada: las incluimos en tu consulta para conversarlas por WhatsApp.
      </p>
    </fieldset>
  );
}
