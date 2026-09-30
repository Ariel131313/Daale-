import { getEventType } from "@/lib/audience";
import { isISODate, todayISO } from "@/lib/dates";
import { parseCount } from "@/lib/numbers";
import type { ConfiguratorAnswers, StepId } from "@/lib/types";

/** Errores por campo. La clave coincide con el id del input para asociarlos. */
export type FieldErrors = Partial<Record<string, string>>;

/** Vacío vale (el dato es opcional); si hay algo escrito, tiene que ser una cantidad. */
function isOptionalCount(value: string): boolean {
  return !value.trim() || parseCount(value) !== null;
}

/**
 * Validación de un paso. Solo el tipo de evento, algo para llevar (o una idea
 * escrita) y el nombre son obligatorios; el resto se valida si se completó.
 */
export function validateStep(
  step: StepId,
  answers: ConfiguratorAnswers,
  now: Date = new Date()
): FieldErrors {
  const errors: FieldErrors = {};
  const eventType = getEventType(answers.eventTypeId);

  if (step === "tipo") {
    if (!eventType) {
      errors.eventType = "Elegí una opción para seguir.";
    } else if (eventType.isOther && answers.customEventLabel.trim().length < 2) {
      errors.customEventLabel = "Contanos en pocas palabras qué evento es.";
    }
  }

  if (step === "servicios") {
    if (answers.serviceIds.length === 0 && answers.ideaNotes.trim().length < 3) {
      errors.services =
        "Elegí al menos una opción, o escribí tu idea si no encontrás lo que buscás.";
    }
  }

  if (step === "datos") {
    if (answers.dateStatus !== "sin-definir") {
      if (!answers.eventDate) {
        errors.eventDate =
          "Elegí la fecha, o marcá «Todavía no la definí» para seguir sin fecha.";
      } else if (!isISODate(answers.eventDate)) {
        errors.eventDate = "Esa fecha no es válida. Elegí un día del calendario.";
      } else if (answers.eventDate < todayISO(now)) {
        errors.eventDate = "La fecha ya pasó. Elegí un día a partir de hoy.";
      }
    }
    if (!isOptionalCount(answers.approximateAttendees)) {
      errors.approximateAttendees = "Escribí solo la cantidad en números, por ejemplo 40.";
    }
    if (!isOptionalCount(answers.childrenCount)) {
      errors.childrenCount = "Escribí solo la cantidad en números, por ejemplo 20.";
    }
    if (!isOptionalCount(answers.adultsCount)) {
      errors.adultsCount = "Escribí solo la cantidad en números, por ejemplo 15.";
    }
  }

  if (step === "confirmar") {
    if (answers.clientName.trim().length < 2) {
      errors.clientName = "Escribí tu nombre para saber cómo llamarte.";
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Todo lo necesario para mandar la consulta está completo. */
export function isReadyToSend(answers: ConfiguratorAnswers, now: Date = new Date()): boolean {
  return (["tipo", "servicios", "datos", "confirmar"] as StepId[]).every(
    (step) => !hasErrors(validateStep(step, answers, now))
  );
}
