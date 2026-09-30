import type { Character } from "@/lib/types";

/**
 * Personajes. Los nombres son descriptivos a propósito: los personajes de
 * películas y series tienen dueños de marca, y publicarlos por su nombre
 * comercial necesita revisión legal. En la conversación por WhatsApp se puede
 * hablar con libertad.
 */
export const characters: Character[] = [
  // ---------- Daale ----------
  {
    id: "daale-heroe-aracnido",
    brand: "daale",
    name: "Héroe arácnido",
    description: "Superhéroe de traje rojo y azul, para fotos y juegos.",
    image: "daale-personaje",
    audience: "all-ages",
    suggestedFor: ["daale-cumple-infantil", "daale-cine"],
    pendingConfirmation: false,
  },
  {
    id: "daale-heroina-aracnida",
    brand: "daale",
    name: "Heroína arácnida",
    description: "Para hacer dupla con el héroe o para brillar sola.",
    audience: "all-ages",
    suggestedFor: ["daale-cumple-infantil"],
    pendingConfirmation: false,
  },
  {
    id: "daale-ninja-rojo",
    brand: "daale",
    name: "Ninja rojo",
    description: "Acción y juegos para los más movedizos.",
    audience: "all-ages",
    suggestedFor: ["daale-cumple-infantil"],
    pendingConfirmation: false,
  },
  {
    id: "daale-criatura-azul",
    brand: "daale",
    name: "Criatura azul de peluche",
    description: "Ideal para jardines y los más chiquitos: todos lo quieren abrazar.",
    image: "daale-criatura-azul",
    audience: "all-ages",
    suggestedFor: ["daale-cumple-infantil", "daale-institucion", "daale-shopping"],
    pendingConfirmation: false,
  },
  {
    id: "daale-vaquera-alien",
    brand: "daale",
    name: "Vaquera y alien espacial",
    description: "Un dúo de juguetes perfecto para las fotos.",
    image: "daale-alien",
    audience: "all-ages",
    suggestedFor: ["daale-shopping", "daale-comercio", "daale-cumple-infantil"],
    pendingConfirmation: false,
  },
  {
    id: "daale-munecos",
    brand: "daale",
    name: "Muñecos y payasos",
    description: "Para animar toda la fiesta, no solo un momento.",
    image: "daale-munecos",
    audience: "all-ages",
    suggestedFor: ["daale-familiar", "daale-corporativo"],
    pendingConfirmation: false,
  },

  // ---------- Noche Magik ----------
  {
    id: "nm-chocolatero",
    brand: "noche-magik",
    name: "Chocolatero excéntrico",
    description: "Espectacular en la mesa dulce de los 15 y los 18.",
    image: "nm-personajes",
    audience: "all-ages",
    suggestedFor: ["nm-15", "nm-18", "nm-casamiento"],
    pendingConfirmation: false,
  },
  {
    id: "nm-mercenario-rojo",
    brand: "noche-magik",
    name: "Mercenario rojo",
    description: "Loco y versátil, levanta cualquier fiesta de noche.",
    image: "nm-mercenario",
    audience: "all-ages",
    suggestedFor: ["nm-boliche", "nm-fiesta", "nm-18"],
    pendingConfirmation: false,
  },
];
