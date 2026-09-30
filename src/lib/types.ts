export type BrandId = "daale" | "noche-magik";

export type ClientType = "particular" | "empresa";

/**
 * Quién asiste al evento. Es la llave de la separación de públicos: decide qué
 * servicios, personajes y sugerencias se pueden ofrecer.
 * - all-ages: puede haber chicos y adultos (shopping, celebración familiar).
 * - with-minors: hay menores con seguridad (cumpleaños infantil, 15, 18).
 * - adults: público adulto sin contenido para adultos (fiesta social, corporativo).
 * - adults-only: exclusivo mayores de 18. Solo existe con el flag activo y
 *   únicamente dentro del recorrido separado de /noche-magik/mayores.
 */
export type EventAudience = "all-ages" | "with-minors" | "adults" | "adults-only";

/** Público apto de un servicio o personaje. */
export type ServiceAudience = "all-ages" | "adults" | "adults-only";

export type ConfiguratorMode = "general" | "adults-only";

export type MediaId = string;

export interface MediaItem {
  id: MediaId;
  /** Ruta dentro de /public, sin basePath. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Versiones más chicas para srcset, de menor a mayor. */
  srcSet?: { src: string; width: number }[];
  /** Generada con IA como marcador de lugar: reemplazar por una foto real. */
  generated: boolean;
  /**
   * Aparecen personas reconocibles. Las fotos reales se recortaron para dejar
   * solo artistas enmascarados o disfrazados; si alguna muestra caras, no se
   * publica hasta tener autorización.
   */
  identifiablePeople: boolean;
  /** Hay autorización de uso de imagen de las personas que aparecen. */
  authorized: boolean;
  /** De dónde sale, para poder reemplazarla. */
  sourceNote: string;
}

export interface LogoAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Archivo original del que sale, para documentar qué variante se usa dónde. */
  sourceFile: string;
  /**
   * Color de superficie que el logo necesita detrás. El de Noche Magik tiene
   * el nombre en azul #003A6B y no se lee sobre fondos oscuros; el apaisado de
   * DAALE es un JPEG con fondo #FDFDFB.
   */
  plate?: string;
}

export interface EventType {
  id: string;
  brand: BrandId;
  clientType: ClientType;
  label: string;
  description?: string;
  audience: EventAudience;
  /** Pide empresa o institución y objetivo de la acción. */
  isBusiness: boolean;
  /** Pregunta cuántos chicos y cuántos adultos, y la edad aproximada. */
  asksAgeMix: boolean;
  /** Opción "Otro": habilita un campo de texto libre. */
  isOther?: boolean;
  image?: MediaId;
  order: number;
}

export interface ServicePrice {
  from: number;
  currency: "ARS";
  note?: string;
}

export interface Service {
  id: string;
  slug: string;
  brand: BrandId;
  name: string;
  shortDescription: string;
  category: string;
  image?: MediaId;
  audience: ServiceAudience;
  tags: string[];
  /** Ids de servicios con los que suele combinarse. */
  pairsWith: string[];
  durationHint?: string;
  /** Menor número, más arriba en el listado. */
  commercialPriority: number;
  price: ServicePrice | null;
  /** La oferta real todavía no fue confirmada por la marca. */
  pendingConfirmation: boolean;
  /** Al elegirlo se muestra la selección de personajes. */
  opensCharacters?: boolean;
  /** Si se omite, aplica a particulares y empresas. */
  clientTypes?: ClientType[];
}

export interface Character {
  id: string;
  brand: BrandId;
  name: string;
  description: string;
  image?: MediaId;
  audience: ServiceAudience;
  /** Ids de tipos de evento donde conviene sugerirlo primero. */
  suggestedFor: string[];
  pendingConfirmation: boolean;
}

export interface RecommendationCondition {
  eventTypeIds?: string[];
  audienceIn?: EventAudience[];
  /** Alcanza con que esté elegido uno de estos servicios. */
  hasAnyServiceId?: string[];
  minAttendees?: number;
  minChildren?: number;
  clientType?: ClientType;
}

export interface Recommendation {
  id: string;
  brand: BrandId;
  suggestServiceId: string;
  /** Explicación visible, sin prometer disponibilidad ni cantidades fijas. */
  reason: string;
  when: RecommendationCondition;
}

export interface FaqItem {
  id: string;
  brand: BrandId;
  question: string;
  answer: string;
  /** Respuesta genérica a la espera de la política real de la marca. */
  pendingPolicy: boolean;
  /** Solo se muestra si hay acceso a empresas en la marca. */
  businessOnly?: boolean;
}

export interface BudgetBand {
  id: string;
  brand: BrandId;
  label: string;
  /** "Prefiero conversarlo": no se informa monto. */
  isConversation?: boolean;
}

