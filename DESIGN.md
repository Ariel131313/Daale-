# DESIGN.md · Daale y Noche Magik

Los tokens viven en `src/app/globals.css` y cada ruta los aplica con `data-brand`. Son una propuesta derivada de los logos, no un manual de marca oficial.

## Colores

Medidos sobre los archivos originales de los logos.

| Marca | Del logo | Uso en la interfaz |
|---|---|---|
| Daale | rojo `#EA3030`, violeta `#7E4296`, azul `#007EC0` | Fondo cálido `#FFFBF6`, lavanda `#F6F1FA`, texto `#221A2E`. Botón principal violeta oscuro `#6B2F86` (8,8:1 con blanco). Rojo y azul de texto oscurecidos a `#C42424` y `#0068A3` para pasar AA. |
| Noche Magik | luna `#58A8D0`, nombre `#003870`, estrellas doradas | Fondo azul noche `#0B1630`, superficies `#14254A`, texto `#F4F7FC`. Botón principal azul lunar `#9BD0F0` con texto `#06142B` (11:1). Dorado `#F2C14E` para foco y selección; en el header claro el foco es azul noche `#0B1630`, porque el dorado sobre la luna no se ve (1,5:1). |
| Portada | — | Neutral cálido `#FBF8F4` con un pasaje suave hacia el crepúsculo. |

**Hallazgo clave:** el logo de Noche Magik es transparente y su nombre es azul `#003870`. Sobre la noche da 1,5:1 y no se lee. Por eso el header de Noche Magik es claro ("luz de luna", `#EAF2FA`) y el logo siempre se apoya en esa superficie. No se recolorea.

## Tipografía

- **Fredoka**: títulos de Daale y de la portada. Redondeada, del mismo lenguaje que las letras del logo.
- **Young Serif**: títulos de Noche Magik. Serif blanda, compatible con el nombre del logo, más editorial.
- **Atkinson Hyperlegible Next**: todo el texto funcional de las dos marcas. Diseñada para máxima legibilidad; pensada para quien lee desde el celular a cualquier edad.

Cuerpo de 17px. Textos secundarios de 16px como mínimo, y campos nunca por debajo de 16px (evita el zoom de iOS). Solo las etiquetas cortas («Imagen ilustrativa», «Pendiente de confirmar») bajan a 14px.

Young Serif tiene un único peso: el sitio desactiva la negrita sintética (`font-synthesis-weight: none`), así un `font-semibold` nunca la deforma.

## Motivos

- **Daale: confeti** en rojo, violeta y azul.
- **Noche Magik: estrellas** azules y doradas de cuatro puntas, como las del logo.

Nunca juntos en un mismo elemento. Pocos, con opacidad moderada, sin tapar texto ni controles. Aparecen en tarjetas, separadores, progreso y confirmación del configurador.

Sus colores se definen una sola vez, en `:root` de `globals.css`: `--confetti-red`, `--confetti-violet` y `--confetti-blue` para Daale; `--star-gold`, `--star-blue` y `--star-lavender` para Noche Magik. Cambiarlos ahí cambia todos los motivos.

## Accesibilidad

Contraste AA o mejor en todo el texto, áreas táctiles de 44px, etiquetas siempre visibles, errores escritos junto al campo, foco visible, nada que dependa solo del color o del hover, movimiento reducido respetado.

El WhatsApp flotante solo aparece en las landings, después del hero, y se esconde cuando llega a su zona una sección marcada con `data-sin-flotante`: preguntas frecuentes, cierre, pie y el botón de empresas. Esas secciones ya tienen su propio WhatsApp y el flotante taparía filas o botones de ancho completo. En el configurador no aparece.

## Logos: qué variante va dónde

| Lugar | Archivo publicado | Original |
|---|---|---|
| Header y tarjetas de Daale | `public/brand/daale/daale-insta.webp` | `export/DAALE INSTA 02.png` |
| Todo Noche Magik | `public/brand/noche-magik/noche-magik.webp` | `LOGO NOCHE MAGICA.PNG` |

A las copias solo se les quitaron márgenes 100% transparentes y se las pasó a WebP; el dibujo no cambió. **Pendiente:** versión compacta y transparente del logo de Daale sin el usuario de Instagram, para el header y el favicon.
