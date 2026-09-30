import type { Metadata } from "next";
import { Configurator } from "@/components/configurator/Configurator";
import { BrandShell } from "@/components/site/BrandChrome";

export const metadata: Metadata = {
  title: "Armá tu evento · Daale",
  description:
    "Elegí el tipo de evento, sumá personajes, animación o deco y mandanos tu consulta ordenada por WhatsApp. Lleva uno o dos minutos.",
};

export default function DaaleConfiguratorPage() {
  return (
    <BrandShell brandId="daale" compactHeader>
      <Configurator brandId="daale" mode="general" />
    </BrandShell>
  );
}
