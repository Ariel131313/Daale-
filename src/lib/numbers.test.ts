/**
 * Cantidades escritas a mano. La misma función la usan la validación, las
 * sugerencias y el Lead: si una la acepta, las otras leen el mismo número.
 *
 * Ejecutar: npx tsx --test src/lib/numbers.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseCount } from "@/lib/numbers";

describe("parseCount", () => {
  test("enteros positivos, con o sin punto de miles", () => {
    const cases: [string, number][] = [
      ["1", 1],
      ["40", 40],
      [" 40 ", 40],
      ["01", 1],
      ["1500", 1500],
      ["1.500", 1500],
      ["12.345", 12345],
      ["99.999", 99999],
      ["99999", 99999],
    ];
    for (const [value, expected] of cases) {
      assert.equal(parseCount(value), expected, `«${value}»`);
    }
  });

  test("lo que no es una cantidad devuelve null", () => {
    for (const value of [
      "",
      "   ",
      "0",
      "00",
      "0.500",
      "-5",
      "+5",
      "3.5",
      "1.5",
      "1.50",
      "2,5",
      "1,500",
      "1 500",
      "123.456",
      "1.500.000",
      "100000",
      "1e3",
      "0x10",
      "Infinity",
      "NaN",
      "abc",
      "40 personas",
      "٤٠",
    ]) {
      assert.equal(parseCount(value), null, `«${value}»`);
    }
  });
});
