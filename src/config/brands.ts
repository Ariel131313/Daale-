import type { BrandConfig, BrandId } from "@/lib/types";

/**
 * Números de WhatsApp en formato internacional (54 9 + característica + número).
 * Los informó el cliente; confirmarlos antes de publicar. Se pueden reemplazar
 * por variables de entorno sin tocar código. Si quedan en null, el sitio
 * muestra el mensaje armado pero no abre ningún chat.
 */
const whatsappDaale = process.env.NEXT_PUBLIC_WHATSAPP_DAALE ?? "5492644398407";
const whatsappNocheMagik =
  process.env.NEXT_PUBLIC_WHATSAPP_NOCHE_MAGIK ?? "5492646269681";

function displayNumber(international: string | null): string | null {
  if (!international) return null;
  const local = international.replace(/^549/, "");
  if (local.length !== 10) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
}

export const brands: Record<BrandId, BrandConfig> = {
  daale: {
    id: "daale",
    name: "Daale",
    path: "/daale",
    configuratorPath: "/daale/armar",
    chooserLine: "Personajes, animación y deco para tus celebraciones",
    chooserExamples:
      "Cumpleaños, celebraciones en familia y acciones para empresas, shoppings y marcas.",
    chooserCta: "Entrar a Daale",
    logos: {
      // Solo existe en versión transparente con el usuario de Instagram debajo.
      // Pendiente: variante compacta transparente sin el usuario.
      compact: {
        src: "/brand/daale/daale-insta.webp",
        width: 720,
        height: 279,
        alt: "DAALE!!",
        sourceFile: "export/DAALE INSTA 02.png",
      },
      full: {
        src: "/brand/daale/daale-insta.webp",
        width: 720,
        height: 279,
        alt: "DAALE!! · Instagram daaleanimacion.deco",
        sourceFile: "export/DAALE INSTA 02.png",
      },
    },
    instagram: {
      handle: "daaleanimacion.deco",
      url: "https://www.instagram.com/daaleanimacion.deco/",
    },
    analytics: {
      ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID_DAALE ?? null,
      metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID_DAALE ?? null,
    },
    whatsapp: { number: whatsappDaale, display: displayNumber(whatsappDaale) },
    motif: "confetti",
    hero: {
      title: "Personajes, animación y deco para tu celebración",
      subtitle:
        "Cumpleaños, fiestas en familia y acciones para shoppings, comercios y marcas. Elegí lo que imaginás y te respondemos por WhatsApp con una propuesta.",
      image: "daale-hero",
    },
    howItWorks: [
      {
        title: "Elegí qué querés celebrar",
        text: "Un cumpleaños, una fiesta en familia o una acción para tu empresa.",
      },
      {
        title: "Sumá lo que te guste",
        text: "Personajes, animación, maquillaje artístico, deco y más. Si no sabés, te ayudamos a decidir.",
      },
      {
        title: "Mandalo por WhatsApp",
        text: "Te armamos un mensaje ordenado y te respondemos con disponibilidad y propuesta.",
      },
    ],
    categoriesTitle: "Lo que podemos llevar a tu evento",
    business: {
      title: "¿Organizás una acción para una empresa, un shopping o una marca?",
      text: "Producimos recepciones, activaciones e intervenciones con personajes para shoppings, cines, comercios y eventos corporativos.",
      cta: "Armar una propuesta para empresa",
    },
    messages: {
      configuratorHeader:
        "Hola, equipo de Daale. Armé una idea desde la web y quisiera consultar disponibilidad y propuesta.",
      direct: "Hola, equipo de Daale. Quería hacerles una consulta.",
    },
    summaryTitle: "Tu experiencia Daale",
    metadata: {
      title: "Daale · Personajes, animación y deco para eventos",
      description:
        "Personajes, animación, maquillaje artístico y decoración para cumpleaños, celebraciones familiares y acciones de empresa. Armá tu evento y consultá por WhatsApp.",
    },
  },

  "noche-magik": {
    id: "noche-magik",
    name: "Noche Magik",
    path: "/noche-magik",
    configuratorPath: "/noche-magik/armar",
    chooserLine: "Recepción, shows y artistas para tus fiestas de noche",
    chooserExamples:
      "Fiestas, celebraciones de 15 y de 18, boliches y eventos de empresa.",
    chooserCta: "Entrar a Noche Magik",
    logos: {
      // El nombre del logo es azul #003A6B: sobre fondos oscuros no se lee, así
      // que siempre va sobre la superficie clara "luz de luna".
      compact: {
        src: "/brand/noche-magik/noche-magik.webp",
        width: 520,
        height: 732,
        alt: "Noche Magik",
        sourceFile: "LOGO NOCHE MAGICA.PNG",
        plate: "var(--moon)",
      },
      full: {
        src: "/brand/noche-magik/noche-magik.webp",
        width: 520,
        height: 732,
        alt: "Noche Magik",
        sourceFile: "LOGO NOCHE MAGICA.PNG",
        plate: "var(--moon)",
      },
    },
    instagram: {
      handle: "noche_magik",
      url: "https://www.instagram.com/noche_magik/",
    },
    analytics: {
      ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID_NOCHE_MAGIK ?? null,
      metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID_NOCHE_MAGIK ?? null,
    },
    whatsapp: {
      number: whatsappNocheMagik,
      display: displayNumber(whatsappNocheMagik),
    },
    motif: "stars",
    hero: {
      title: "Shows y artistas para que la noche se recuerde",
      subtitle:
        "Recepción, artistas y animación para fiestas, celebraciones de 15 y de 18, boliches y eventos de empresa. Contanos tu idea y te respondemos por WhatsApp.",
      image: "nm-hero",
    },
    howItWorks: [
      {
        title: "Contanos qué fiesta es",
        text: "Una celebración de 15 o de 18, una fiesta, un boliche o un evento de empresa.",
      },
      {
        title: "Elegí el show y los extras",
        text: "Recepción, artistas, animación y ambientación. Si lo que imaginás no está, lo podés describir.",
      },
      {
        title: "Mandalo por WhatsApp",
        text: "Te armamos un mensaje ordenado y te respondemos con disponibilidad y propuesta.",
      },
    ],
    categoriesTitle: "Lo que podemos llevar a tu noche",
    business: {
      title: "¿Es un evento de empresa?",
      text: "Fiestas de fin de año, lanzamientos y eventos corporativos de noche, con recepción, show y animación.",
      cta: "Armar una propuesta para empresa",
    },
    messages: {
      configuratorHeader:
        "Hola, equipo de Noche Magik. Armé una idea desde la web y quisiera consultar disponibilidad y propuesta.",
      direct: "Hola, equipo de Noche Magik. Quería hacerles una consulta.",
    },
    summaryTitle: "Tu evento Noche Magik",
    metadata: {
      title: "Noche Magik · Shows y experiencias para fiestas de noche",
      description:
        "Recepción, artistas, shows y animación para fiestas, celebraciones de 15 y 18, boliches y eventos de empresa. Armá tu evento y consultá por WhatsApp.",
    },
  },
};

export const brandList: BrandConfig[] = [brands.daale, brands["noche-magik"]];

export function getBrand(id: BrandId): BrandConfig {
  return brands[id];
}
