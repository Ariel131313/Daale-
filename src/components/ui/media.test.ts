/**
 * Las imágenes generadas con IA nunca se muestran como si fueran trabajos
 * reales: donde aparezcan (landing o tarjetas del configurador) llevan la
 * leyenda «Imagen ilustrativa». Las fotos reales no la llevan.
 *
 * Ejecutar: npx tsx --test src/components/ui/media.test.ts
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { getMedia, mediaIds } from "@/config/media";
import { siteConfig } from "@/config/site";
import type { MediaId } from "@/lib/types";
import { ChoiceCard } from "./ChoiceCard";
import { MediaImage } from "./Media";

const CAPTION = "Imagen ilustrativa";
const published = mediaIds.filter((id) => getMedia(id) !== null);
const generated = (id: MediaId) => getMedia(id)?.generated === true;

function card(image: MediaId): string {
  return renderToStaticMarkup(
    createElement(ChoiceCard, {
      id: "prueba",
      name: "prueba",
      type: "checkbox",
      checked: false,
      onChange: () => {},
      title: "Servicio",
      image,
    })
  );
}

describe("leyenda de las imágenes ilustrativas", () => {
  test("hay imágenes generadas y reales publicadas para probar", () => {
    assert.ok(siteConfig.flags.showIllustrativeMedia, "la versión de revisión muestra las ilustrativas");
    assert.ok(published.some(generated));
    assert.ok(published.some((id) => !generated(id)));
  });

  test("cada imagen generada lleva la leyenda, en la landing y en las tarjetas", () => {
    for (const id of published.filter(generated)) {
      assert.ok(renderToStaticMarkup(createElement(MediaImage, { id })).includes(CAPTION), `landing: ${id}`);
      assert.ok(card(id).includes(CAPTION), `tarjeta: ${id}`);
    }
  });

  test("dentro de una tarjeta la imagen es decorativa: el lector de pantalla anuncia primero la opción", () => {
    for (const id of published) {
      const html = card(id);
      assert.match(html, /<figure[^>]*aria-hidden="true"/, id);
      assert.match(html, /<img[^>]*alt=""/, id);
    }
  });

  test("las fotos reales no la llevan", () => {
    for (const id of published.filter((id) => !generated(id))) {
      assert.ok(!card(id).includes(CAPTION), id);
    }
  });
});
