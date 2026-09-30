import type { Metadata } from "next";
import { BrandChoiceCard } from "@/components/home/BrandChoiceCard";
import { HomeAnalytics } from "@/components/home/HomeAnalytics";
import { HomeFooter } from "@/components/home/HomeFooter";
import styles from "@/components/home/home.module.css";
import { brandList } from "@/config/brands";
import { siteConfig } from "@/config/site";

const question = "¿Qué tipo de evento estás imaginando?";

// Título y descripción vienen de layout.tsx. Acá se suma la vista previa que
// muestran WhatsApp e Instagram cuando alguien comparte el enlace de la raíz.
export const metadata: Metadata = {
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: siteConfig.name,
    title: question,
    description: brandList.map((b) => `${b.name}: ${b.chooserLine.toLowerCase()}.`).join(" "),
  },
};

/**
 * Portada neutral: una pregunta, dos marcas y nada que decidir por la persona.
 * Sin redirecciones por hora, edad ni campaña: las campañas entran directo a
 * /daale o /noche-magik.
 */
export default function Home() {
  return (
    <div data-brand="root" className={`${styles.sky} flex min-h-dvh flex-col text-ink`}>
      <HomeAnalytics />

      <main id="contenido" className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] font-semibold leading-[1.08] text-balance">
              {question}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-balance text-ink-muted">
              Elegí una opción y armá tu consulta en pocos pasos. Te respondemos por WhatsApp.
            </p>
          </div>

          <ul className="mt-7 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 md:gap-6 lg:mt-12 lg:gap-8">
            {brandList.map((brand) => (
              <li key={brand.id}>
                <BrandChoiceCard brand={brand} />
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-8 max-w-xl text-center text-balance text-ink-muted lg:mt-10">
            ¿Dudás? Entrá a la que más se acerque a tu idea. Siempre podés volver y cambiar.
          </p>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