export type TimeSlot = "manana" | "tarde" | "noche" | "no-se";

export type DurationOption = "1h" | "2h" | "3h" | "mas-3h" | "no-se";

export type DateStatus = "exacta" | "tentativa" | "sin-definir";

export type AgeRange = "0-3" | "4-7" | "8-12" | "13-17" | "mezcla";

export interface ConfiguratorAnswers {
  eventTypeId: string | null;
  /** Texto libre cuando el tipo elegido es "Otro". */
  customEventLabel: string;
  serviceIds: string[];
  characterIds: string[];
  /** "Contanos tu idea": para quien no encuentra la tarjeta exacta. */
  ideaNotes: string;
  dateStatus: DateStatus;
  /** yyyy-mm-dd, vacío si la fecha no está definida. */
  eventDate: string;
  timeSlot: TimeSlot | null;
  duration: DurationOption | null;
  location: string;
  /** Los números se guardan como texto tal cual los escribió la persona. */
  approximateAttendees: string;
  childrenCount: string;
  adultsCount: string;
  ageRange: AgeRange | null;
  companyName: string;
  businessGoal: string;
  /** Servicios agregados desde las sugerencias. */
  extraServiceIds: string[];
  budgetBandId: string | null;
  clientName: string;
  notes: string;
}

export type StepId = "tipo" | "servicios" | "datos" | "sugerencias" | "confirmar";

export type ConfiguratorView = StepId | "resumen";

export interface ConfiguratorState {
  version: 1;
  brand: BrandId;
  mode: ConfiguratorMode;
  answers: ConfiguratorAnswers;
  view: ConfiguratorView;
  startedAt: string | null;
  updatedAt: string;
}

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

/**
 * Consulta armada en la web. Queda lista para una futura integración con CRM,
 * pero el MVP no la envía a ningún servidor: abrir WhatsApp no confirma que el
 * mensaje se haya mandado, por eso el estado es siempre "new_lead".
 */
export interface Lead {
  lead_id: string;
  created_at: string;
  brand: BrandId;
  source: string;
  client_type: ClientType | null;
  event_type: string | null;
  client_name: string;
  company_name?: string;
  event_date: string | null;
  date_is_tentative: boolean;
  event_time: TimeSlot | null;
  location: string | null;
  children_count?: number;
  adults_count?: number;
  approximate_attendees: number | null;
  age_range?: AgeRange;
  selected_services: string[];
  selected_characters: string[];
  selected_extras: string[];
  duration: DurationOption | null;
  budget_range: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: "new_lead";
}

/**
 * Eventos de analítica. "whatsapp_clicked" mide el clic: nunca se registra
 * como lead completado porque no hay evidencia de que el mensaje se envió.
 */
export type AnalyticsEventName =
  | "landing_view"
  | "brand_selected"
  | "configurator_started"
  | "client_type_selected"
  | "service_selected"
  | "character_selected"
  | "configuration_completed"
  | "whatsapp_clicked";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export interface HowItWorksStep {
  title: string;
  text: string;
}

/** IDs de analítica. null = sin configurar: no se carga ese servicio. */
export interface AnalyticsIds {
  ga4MeasurementId: string | null;
  metaPixelId: string | null;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  path: "/daale" | "/noche-magik";
  configuratorPath: string;
  /** Línea de la tarjeta en la portada de elección. */
  chooserLine: string;
  /** Ejemplos concretos debajo de la línea, para decidir sin dudar. */
  chooserExamples: string;
  chooserCta: string;
  logos: {
    /** Header y lugares chicos. */
    compact: LogoAsset;
    /** Hero y tarjeta de la portada. */
    full: LogoAsset;
  };
  instagram: { handle: string; url: string } | null;
  /** Cuentas de analítica propias de la marca (reciben solo sus eventos). */
  analytics: AnalyticsIds;
  whatsapp: {
    /** Formato internacional para wa.me, solo dígitos. null = sin configurar. */
    number: string | null;
    display: string | null;
  };
  motif: "confetti" | "stars";
  hero: {
    title: string;
    subtitle: string;
    image?: MediaId;
  };
  howItWorks: [HowItWorksStep, HowItWorksStep, HowItWorksStep];
  categoriesTitle: string;
  /** Acceso a empresas dentro de la marca, sin volver corporativa la home. */
  business: { title: string; text: string; cta: string } | null;
  messages: {
    /** Primera línea del mensaje del configurador. */
    configuratorHeader: string;
    /** Mensaje de "Hablar directamente". */
    direct: string;
  };
  summaryTitle: string;
  metadata: { title: string; description: string };
}
