import { adultCatalog } from "@/config/adultos";
import { registerCatalog } from "@/config/catalog";
import { adultCategoryAvailable } from "@/lib/audience";

/**
 * Suma el catálogo para mayores al catálogo completo. Lo importa solo el
 * recorrido /noche-magik/mayores, antes de mostrar el configurador; con el
 * flag apagado no se registra nada.
 */
if (adultCategoryAvailable("noche-magik")) {
  registerCatalog(adultCatalog);
}
