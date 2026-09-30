import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Fredoka, Young_Serif } from "next/font/google";
import { ConsentBanner } from "@/components/site/ConsentBanner";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { UtmCapture } from "@/components/site/UtmCapture";
import { siteConfig } from "@/config/site";
import "./globals.css";

const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
  // Next no tiene medidas de esta fuente para ajustar el respaldo: se declara a mano.
  adjustFontFallback: false,
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const youngSerif = Young_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-young-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "¿Qué tipo de evento estás imaginando? · Daale y Noche Magik",
  description:
    "Elegí entre Daale, para celebraciones con personajes y animación, y Noche Magik, para shows y fiestas de noche. Armá tu evento y consultá por WhatsApp.",
  ...(siteConfig.url ? { metadataBase: new URL(siteConfig.url) } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: el scroll suave es para las anclas de una misma
    // página; al cambiar de página Next.js lo desactiva y salta arriba de una.
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${body.variable} ${fredoka.variable} ${youngSerif.variable}`}
    >
      <body>
        <AnchorLink
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:text-ink focus:shadow-lg"
        >
          Saltar al contenido
        </AnchorLink>
        <UtmCapture />
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
