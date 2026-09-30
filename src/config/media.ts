import type { MediaId, MediaItem } from "@/lib/types";
import { siteConfig } from "./site";
import sizes from "./mediaSizes.json";

type Meta = Omit<MediaItem, "id" | "src" | "width" | "height" | "srcSet">;

/**
 * Qué es cada imagen y si se puede publicar. Las medidas salen de
 * mediaSizes.json, que genera `npm run imagenes`.
 *
 * Reales: fotos de la marca recortadas para dejar solo artistas disfrazados o
 * enmascarados (sin chicos, invitados ni logos de terceros). Falta confirmar
 * la autorización de los artistas.
 * Generadas: marcadores hechos con IA (ComfyUI), más una ilustración recibida
 * que parece hecha con IA. Todas llevan la leyenda y hay que reemplazarlas.
 */
const meta: Record<MediaId, Meta> = {
  // ---------- Fotos reales recortadas ----------
  "daale-personaje": {
    alt: "Artista de Daale con traje de héroe arácnido, de brazos cruzados",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS DAALE/WhatsApp Image 2026-09-17 at 22.23.34.jpeg, panel superior",
  },
  "daale-criatura-azul": {
    alt: "Personaje de peluche azul de orejas grandes en un jardín",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS DAALE/ad909f76….jpg, recortada sin el chico",
  },
  "daale-alien": {
    alt: "Personaje inflable de alien verde de tres ojos",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS DAALE/WhatsApp Image 2026-09-17 at 22.30.12.jpeg, solo el alien",
  },
  "daale-munecos": {
    alt: "Muñeco cabezón de sonrisa grande",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS DAALE/c418cacb….jpg, sin el equipo ni los globos con logo",
  },
  "nm-mercenario": {
    alt: "Artista con traje de mercenario rojo haciendo pulgares arriba junto a un cartel de neón",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote:
      "FOTOS DAALE/005b5eee….jpg, a medio cuerpo: sin los globos estampados con la máscara ni los regalos del cumpleaños",
  },
  "nm-hombre-espejo": {
    alt: "Performer con traje cubierto de espejos, saludando",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS NOCHE MAGIC/65e2ad43….jpg, sin el invitado y con el cartel del local tapado",
  },
  "nm-tematico": {
    alt: "Dos artistas con máscaras de calavera y de fantasma en una noche temática",
    generated: false,
    identifiablePeople: false,
    authorized: false,
    sourceNote: "FOTOS NOCHE MAGIC/35634049….jpg, sin la artista maquillada ni el farol con logo",
  },
  "nm-personajes": {
    alt: "Ilustración de un chocolatero excéntrico de galera y anteojos redondos",
    // No es una foto: es una ilustración que parece hecha con IA a partir de una
    // foto de un evento. Se muestra como ilustrativa hasta tener una foto real.
    generated: true,
    identifiablePeople: false,
    authorized: false,
    sourceNote:
      "FOTOS NOCHE MAGIC/WILLY WONCA.jpeg, panel ilustrado recortado al personaje (sin las invitadas). Confirmar su origen y reemplazar por una foto del artista",
  },

  // ---------- Generadas con IA (reemplazar) ----------
  "daale-hero": {
    alt: "Salón de fiesta con guirnalda de globos rojos, violetas y azules",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de un evento de Daale",
  },
  "daale-animacion": {
    alt: "Juegos de animación preparados sobre el pasto: aros y paracaídas de colores",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de animación",
  },
  "daale-titeres": {
    alt: "Teatrito de títeres con telón de colores",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de la obra",
  },
  "daale-maquillaje": {
    alt: "Paleta de maquillaje artístico con pinceles y frascos de glitter",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real del puesto de maquillaje",
  },
  "daale-globoflexia": {
    alt: "Figuras hechas con globos largos: un perro, una flor y una espada",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de globoflexia",
  },
  "daale-deco": {
    alt: "Mesa dulce decorada con globos y detalles en rojo, violeta y azul",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de una ambientación",
  },
  "daale-cascada": {
    alt: "Cascada de chocolate con frutillas y malvaviscos",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real",
  },
  "daale-empresas": {
    alt: "Rincón de actividades con mesas y globos en el hall de un shopping",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de una activación autorizada",
  },
  "nm-hero": {
    alt: "Escenario de noche con luces azules y doradas entre humo",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de un show de Noche Magik",
  },
  "nm-recepcion": {
    alt: "Entrada de un salón de noche iluminada con velas y luces azules",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de una recepción",
  },
  "nm-zancudos": {
    alt: "Silueta de un artista en zancos contra una luz azul",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de zancudos",
  },
  "nm-performers": {
    alt: "Siluetas de performers en un escenario con humo y luces",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real autorizada",
  },
  "nm-ambientacion": {
    alt: "Salón de fiesta de noche con telas oscuras y luces doradas",
    generated: true,
    identifiablePeople: false,
    authorized: true,
    sourceNote: "ComfyUI · reemplazar por foto real de una ambientación",
  },
};

/** Todas las imágenes declaradas, publicables o no. */
export const mediaIds = Object.keys(meta) as MediaId[];

const measured = sizes as Record<
  string,
  { src: string; width: number; height: number; srcSet: { src: string; width: number }[] }
>;

/**
 * Regla de publicación: una foto real se muestra si no tiene personas
 * reconocibles o si hay autorización; una generada, solo mientras el flag de
 * imágenes ilustrativas esté activo. Si no hay archivo, no hay imagen.
 */
export function isPublishable(item: MediaItem): boolean {
  if (item.generated) return siteConfig.flags.showIllustrativeMedia;
  return !item.identifiablePeople || item.authorized;
}

export function getMedia(id: MediaId | undefined): MediaItem | null {
  if (!id) return null;
  const m = meta[id];
  const size = measured[id];
  if (!m || !size) return null;
  const item: MediaItem = { id, ...m, ...size };
  return isPublishable(item) ? item : null;
}

/** Para el README y la revisión: todo lo que hay que reemplazar o autorizar. */
export function pendingMedia(): { id: MediaId; note: string; reason: string }[] {
  return Object.entries(meta)
    .filter(([, m]) => m.generated || !m.authorized)
    .map(([id, m]) => ({
      id,
      note: m.sourceNote,
      reason: m.generated ? "Generada con IA" : "Falta autorización del artista",
    }));
}
