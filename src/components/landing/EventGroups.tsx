import { ButtonLink } from "@/components/ui/Button";
import { adultCategoryAvailable, eventTypesFor } from "@/lib/audience";
import type { BrandConfig, EventType } from "@/lib/types";
import type { LandingCopy } from "./content";
import { MotifMark } from "./Ornaments";

/** Ancla del acceso a empresas: el hero enlaza acá. */
export const BUSINESS_ANCHOR = "empresas";

export interface EventGroup {
  id: string;
  business: boolean;
  anchor?: string;
  title: string;
  text?: string;
  items: EventType[];
  note?: string;
  cta: { label: string; href: string } | null;
}

/**
 * Arma los grupos de tipos de evento de la marca. Los tipos salen de
 * eventTypesFor en modo general: lo exclusivo para mayores no llega nunca acá.
 * Los grupos sin tipos se descartan.
 */
export function eventGroupsFor(brand: BrandConfig, copy: LandingCopy): EventGroup[] {
  const types = eventTypesFor(brand.id, "general").filter((t) => !t.isOther);
  const adultsExist = adultCategoryAvailable(brand.id);

  return copy.groups
    .map((g) => {
      const business = g.business ? brand.business : null;
      return {
        id: g.id,
        business: Boolean(business),
        anchor: business ? BUSINESS_ANCHOR : undefined,
        title: business ? business.title : g.title,
        text: business ? business.text : g.text,
        items: types.filter(g.match),
        note: adultsExist ? g.noteWhenAdults : undefined,
        cta: business
          ? { label: business.cta, href: `${brand.configuratorPath}?para=empresa` }
          : g.cta
            ? { label: "Armá tu evento", href: brand.configuratorPath }
            : null,
      };
    })
    .filter((g) => g.items.length > 0);
}

/**
 * Para qué eventos trabaja la marca, agrupados para que cada persona se
 * reconozca rápido. En Daale equilibra celebraciones y empresas; en Noche Magik
 * separa las celebraciones de 15 y 18 de las demás fiestas. El grupo de
 * empresas es el acceso a empresas de la marca (brand.business), con enlace
 * directo al configurador en modo empresa (?para=empresa).
 */
export function EventGroups({
  brand,
  copy,
  groups,
}: {
  brand: BrandConfig;
  copy: LandingCopy;
  groups: EventGroup[];
}) {
  if (groups.length === 0) return null;

  // Con dos o más grupos sociales, el de empresas va debajo a lo ancho: se ve,
  // pero no compite con las celebraciones. Con uno solo (Daale), van lado a
  // lado para equilibrar familias y empresas.
  const socialCount = groups.filter((g) => !g.business).length;
  const wideBusiness = socialCount >= 2;
  const columns = wideBusiness
    ? "lg:grid-cols-2"
    : groups.length >= 3
      ? "lg:grid-cols-3"
      : groups.length === 2
        ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        : "";

  return (
    <section aria-labelledby="para-quien-titulo" className="bg-bg-soft py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="para-quien-titulo"
            className={`${copy.display} text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-tight text-balance`}
          >
            {copy.groupsTitle}
          </h2>
          <p className="mt-3 text-lg text-pretty text-ink-muted">{copy.groupsIntro}</p>
        </div>

        <div className={`mt-10 grid items-stretch gap-5 ${columns}`}>
          {groups.map((group) => (
            <GroupPanel
              key={group.id}
              group={group}
              brand={brand}
              copy={copy}
              wide={wideBusiness && group.business}
            />
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-pretty text-ink-muted">{copy.otherNote}</p>
      </div>
    </section>
  );
}

function GroupPanel({
  group,
  brand,
  copy,
  wide,
}: {
  group: EventGroup;
  brand: BrandConfig;
  copy: LandingCopy;
  /** Ocupa toda la fila en desktop: texto y botón a la izquierda, lista a la derecha. */
  wide: boolean;
}) {
  // Listas largas en dos columnas cuando la tarjeta es ancha (container query).
  const listColumns = wide || group.items.length > 4 ? "@lg:grid-cols-2" : "";

  return (
    <div
      id={group.anchor}
      className={`@container relative flex scroll-mt-6 flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-7 ${
        wide
          ? "lg:col-span-full lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:p-8"
          : ""
      }`}
    >
      <div className={wide ? "lg:col-start-1 lg:row-start-1" : ""}>
        <MotifMark
          motif={brand.motif}
          className={`absolute right-5 top-6 sm:right-6 sm:top-7 ${wide ? "lg:static lg:mb-4" : ""}`}
        />
        <h3
          className={`${copy.display} pr-14 text-[1.4rem] leading-snug text-balance text-ink ${wide ? "lg:pr-0" : ""}`}
        >
          {group.title}
        </h3>
        {group.text ? <p className="mt-2 text-pretty text-ink-muted">{group.text}</p> : null}
      </div>

      <ul
        className={`mt-5 grid gap-x-6 ${listColumns} ${
          wide ? "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0" : ""
        }`}
      >
        {group.items.map((eventType) => (
          <li key={eventType.id} className="border-t border-line py-3">
            <span className="block font-semibold text-ink">{eventType.label}</span>
            {eventType.description ? (
              <span className="block text-base text-ink-muted">{eventType.description}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {group.note ? (
        <p
          className={`mt-3 rounded-xl bg-selected-bg px-4 py-3 text-base font-semibold text-ink ${
            wide ? "lg:col-start-2" : ""
          }`}
        >
          {group.note}
        </p>
      ) : null}

      {group.cta ? (
        // En el celular el botón ocupa casi todo el ancho: el WhatsApp flotante
        // se corre mientras pasa por su zona (ver WhatsAppFloat).
        <div
          data-sin-flotante
          className={`mt-auto pt-5 ${wide ? "lg:col-start-1 lg:row-start-2 lg:self-end lg:pt-6" : ""}`}
        >
          <ButtonLink href={group.cta.href} variant="secondary">
            {group.cta.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
