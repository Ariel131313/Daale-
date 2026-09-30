import { withBase } from "@/lib/paths";
import type { LogoAsset } from "@/lib/types";

/**
 * Logo original, sin redibujar ni recolorear: object-fit contain y proporción
 * intacta. Si el logo pide una superficie (el de Noche Magik necesita fondo
 * claro para que se lea su nombre), se apoya sobre esa placa.
 */
export function BrandLogo({
  logo,
  height,
  className = "",
  plateClassName = "",
  priority = false,
}: {
  logo: LogoAsset;
  /** Alto en píxeles CSS; el ancho sale de la proporción del archivo. */
  height: number;
  className?: string;
  plateClassName?: string;
  priority?: boolean;
}) {
  const width = Math.round((logo.width / logo.height) * height);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- el logo se sirve tal cual, sin optimizador
    <img
      src={withBase(logo.src)}
      alt={logo.alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`block object-contain ${className}`}
      style={{ height, width: "auto", maxWidth: "100%" }}
    />
  );
  if (!logo.plate) return img;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl ${plateClassName}`}
      style={{ background: logo.plate }}
    >
      {img}
    </span>
  );
}
