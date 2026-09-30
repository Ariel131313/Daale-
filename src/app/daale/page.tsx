import type { Metadata } from "next";
import { BrandLanding, landingMetadata } from "@/components/landing/BrandLanding";
import { BrandShell } from "@/components/site/BrandChrome";
import { WhatsAppFloat } from "@/components/site/WhatsApp";

export const metadata: Metadata = landingMetadata("daale");

/** Entrada directa de Daale: campañas, Instagram y QR llegan acá sin pasar por la portada. */
export default function DaalePage() {
  return (
    <BrandShell brandId="daale">
      <BrandLanding brandId="daale" />
      <WhatsAppFloat brandId="daale" />
    </BrandShell>
  );
}
