/**
 * Solo para los tests: el catálogo completo, con lo exclusivo para mayores
 * registrado como lo hace la ruta /noche-magik/mayores. Así las pruebas de
 * separación de públicos recorren también esos tipos y servicios, con el flag
 * encendido y apagado.
 */
import { adultCatalog } from "@/config/adultos";
import { allEventTypes, allServices, registerCatalog } from "@/config/catalog";

registerCatalog(adultCatalog);

export const eventTypes = allEventTypes();
export const services = allServices();
