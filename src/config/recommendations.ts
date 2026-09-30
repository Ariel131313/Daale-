import type { Recommendation } from "@/lib/types";

/**
 * Sugerencias opcionales del paso 4. Hablan de "evaluar" y "sumar", nunca de
 * disponibilidad garantizada ni de cantidades fijas de personal: esas reglas
 * las tiene que validar cada marca. El filtro de público de lib/audience.ts se
 * aplica encima, así que ninguna sugerencia puede colar un servicio adulto.
 */
export const recommendations: Recommendation[] = [
  // ---------- Daale ----------
  {
    id: "daale-muchos-chicos",
    brand: "daale",
    suggestServiceId: "daale-animacion",
    reason:
      "Con muchos chicos, conviene evaluar sumar animación para que todos participen.",
    when: { minChildren: 20 },
  },
  {
    id: "daale-personajes-maquillaje",
    brand: "daale",
    suggestServiceId: "daale-maquillaje",
    reason: "Con personajes, el maquillaje artístico completa el disfraz de los chicos.",
    // Habla de «los chicos»: solo en celebraciones con chicos.
    when: {
      hasAnyServiceId: ["daale-personajes"],
      eventTypeIds: ["daale-cumple-infantil", "daale-familiar"],
    },
  },
  {
    id: "daale-personajes-fotos",
    brand: "daale",
    suggestServiceId: "daale-fotos",
    reason: "Un rincón de fotos hace que todos se lleven un recuerdo con los personajes.",
    when: { hasAnyServiceId: ["daale-personajes"] },
  },
  {
    id: "daale-infantil-globoflexia",
    brand: "daale",
    suggestServiceId: "daale-globoflexia",
    reason: "La globoflexia funciona muy bien como regalo para llevarse a casa.",
    when: { eventTypeIds: ["daale-cumple-infantil", "daale-familiar"] },
  },
  {
    id: "daale-empresa-recepcion",
    brand: "daale",
    suggestServiceId: "daale-recepcion",
    // Vale para shoppings, marcas y también escuelas: sin hablar de ventas.
    reason: "Una recepción con personajes le da la bienvenida al público desde la entrada.",
    when: { clientType: "empresa" },
  },
  {
    id: "daale-empresa-sector-creativo",
    brand: "daale",
    suggestServiceId: "daale-sector-creativo",
    reason:
      "Un sector creativo retiene a las familias más tiempo en el lugar.",
    when: { eventTypeIds: ["daale-shopping", "daale-comercio", "daale-cine"] },
  },

  // ---------- Noche Magik ----------
  {
    id: "nm-15-recepcion",
    brand: "noche-magik",
    suggestServiceId: "nm-recepcion",
    reason: "Para una noche de 15 o de 18, una recepción marca la entrada de los invitados.",
    when: { eventTypeIds: ["nm-15", "nm-18"] },
  },
  {
    id: "nm-15-personajes",
    brand: "noche-magik",
    suggestServiceId: "nm-personajes",
    reason: "Un personaje en la mesa dulce suma un momento especial para las fotos.",
    when: { eventTypeIds: ["nm-15", "nm-18"] },
  },
  {
    id: "nm-recepcion-zancudos",
    brand: "noche-magik",
    suggestServiceId: "nm-zancudos",
    reason: "Los zancudos suman altura y se ven desde todo el salón en la entrada.",
    when: { hasAnyServiceId: ["nm-recepcion"] },
  },
  {
    id: "nm-boliche-performers",
    brand: "noche-magik",
    suggestServiceId: "nm-performers",
    reason: "En la pista, los performers mantienen la energía durante la noche.",
    when: { eventTypeIds: ["nm-boliche", "nm-fiesta"] },
  },
  {
    id: "nm-empresa-espejo",
    brand: "noche-magik",
    suggestServiceId: "nm-hombre-espejo",
    reason: "En eventos de empresa, el hombre espejo es un gran motivo para las fotos.",
    when: { clientType: "empresa" },
  },
  {
    id: "nm-muchos-animacion",
    brand: "noche-magik",
    suggestServiceId: "nm-animacion",
    reason: "Con muchos invitados, conviene evaluar animación para sostener la fiesta.",
    when: { minAttendees: 120 },
  },
];
