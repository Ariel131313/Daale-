import type { BrandId } from "@/lib/types";
import styles from "./home.module.css";

/**
 * Cómo se ve cada marca dentro de la portada neutral. Los textos, logos y
 * rutas salen de config/brands.ts; acá solo se decide la presentación.
 */
export interface HomeLook {
  /** Clase del CSS module con el fondo de la tarjeta de la marca. */
  card: string;
  /** Young Serif tiene un solo peso: pedirle negrita la deformaría. */
  titleWeight: string;
  /** Tipografía del nombre de la marca en el pie, sobre fondo claro. */
  nameFont: string;
  /** Alto del logo en el escenario de la tarjeta, de celular a escritorio. */
  logoHeight: number;
  logoClassName: string;
  plateClassName: string;
}

export const homeLooks: Record<BrandId, HomeLook> = {
  daale: {
    card: styles.daale,
    titleWeight: "font-semibold",
    nameFont: "font-display font-semibold",
    logoHeight: 112,
    // El logo pide su alto por prop; estas clases lo achican en pantallas chicas.
    logoClassName: "h-18! sm:h-21! md:h-22! lg:h-28!",
    plateClassName: "",
  },
  "noche-magik": {
    card: styles.noche,
    titleWeight: "font-normal",
    nameFont: "font-(family-name:--font-young-serif) font-normal",
    logoHeight: 152,
    logoClassName: "h-24! sm:h-28! md:h-32! lg:h-38!",
    plateClassName: `${styles.moonPlate} p-2.5 sm:p-3 lg:p-4`,
  },
};
