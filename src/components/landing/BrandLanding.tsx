import type { Metadata } from "next";
import { getBrand } from "@/config/brands";
import type { BrandId } from "@/lib/types";
import { AdultsAccess } from "./AdultsAccess";
import { ClosingCta } from "./ClosingCta";
import { landingCopy } from "./content";
import { EventGroups, eventGroupsFor } from "./EventGroups";
import { HowItWorks } from "./HowItWorks";
import { LandingFaq } from "./LandingFaq";
import { LandingHero } from "./LandingHero";
import { LandingView } from "./LandingView";
import { Portfolio } from "./Portfolio";
import { ServiceCategories } from "./ServiceCategories";

/**
 * Landing de una marca. La estructura es la misma para las dos; lo que cambia
 * (logo, colores, tipografía, motivo, textos y catálogo) sale de la
 * configuración de la marca y de data-brand en BrandShell. Cada sección se
 * oculta sola si no tiene contenido.
 */
export function BrandLanding({ brandId }: { brandId: BrandId }) {
  const brand = getBrand(brandId);
  const copy = landingCopy[brandId];
  const groups = eventGroupsFor(brand, copy);
  const businessAnchor = groups.find((g) => g.anchor)?.anchor ?? null;

  return (
    <>
      <LandingView brandId={brandId} />
      <LandingHero brand={brand} copy={copy} businessAnchor={businessAnchor} />
      <HowItWorks brand={brand} copy={copy} />
      <EventGroups brand={brand} copy={copy} groups={groups} />
      <ServiceCategories brand={brand} copy={copy} />
      <Portfolio brand={brand} copy={copy} items={copy.portfolio} />
      <LandingFaq brand={brand} copy={copy} />
      <ClosingCta brand={brand} copy={copy} />
      <AdultsAccess brand={brand} copy={copy} />
    </>
  );
}

/** Metadatos de la landing, tomados de la configuración de la marca. */
export function landingMetadata(brandId: BrandId): Metadata {
  const { metadata, name } = getBrand(brandId);
  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      siteName: name,
      locale: "es_AR",
      type: "website",
    },
  };
}
