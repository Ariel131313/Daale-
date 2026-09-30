import type { Metadata } from "next";
import { BrandLanding, landingMetadata } from "@/components/landing/BrandLanding";
import { BrandShell } from "@/components/site/BrandChrome";
import { WhatsAppFloat } from "@/components/site/WhatsApp";

export const metadata: Metadata = landingMetadata("noche-magik");

/** Entrada directa de Noche Magik: campañas, Instagram y QR llegan acá sin pasar por la portada. */
export default function NocheMagikPage() {
  return (
    <BrandShell brandId="noche-magik">
      <BrandLanding brandId="noche-magik" />
      <WhatsAppFloat brandId="noche-magik" />
    </BrandShell>
  );
}
