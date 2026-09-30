import type { BrandId, EventType, MediaId } from "@/lib/types";

/**
 * Textos de la landing que no están en config/brands.ts. Son solo copys y
 * reglas de agrupación: los tipos de evento, servicios y FAQ salen siempre de
 * lib/audience.ts y config/*, nunca de acá.
 */

export interface EventGroupCopy {
  id: string;
  /** Si el grupo es el de empresas, se usan título y texto de brand.business. */
  title: string;
  text?: string;
  /** Qué tipos de evento (ya filtrados por lib/audience.ts) entran en el grupo. */
  match: (eventType: EventType) => boolean;
  business?: boolean;
  /** Muestra «Armá tu evento» al pie del grupo. */
  cta?: boolean;
  /**
   * Aclaración que solo aparece cuando existe la categoría para mayores de 18:
   * con el flag apagado no se nombra nada relacionado.
   */
  noteWhenAdults?: string;
}

export interface LandingCopy {
  /** Clases de los títulos: Fredoka se usa en seminegrita; Young Serif tiene un solo peso. */
  display: string;
  /** El logo completo acompaña la imagen del hero (Noche Magik: su logo en el header es chico). */
  heroLogoBadge: boolean;
  businessHint: { question: string; link: string };
  howTitle: string;
  howIntro: string;
  groupsTitle: string;
  groupsIntro: string;
  groups: EventGroupCopy[];
  otherNote: string;
  categoriesIntro: string;
  faqTitle: string;
  faqIntro: string;
  closingTitle: string;
  closingText: string;
  portfolioTitle: string;
  /**
   * Trabajos reales para el portfolio: solo fotos autorizadas. Hoy no hay
   * material autorizado y siteConfig.flags.showPortfolio está apagado.
   */
  portfolio: MediaId[];
  /** Solo se usa si adultCategoryAvailable(brand) es true. */
  adults?: { title: string; text: string; cta: string };
}

export const landingCopy: Record<BrandId, LandingCopy> = {
  daale: {
    display: "font-display font-semibold",
    heroLogoBadge: false,
    businessHint: {
      question: "¿Es para una empresa, un shopping o una marca?",
      link: "Ver opciones para empresas",
    },
    howTitle: "Cómo funciona",
    howIntro: "No hace falta registrarte ni tener todo definido.",
    groupsTitle: "Para familias, empresas y marcas",
    groupsIntro:
      "Llevamos personajes y animación a cumpleaños y celebraciones, y también a shoppings, cines, comercios y eventos corporativos.",
    groups: [
      {
        id: "celebraciones",
        title: "Celebraciones",
        text: "Para vos y tu familia.",
        match: (e) => e.clientType === "particular",
        cta: true,
      },
      {
        id: "empresas",
        title: "Empresas, marcas e instituciones",
        match: (e) => e.clientType === "empresa",
        business: true,
      },
    ],
    otherNote:
      "Si tu evento no está en la lista, también lo podés consultar: en el configurador hay lugar para contarlo con tus palabras.",
    categoriesIntro:
      "Se pueden combinar en un mismo evento. Si no sabés qué elegir, te ayudamos a decidir.",
    faqTitle: "Preguntas frecuentes",
    faqIntro: "Si tenés otra duda, escribinos por WhatsApp y la vemos juntos.",
    closingTitle: "Contanos qué querés celebrar",
    closingText:
      "Son pocos pasos y no hace falta tener todo definido. Te respondemos por WhatsApp con disponibilidad y una propuesta.",
    portfolioTitle: "Algunos trabajos de Daale",
    portfolio: [],
  },

  "noche-magik": {
    display: "font-display font-normal",
    heroLogoBadge: true,
    businessHint: {
      question: "¿Es un boliche o un evento de empresa?",
      link: "Ver opciones para empresas",
    },
    howTitle: "Cómo funciona",
    howIntro: "No hace falta registrarte ni tener todo definido.",
    groupsTitle: "Cada noche tiene su propuesta",
    groupsIntro:
      "Separamos las propuestas según el tipo de fiesta y quiénes la disfrutan.",
    groups: [
      {
        id: "quince-dieciocho",
        title: "Celebraciones de 15 y de 18",
        text: "Entrada, recepción y show pensados para quien cumple y sus invitados.",
        match: (e) => e.clientType === "particular" && e.audience === "with-minors",
        noteWhenAdults:
          "Para estas fiestas solo proponemos artistas y shows aptos para todo público.",
      },
      {
        id: "fiestas",
        title: "Fiestas y celebraciones",
        text: "Recepción, show y animación para casamientos y fiestas privadas.",
        match: (e) => e.clientType === "particular" && e.audience !== "with-minors",
      },
      {
        id: "empresas",
        title: "Empresas y boliches",
        match: (e) => e.clientType === "empresa",
        business: true,
      },
    ],
    otherNote:
      "Si tu evento no está en la lista, también lo podés consultar: en el configurador hay lugar para contarlo con tus palabras.",
    categoriesIntro:
      "Se pueden combinar en una misma noche. Si lo que imaginás no está, lo podés describir en el configurador.",
    faqTitle: "Preguntas frecuentes",
    faqIntro: "Si tenés otra duda, escribinos por WhatsApp y la vemos juntos.",
    closingTitle: "Contanos cómo imaginás la noche",
    closingText:
      "Son pocos pasos y no hace falta tener todo definido. Te respondemos por WhatsApp con disponibilidad y una propuesta.",
    portfolioTitle: "Algunas noches de Noche Magik",
    portfolio: [],
    adults: {
      title: "Eventos privados solo para mayores de 18",
      text: "Están en una sección aparte, separada de las celebraciones de 15 y de 18 y de los eventos familiares. Para entrar tenés que confirmar que sos mayor de edad.",
      cta: "Entrar a la sección para mayores de 18",
    },
  },
};
