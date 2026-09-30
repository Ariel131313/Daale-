import type {
  BrandId,
  ClientType,
  ConfiguratorMode,
  EventType,
  StepId,
} from "@/lib/types";

/**
 * Textos del configurador que cambian por marca, por modo o por tipo de
 * cliente. Los catálogos no viven acá: salen de lib/audience.ts.
 */

/** Nombre corto de cada paso, para el indicador de progreso. */
export const STEP_NAMES: Record<StepId, string> = {
  tipo: "Tipo de evento",
  servicios: "Qué sumar",
  datos: "Fecha y lugar",
  sugerencias: "Sugerencias",
  confirmar: "Tu nombre",
};

/** Orden fijo de los pasos, para buscar el primero que falta completar. */
export const STEP_ORDER: StepId[] = ["tipo", "servicios", "datos", "sugerencias", "confirmar"];

/** Orden en que aparecen los campos en pantalla: el foco va al primer error. */
export const FIELD_ORDER = [
  "eventType",
  "customEventLabel",
  "services",
  "eventDate",
  "approximateAttendees",
  "childrenCount",
  "adultsCount",
  "clientName",
] as const;

export function groupHeading(
  brandId: BrandId,
  mode: ConfiguratorMode,
  clientType: ClientType
): string {
  if (mode === "adults-only") {
    return clientType === "empresa" ? "Empresas" : "Eventos privados para mayores de 18";
  }
  if (brandId === "daale") {
    return clientType === "empresa"
      ? "Para empresas, marcas e instituciones"
      : "Para vos y tu familia";
  }
  return clientType === "empresa" ? "Empresas y boliches" : "Celebraciones";
}

export interface StepCopy {
  title: string;
  intro: string;
}

export function stepCopy(
  step: StepId,
  mode: ConfiguratorMode,
  eventType: EventType | null
): StepCopy {
  const business = Boolean(eventType?.isBusiness);
  switch (step) {
    case "tipo":
      return mode === "adults-only"
        ? {
            title: "¿Qué tipo de evento es?",
            intro: "Estas opciones son solo para eventos privados de mayores de 18.",
          }
        : {
            title: "¿Qué estás organizando?",
            intro: "Elegí la opción que más se parezca. Después la podés cambiar.",
          };
    case "servicios":
      return {
        title: business ? "¿Qué te gustaría sumar a la acción?" : "¿Qué te gustaría sumar?",
        intro:
          "Podés elegir varias opciones. Si lo que imaginás no está, contalo con tus palabras al final.",
      };
    case "datos":
      return {
        title: business ? "Datos de la acción" : "Contanos del evento",
        intro:
          "Solo necesitamos saber si ya tenés fecha. Lo demás es opcional y nos ayuda a armar la propuesta.",
      };
    case "sugerencias":
      return {
        title: "Algunas ideas que suelen sumar",
        intro:
          "Son opcionales. Si alguna te interesa, la agregamos a tu consulta y la conversamos por WhatsApp.",
      };
    case "confirmar":
      return {
        title: "Casi listo",
        intro: business
          ? "Decinos con quién hablamos. El presupuesto es opcional y solo sirve de referencia."
          : "Decinos cómo te llamás. El presupuesto es opcional y solo sirve de referencia.",
      };
  }
}
