/**
 * Cantidad de personas escrita a mano: "40", "1500" o "1.500" (con punto de
 * miles, como se escribe en Argentina). Devuelve null si no es un entero
 * positivo de hasta 99.999. La usan la validación, las sugerencias y el Lead,
 * así los tres leen el mismo número.
 */
export function parseCount(value: string): number | null {
  const v = value.trim();
  if (!/^(\d{1,5}|[1-9]\d?\.\d{3})$/.test(v)) return null;
  const n = Number(v.replace(".", ""));
  return n > 0 && n <= 99999 ? n : null;
}
