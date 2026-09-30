/**
 * Interruptores globales del sitio. Todo lo que cambia qué se publica pasa por
 * acá, no por los componentes.
 */
export const siteConfig = {
  name: "DAALE!! y Noche Magik",
  locale: "es-AR",
  /** Dominio definitivo pendiente: se usa para metadatos absolutos. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? null,

  flags: {
    /** Muestra precios orientativos en tarjetas y resumen. */
    showPrices: false,
    /**
     * Habilita el recorrido separado para mayores de 18 dentro de Noche Magik.
     * Apagado: la categoría no existe en ningún menú, listado ni sugerencia.
     */
    enableAdultCategory: false,
    /** Portfolio de trabajos: solo con fotos reales y autorizadas. */
    showPortfolio: false,
    /**
     * Imágenes generadas con IA como marcador de lugar. Llevan la leyenda
     * "Imagen ilustrativa". Apagar antes de publicar si no se reemplazaron.
     */
    showIllustrativeMedia: true,
    /**
     * Servicios y personajes que la marca todavía no confirmó. Encendido se
     * ofrecen siempre con la etiqueta "Pendiente de confirmar"; apagado no
     * aparecen en ningún listado, tarjeta ni sugerencia. Para publicar:
     * confirmarlos (pendingConfirmation: false) o apagar este interruptor.
     */
    showPendingServices: true,
    /**
     * Versión de revisión con los dueños: marca como "Respuesta provisoria" las
     * preguntas frecuentes que esperan la política real. Esas respuestas ya son
     * neutrales, así que se puede apagar para publicar.
     */
    showReviewBadges: true,
    /**
     * Analítica (GA4 y Meta Pixel). Aun encendida, solo se carga si hay IDs
     * configurados y la persona acepta el aviso.
     */
    enableAnalytics: true,
  },

  /**
   * IDs compartidos: reciben los eventos de todo el sitio, portada incluida.
   * Cada marca puede tener además los suyos en brands.ts. Sin ningún ID no se
   * carga ningún script ni se pide consentimiento.
   */
  analytics: {
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID ?? null,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? null,
  },

  storage: {
    /** Las respuestas del configurador se borran solas pasado este plazo. */
    ttlDays: 14,
    keyPrefix: "dnm",
  },
} as const;
