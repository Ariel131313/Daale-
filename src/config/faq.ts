import type { FaqItem } from "@/lib/types";

/**
 * Preguntas frecuentes. Ninguna marca pasó todavía sus políticas, así que las
 * respuestas no prometen plazos, señas, precios ni exclusividad: invitan a
 * consultar. pendingPolicy marca las que hay que reescribir con la política
 * real antes de publicar.
 */
export const faq: FaqItem[] = [
  // ---------- Daale ----------
  {
    id: "daale-disponibilidad",
    brand: "daale",
    question: "¿Cómo sé si tienen disponible mi fecha?",
    answer:
      "Armá tu evento y mandalo por WhatsApp: con la fecha, el horario y la zona te confirmamos disponibilidad. Si todavía no tenés fecha, igual podés consultar.",
    pendingPolicy: false,
  },
  {
    id: "daale-anticipacion",
    brand: "daale",
    question: "¿Con cuánta anticipación tengo que reservar?",
    answer:
      "Depende de la fecha y de los personajes que elijas. Lo mejor es consultar apenas tengas el día en mente.",
    pendingPolicy: true,
  },
  {
    id: "daale-duracion",
    brand: "daale",
    question: "¿Cuánto dura una animación?",
    answer:
      "Hay propuestas de una hora y otras más largas. En el configurador elegís una duración aproximada y la ajustamos juntos.",
    pendingPolicy: true,
  },
  {
    id: "daale-zonas",
    brand: "daale",
    question: "¿A qué zonas van?",
    answer: "Contanos dónde es el evento y te confirmamos si llegamos.",
    pendingPolicy: true,
  },
  {
    id: "daale-personalizacion",
    brand: "daale",
    question: "¿Puedo pedir un personaje o una temática que no está en la lista?",
    answer:
      "Sí, escribilo en el configurador. Te decimos si lo tenemos o qué alternativa podemos proponerte.",
    pendingPolicy: false,
  },
  {
    id: "daale-reserva",
    brand: "daale",
    question: "¿Cómo se reserva y cómo se paga?",
    answer:
      "Las condiciones de reserva y las formas de pago te las pasamos por WhatsApp junto con la propuesta.",
    pendingPolicy: true,
  },
  {
    id: "daale-empresas",
    brand: "daale",
    question: "¿Trabajan con empresas, shoppings y marcas?",
    answer:
      "Sí. En el configurador elegí la opción para empresas: te pedimos el objetivo de la acción para armar una propuesta a medida.",
    pendingPolicy: false,
    businessOnly: true,
  },

  // ---------- Noche Magik ----------
  {
    id: "nm-disponibilidad",
    brand: "noche-magik",
    question: "¿Cómo sé si tienen disponible mi fecha?",
    answer:
      "Armá tu evento y mandalo por WhatsApp: con la fecha, el horario y la zona te confirmamos disponibilidad. Si la fecha es tentativa, igual podés consultar.",
    pendingPolicy: false,
  },
  {
    id: "nm-15-18",
    brand: "noche-magik",
    question: "¿Hacen celebraciones de 15 y de 18?",
    answer:
      "Sí. Para estas fiestas proponemos recepción, personajes, shows y animación pensados para ese público.",
    pendingPolicy: false,
  },
  {
    id: "nm-anticipacion",
    brand: "noche-magik",
    question: "¿Con cuánta anticipación tengo que reservar?",
    answer:
      "Depende de la fecha y del show que elijas. Te recomendamos consultar apenas tengas el día en mente.",
    pendingPolicy: true,
  },
  {
    id: "nm-duracion",
    brand: "noche-magik",
    question: "¿Cuánto dura un show?",
    answer:
      "Cada propuesta tiene su duración. En el configurador indicás la que imaginás y la ajustamos juntos.",
    pendingPolicy: true,
  },
  {
    id: "nm-personalizacion",
    brand: "noche-magik",
    question: "¿Puedo pedir un show o una temática a medida?",
    answer:
      "Sí, contanos la idea en el configurador o por WhatsApp. Te decimos si podemos armarla o qué alternativa te proponemos.",
    pendingPolicy: false,
  },
  {
    id: "nm-zonas",
    brand: "noche-magik",
    question: "¿A qué zonas van?",
    answer:
      "Contanos dónde es el evento y te decimos si llegamos y cómo se calcula el traslado.",
    pendingPolicy: true,
  },
  {
    id: "nm-reserva",
    brand: "noche-magik",
    question: "¿Cómo se reserva y cómo se paga?",
    answer:
      "Las condiciones de reserva y las formas de pago te las pasamos por WhatsApp junto con la propuesta.",
    pendingPolicy: true,
  },
  {
    id: "nm-empresas",
    brand: "noche-magik",
    question: "¿Hacen eventos de empresa?",
    answer:
      "Sí: fiestas de fin de año, lanzamientos y eventos corporativos. Elegí «Evento de empresa» en el configurador.",
    pendingPolicy: false,
    businessOnly: true,
  },
];
