import type { Metadata } from "next";
import { AdultsGate } from "@/components/adultos/AdultsGate";
import { AdultsUnavailable } from "@/components/adultos/AdultsUnavailable";
import { BrandShell } from "@/components/site/BrandChrome";
import { adultCategoryAvailable } from "@/lib/audience";

/**
 * Recorrido separado para eventos privados de mayores de 18.
 *
 * No se enlaza desde la portada, desde Daale ni desde el configurador general;
 * no figura en el sitemap, robots.txt lo excluye y la página pide no ser
 * indexada. Con el flag apagado (siteConfig.flags.enableAdultCategory) solo
 * muestra un aviso sobrio de sección no disponible.
 */
const available = adultCategoryAvailable("noche-magik");

export const metadata: Metadata = {
  title: available
    ? "Eventos para mayores de 18 · Noche Magik"
    : "Sección no disponible · Noche Magik",
  description: available
    ? "Recorrido separado de Noche Magik para eventos privados de mayores de 18."
    : "Esta sección de Noche Magik no está disponible.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function MayoresPage() {
  return (
    // En el recorrido, el header compacto no repite el WhatsApp directo, igual
    // que en el configurador general.
    <BrandShell brandId="noche-magik" compactHeader={available}>
      {available ? <AdultsGate /> : <AdultsUnavailable />}
    </BrandShell>
  );
}
