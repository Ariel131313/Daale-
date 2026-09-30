"use client";

import { siteConfig } from "@/config/site";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { FieldMessage, TextArea } from "@/components/ui/Field";
import { hasMedia } from "@/components/ui/Media";
import { charactersFor, getEventType, servicesFor } from "@/lib/audience";
import type { FieldErrors } from "@/lib/configurator/validation";
import type { BrandId, ConfiguratorAnswers, ConfiguratorMode, Service } from "@/lib/types";
import { CARD_GRID, groupServices } from "./flow";

const priceFormat = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function priceBadge(service: Service) {
  if (!siteConfig.flags.showPrices || !service.price) return undefined;
  return (
    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-base font-semibold text-ink">
      Desde {priceFormat.format(service.price.from)}
    </span>
  );
}

export function StepServicios({
  brandId,
  mode,
  answers,
  errors,
  onToggleService,
  onToggleCharacter,
  onPatch,
}: {
  brandId: BrandId;
  mode: ConfiguratorMode;
  answers: ConfiguratorAnswers;
  errors: FieldErrors;
  onToggleService: (id: string) => void;
  onToggleCharacter: (id: string) => void;
  onPatch: (patch: Partial<ConfiguratorAnswers>) => void;
}) {
  const eventType = getEventType(answers.eventTypeId);
  const list = servicesFor(brandId, eventType, mode);
  const groups = groupServices(list, eventType);
  const showCharacters = list.some(
    (s) => s.opensCharacters && answers.serviceIds.includes(s.id)
  );
  const characterList = showCharacters ? charactersFor(brandId, eventType, mode) : [];

  return (
    <div className="flex flex-col gap-10">
      <fieldset
        id="grupo-services"
        aria-describedby={errors.services ? "services-error" : undefined}
        className="min-w-0"
      >
        <legend className="sr-only">Servicios y experiencias</legend>
        <FieldMessage id="services" error={errors.services} />
        <div className="mt-1 flex flex-col gap-9">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`titulo-cat-${group.category}`}>
              <h2
                id={`titulo-cat-${group.category}`}
                className="mb-3.5 font-display text-[1.35rem] font-semibold leading-tight text-ink"
              >
                {group.label}
              </h2>
              <div className={CARD_GRID}>
                {group.items.map((s) => (
                  <ChoiceCard
                    key={s.id}
                    id={`serv-${s.id}`}
                    name="services"
                    type="checkbox"
                    checked={answers.serviceIds.includes(s.id)}
                    onChange={() => onToggleService(s.id)}
                    title={s.name}
                    description={s.shortDescription}
                    image={hasMedia(s.image) ? s.image : undefined}
                    badge={priceBadge(s)}
                    pending={s.pendingConfirmation}
                    compact
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </fieldset>

      {showCharacters && characterList.length > 0 ? (
        <fieldset className="min-w-0 rounded-[var(--radius-card)] border-2 border-line bg-bg-soft p-4 sm:p-6">
          <legend className="sr-only">Personajes</legend>
          <h2 className="font-display text-[1.35rem] font-semibold leading-tight text-ink">
            ¿Qué personajes te gustaría?
          </h2>
          <p className="mb-4 mt-1 text-ink-muted">
            Es opcional. Elegí los que te gusten y confirmamos cuáles están disponibles para tu fecha.
          </p>
          <div className={CARD_GRID}>
            {characterList.map((c) => (
              <ChoiceCard
                key={c.id}
                id={`pers-${c.id}`}
                name="characters"
                type="checkbox"
                checked={answers.characterIds.includes(c.id)}
                onChange={() => onToggleCharacter(c.id)}
                title={c.name}
                description={c.description}
                image={hasMedia(c.image) ? c.image : undefined}
                pending={c.pendingConfirmation}
                compact
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      <TextArea
        id="ideaNotes"
        className="max-w-2xl"
        label="Contanos tu idea"
        hint={
          answers.serviceIds.length > 0
            ? "Si querés sumar un detalle o algo que no está en las opciones, escribilo acá."
            : "Si no encontrás lo que imaginás, escribilo con tus palabras y seguimos desde ahí."
        }
        value={answers.ideaNotes}
        onChange={(e) => onPatch({ ideaNotes: e.target.value })}
        maxLength={600}
        rows={3}
      />
    </div>
  );
}
