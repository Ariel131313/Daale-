import type { EventType, Service } from "@/lib/types";

/**
 * Catálogo exclusivo para mayores de 18, separado de los catálogos generales.
 *
 * Solo lo importa la ruta /noche-magik/mayores (components/adultos/registro.ts),
 * así su texto nunca viaja en el JavaScript de la portada, de Daale ni del
 * recorrido general de Noche Magik. Qué se ofrece y a quién lo siguen
 * decidiendo las reglas de lib/audience.ts y el flag enableAdultCategory.
 *
 * Sin imágenes, a propósito: la web pública no muestra material sensible. Los
 * detalles se conversan por WhatsApp.
 */
export const adultCatalog: {
  categories: Record<string, string>;
  eventTypes: EventType[];
  services: Service[];
} = {
  categories: {
    adultos: "Solo mayores de 18",
  },

  eventTypes: [
    {
      id: "nm-adultos-despedida",
      brand: "noche-magik",
      clientType: "particular",
      label: "Despedida de soltera o soltero",
      description: "Evento privado para mayores de 18.",
      audience: "adults-only",
      isBusiness: false,
      asksAgeMix: false,
      order: 900,
    },
    {
      id: "nm-adultos-show",
      brand: "noche-magik",
      clientType: "particular",
      label: "Show para público adulto",
      description: "Evento privado para mayores de 18.",
      audience: "adults-only",
      isBusiness: false,
      asksAgeMix: false,
      order: 910,
    },
  ],

  services: [
    {
      id: "nm-adultos-show",
      slug: "show-publico-adulto",
      brand: "noche-magik",
      name: "Show para público adulto",
      shortDescription:
        "Solo para eventos privados de mayores de 18. Los detalles se conversan por WhatsApp.",
      category: "adultos",
      audience: "adults-only",
      tags: ["adultos"],
      pairsWith: [],
      commercialPriority: 100,
      price: null,
      pendingConfirmation: true,
    },
  ],
};
