"use client";

import { budgetBandsFor } from "@/config/budgets";
import { useId, useState, type ReactNode } from "react";
import { characters } from "@/config/characters";
import { getBrand } from "@/config/brands";
import { buttonClasses } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { WhatsAppIcon } from "@/components/site/WhatsApp";
import { getEventType } from "@/lib/audience";
import { track } from "@/lib/analytics";
import { eventLabel, serviceNames } from "@/lib/configurator/state";
import { buildLead, noopLeadSink } from "@/lib/lead";
import type { ConfiguratorState, StepId } from "@/lib/types";
import { getUtm } from "@/lib/utm";
import {
  AGE_RANGE_LABELS,
  DURATION_LABELS,
  TIME_SLOT_LABELS,
  buildConfiguratorMessage,
  dateText,
  whatsappUrl,
} from "@/lib/whatsapp";
import { copyText } from "./hooks";
import { SummaryFlourish } from "./Progress";

type Row = { label: string; value: string | null | undefined };

function Rows({ rows }: { rows: Row[] }) {
  const visible = rows.filter((r) => r.value && r.value.trim());
  if (visible.length === 0) return <p className="text-ink-muted">Sin completar.</p>;
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-[minmax(9rem,auto)_1fr]">
      {visible.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-base text-ink-muted">{r.label}</dt>
          <dd className="font-semibold text-ink [overflow-wrap:anywhere] sm:mb-0 mb-1.5">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Block({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: StepId;
  onEdit: (step: StepId) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border-2 border-line bg-surface p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[1.3rem] font-semibold leading-tight text-ink">{title}</h2>
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Editar ${title.toLowerCase()}`}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-field-border px-4 font-semibold text-ink transition-colors hover:border-selected hover:bg-selected-bg"
        >
          Editar
        </button>
      </div>
      {children}
    </section>
  );
}

type CopyStatus = "idle" | "copied" | "failed";

export function Summary({
  state,
  steps,
  onEdit,
}: {
  state: ConfiguratorState;
  steps: StepId[];
  onEdit: (step: StepId) => void;
}) {
  const brand = getBrand(state.brand);
  const a = state.answers;
  const eventType = getEventType(a.eventTypeId);
  const business = Boolean(eventType?.isBusiness);
  const message = buildConfiguratorMessage(state.brand, a, state.mode);
  const url = whatsappUrl(state.brand, message);

  const [showPreview, setShowPreview] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [sent, setSent] = useState(false);
  const previewId = useId();

  const characterNames = characters
    .filter((c) => a.characterIds.includes(c.id))
    .map((c) => c.name)
    .join(", ");
  const budget = budgetBandsFor(state.brand).find((b) => b.id === a.budgetBandId);
  const extras = serviceNames(a.extraServiceIds).join(", ");
  const showExtrasBlock = steps.includes("sugerencias") || extras.length > 0;

  const handleCopy = async () => {
    const ok = await copyText(message);
    setCopyStatus(ok ? "copied" : "failed");
    if (!ok) setShowPreview(true);
  };

  const handleSend = () => {
    const lead = buildLead(state, getUtm(), new Date().toISOString());
    // Punto de integración futuro: hoy no se envía nada a ningún servidor.
    void noopLeadSink.submit(lead);
    track("whatsapp_clicked", {
      brand: state.brand,
      kind: "configurador",
      location: "resumen",
      mode: state.mode,
      event_type: a.eventTypeId ?? undefined,
      client_type: eventType?.clientType,
      services_count: a.serviceIds.length + a.extraServiceIds.length,
    });
    setSent(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BrandLogo
          logo={brand.logos.full}
          height={state.brand === "noche-magik" ? 96 : 64}
          plateClassName="p-2"
        />
        <SummaryFlourish motif={brand.motif} />
      </div>

      <Block title={business ? "La acción" : "El evento"} step="tipo" onEdit={onEdit}>
        <Rows
          rows={[
            { label: "Tipo de evento", value: eventLabel(a) },
            { label: "Empresa o institución", value: business ? a.companyName : null },
          ]}
        />
      </Block>

      <Block title="Lo que querés sumar" step="servicios" onEdit={onEdit}>
        <Rows
          rows={[
            { label: "Servicios", value: serviceNames(a.serviceIds).join(", ") },
            { label: "Personajes", value: characterNames },
            { label: "Tu idea", value: a.ideaNotes },
          ]}
        />
      </Block>

      <Block title={business ? "Datos de la acción" : "Fecha, lugar e invitados"} step="datos" onEdit={onEdit}>
        <Rows
          rows={[
            { label: "Fecha", value: dateText(a) },
            { label: "Horario", value: a.timeSlot ? TIME_SLOT_LABELS[a.timeSlot] : null },
            { label: "Duración", value: a.duration ? DURATION_LABELS[a.duration] : null },
            { label: business ? "Lugar" : "Zona", value: a.location },
            {
              label: business ? "Público estimado" : "Invitados",
              value: a.approximateAttendees.trim() ? `${a.approximateAttendees.trim()} aprox.` : null,
            },
            { label: "Chicos", value: eventType?.asksAgeMix ? a.childrenCount : null },
            { label: "Adultos", value: eventType?.asksAgeMix ? a.adultsCount : null },
            {
              label: "Edad de los chicos",
              value: eventType?.asksAgeMix && a.ageRange ? AGE_RANGE_LABELS[a.ageRange] : null,
            },
            { label: "Objetivo", value: business ? a.businessGoal : null },
          ]}
        />
      </Block>

      {showExtrasBlock ? (
        <Block
          title="Sugerencias sumadas"
          step={steps.includes("sugerencias") ? "sugerencias" : "servicios"}
          onEdit={onEdit}
        >
          {extras ? (
            <Rows rows={[{ label: "Sumaste", value: extras }]} />
          ) : (
            <p className="text-ink-muted">No sumaste ninguna. Está perfecto así.</p>
          )}
        </Block>
      ) : null}

      <Block title="Tus datos" step="confirmar" onEdit={onEdit}>
        <Rows
          rows={[
            { label: "Nombre", value: a.clientName },
            {
              label: "Presupuesto",
              value: budget
                ? budget.isConversation
                  ? "Prefiero conversarlo"
                  : `${budget.label} (orientativo)`
                : null,
            },
            { label: "Notas", value: a.notes },
          ]}
        />
      </Block>

      <section
        aria-labelledby="titulo-envio"
        className="mt-3 rounded-[var(--radius-card)] border-2 border-selected bg-selected-bg p-5 sm:p-7"
      >
        <h2 id="titulo-envio" className="font-display text-[1.45rem] font-semibold leading-tight text-ink">
          {url ? "Mandanos tu evento" : "Tu mensaje está listo"}
        </h2>

        {url ? (
          <>
            <p className="mt-2 max-w-2xl text-ink">
              Al tocar el botón se abre WhatsApp con este resumen ya escrito. Lo revisás, lo enviás vos y
              te respondemos con disponibilidad y una propuesta.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSend}
              className={buttonClasses({ size: "lg", className: "mt-5 w-full sm:w-auto" })}
            >
              <WhatsAppIcon className="size-6" />
              Enviar mi evento por WhatsApp
            </a>
          </>
        ) : (
          <p
            role="status"
            className="mt-3 max-w-2xl rounded-xl border-2 border-dashed border-field-border bg-surface p-4 text-ink"
          >
            <strong>El WhatsApp de {brand.name} todavía no está configurado.</strong> No vamos a abrir
            ningún chat. Podés ver el mensaje que se va a enviar y copiarlo.
          </p>
        )}

        <div aria-live="polite">
          {sent ? (
            <p className="mt-4 max-w-2xl font-semibold text-ink">
              Abrimos WhatsApp con tu mensaje. Si no se abrió, podés copiarlo acá.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            aria-expanded={showPreview}
            aria-controls={previewId}
            onClick={() => setShowPreview((v) => !v)}
            className={buttonClasses({ variant: "secondary" })}
          >
            {showPreview ? "Ocultar el mensaje" : "Ver el mensaje que se va a enviar"}
          </button>
          <button type="button" onClick={handleCopy} className={buttonClasses({ variant: "secondary" })}>
            Copiar mensaje
          </button>
        </div>

        <div aria-live="polite">
          {copyStatus !== "idle" ? (
            <p className="mt-3 font-semibold text-ink">
              {copyStatus === "copied"
                ? "Mensaje copiado. Ya lo podés pegar en un chat."
                : "No pudimos copiarlo solo. Seleccioná el texto de abajo y copialo a mano."}
            </p>
          ) : null}
        </div>

        <div id={previewId} hidden={!showPreview} className="mt-4">
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border-2 border-line bg-surface p-4 font-sans text-base leading-relaxed text-ink [overflow-wrap:anywhere]">
            {message}
          </pre>
        </div>
      </section>
    </div>
  );
}
