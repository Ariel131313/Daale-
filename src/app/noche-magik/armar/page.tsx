import type { Metadata } from "next";
import { Configurator } from "@/components/configurator/Configurator";
import { BrandShell } from "@/components/site/BrandChrome";

export const metadata: Metadata = {
  title: "Armá tu evento · Noche Magik",
  description:
    "Elegí el tipo de fiesta, sumá recepción, shows o animación y mandanos tu consulta ordenada por WhatsApp. Lleva uno o dos minutos.",
};

export default function NocheMagikConfiguratorPage() {
  return (
    <BrandShell brandId="noche-magik" compactHeader>
      <Configurator brandId="noche-magik" mode="general" />
    </BrandShell>
  );
}
