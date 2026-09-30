import type { BrandId, BudgetBand } from "@/lib/types";

/**
 * Bandas orientativas y opcionales. Sirven para que la marca entienda el
 * rango de la consulta, no para cotizar: ajustarlas cuando haya lista de
 * precios vigente.
 */
export const budgetBands: BudgetBand[] = [
  { id: "daale-hasta-100", brand: "daale", label: "Hasta $100.000" },
  { id: "daale-100-200", brand: "daale", label: "Entre $100.000 y $200.000" },
  { id: "daale-200-400", brand: "daale", label: "Entre $200.000 y $400.000" },
  { id: "daale-mas-400", brand: "daale", label: "Más de $400.000" },
  { id: "daale-conversar", brand: "daale", label: "Prefiero conversarlo", isConversation: true },

  { id: "nm-hasta-200", brand: "noche-magik", label: "Hasta $200.000" },
  { id: "nm-200-400", brand: "noche-magik", label: "Entre $200.000 y $400.000" },
  { id: "nm-400-800", brand: "noche-magik", label: "Entre $400.000 y $800.000" },
  { id: "nm-mas-800", brand: "noche-magik", label: "Más de $800.000" },
  { id: "nm-conversar", brand: "noche-magik", label: "Prefiero conversarlo", isConversation: true },
];

/** Bandas de una marca, en el orden configurado. */
export function budgetBandsFor(brand: BrandId): BudgetBand[] {
  return budgetBands.filter((b) => b.brand === brand);
}
