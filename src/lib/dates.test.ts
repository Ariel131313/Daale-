/**
 * Fechas del configurador: siempre locales y con el formato del campo de fecha.
 *
 * Ejecutar: npx tsx --test src/lib/dates.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isISODate, todayISO } from "@/lib/dates";

describe("todayISO", () => {
  test("usa el día local, con ceros a la izquierda", () => {
    assert.equal(todayISO(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    assert.equal(todayISO(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
  });
});

describe("isISODate", () => {
  test("acepta días reales en formato aaaa-mm-dd", () => {
    for (const value of ["2026-09-24", "2028-02-29", "2026-12-31", "2027-01-01"]) {
      assert.equal(isISODate(value), true, value);
    }
  });

  test("rechaza otros formatos, días inexistentes y lo que no es texto", () => {
    for (const value of [
      "",
      "zzz",
      "12/10/2026",
      "2026-9-5",
      "2026-02-30",
      "2027-02-29",
      "2026-13-01",
      "2026-00-10",
      "2026-06-31",
      "2026-10-12T10:00",
      " 2026-10-12",
      null,
      undefined,
      20261012,
    ]) {
      assert.equal(isISODate(value), false, String(value));
    }
  });
});
