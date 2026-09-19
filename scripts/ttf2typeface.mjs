// Convierte un TTF al formato typeface.json que consume el FontLoader de three.
import opentypePkg from "opentype.js";
import { writeFileSync, readFileSync } from "node:fs";

const opentype = opentypePkg.default ?? opentypePkg;

const [, , entrada, salida, glifosPedidos] = process.argv;
const font = opentype.parse(readFileSync(entrada).buffer);
const scale = (1000 * 100) / ((font.unitsPerEm || 1000) * 72);

const usar = new Set((glifosPedidos || "").split(""));
const glyphs = {};

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);
  const char = glyph.unicode !== undefined ? String.fromCodePoint(glyph.unicode) : null;
  if (!char || (usar.size && !usar.has(char))) continue;

  const token = { ha: Math.round(glyph.advanceWidth * scale), x_min: 0, x_max: 0, o: "" };
  const path = glyph.getPath(0, 0, 1000 / (font.unitsPerEm || 1000) * 72 * (scale / (1000 * 100 / ((font.unitsPerEm||1000) * 72))));
  const cmds = glyph.path.commands;
  const s = scale;
  const out = [];
  let minX = Infinity;
  let maxX = -Infinity;
  const track = (x) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  };

  for (const c of cmds) {
    if (c.type === "M") {
      out.push("m", Math.round(c.x * s), Math.round(c.y * s));
      track(c.x * s);
    } else if (c.type === "L") {
      out.push("l", Math.round(c.x * s), Math.round(c.y * s));
      track(c.x * s);
    } else if (c.type === "Q") {
      out.push("q", Math.round(c.x * s), Math.round(c.y * s), Math.round(c.x1 * s), Math.round(c.y1 * s));
      track(c.x * s);
    } else if (c.type === "C") {
      out.push(
        "b",
        Math.round(c.x * s),
        Math.round(c.y * s),
        Math.round(c.x1 * s),
        Math.round(c.y1 * s),
        Math.round(c.x2 * s),
        Math.round(c.y2 * s)
      );
      track(c.x * s);
    } else if (c.type === "Z") {
      out.push("z");
    }
  }

  token.o = out.join(" ");
  token.x_min = Number.isFinite(minX) ? Math.round(minX) : 0;
  token.x_max = Number.isFinite(maxX) ? Math.round(maxX) : 0;
  glyphs[char] = token;
  void path;
}

const salidaJSON = {
  glyphs,
  familyName: font.names.fontFamily?.en || "Font",
  ascender: Math.round((font.ascender || 800) * scale),
  descender: Math.round((font.descender || -200) * scale),
  underlinePosition: -100,
  underlineThickness: 50,
  boundingBox: { yMin: -200, xMin: -100, yMax: 900, xMax: 1000 },
  resolution: 1000,
  original_font_information: { format: 0 },
  cssFontWeight: "normal",
  cssFontStyle: "normal",
};

writeFileSync(salida, JSON.stringify(salidaJSON));
console.log("glifos:", Object.keys(glyphs).length, "→", salida);
