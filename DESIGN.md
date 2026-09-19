# DESIGN.md — DAALE!! / Noche Magik

## Estrategia de color

**Full palette**, dividida en dos mundos que comparten una costura.

Los colores no se eligieron: se leyeron del logo sticker de DAALE, del tríptico impreso y del logo de la luna de Noche Magik.

### DAALE (mitad de día)

| Rol | Valor | Uso |
|---|---|---|
| Papel | `oklch(99% 0.004 250)` | Fondo de la mitad izquierda |
| Rojo | `#c62828` | Letra del logo, fichas de personaje |
| Violeta | `#6a2c91` | Títulos de plan, fichas de coordinador |
| Azul | `#1e7fc2` | Acción primaria, encabezados |
| Oro | `#e8b93b` | Foco, marca de "estimado" |
| Tinta | `#16283d` | Texto |

### Noche Magik (mitad de noche)

| Rol | Valor | Uso |
|---|---|---|
| Negro | `#000000` | Fondo, pedido explícito del cliente |
| Navy | `#0a1626` | Superficies elevadas |
| Luna | `#6fa8d6` | Títulos, enlaces |
| Oro | `#f5c25b` | Acento, bordes de botón |
| Lavanda | `#9b9be0` | Chispas de fuegos artificiales |
| Texto | `#e6edf7` | Cuerpo |

### La costura

`#7ec8f0` celeste en el centro exacto. Es la zona de decisión: de blanco a celeste a negro. No es decoración, es la interfaz para elegir marca.

## Tipografía

Dos familias que nunca conviven en el mismo mundo. Son las dos identidades, no dos estilos.

- **Fredoka** (500/600/700) — display de DAALE. Redonda e inflada, del mismo lenguaje que el logo sticker.
- **Prata** (400) — display de Noche Magik. Serif de contraste alto, la letra del logo de la luna.
- **Nunito** (400/600/700) — cuerpo y formulario en los dos mundos. Elegida por legibilidad a los 50 años en un celular.

Escala con contraste ≥1.25. Cuerpo con piso de 16px en los inputs, para que iOS no haga zoom al enfocar.

## Forma

- Radio de pastilla (`999px`) en botones y chips: es el sistema de Disney y el del logo.
- Radio grande (1.1–2.5rem) en tarjetas y campos. Nada de esquinas duras.
- Bordes de 2px visibles en vez de sombras blandas. La marca es de sticker, no de vidrio.
- Sombras solo donde hay elevación real: botones y el flotante de WhatsApp.

## Movimiento

- Un solo momento orquestado: la bienvenida, cuando estallan confeti y fuegos de los dos lados a la vez.
- El resto responde a la persona: click, arrastre, scroll, hover.
- Parallax en la costura, con los logos a distinta profundidad.
- Todo respeta `prefers-reduced-motion`.

## Componentes

- **Tripulación** (`.crew`): cada plan se ve como su equipo, con fichas de personaje y coordinador. Reemplaza la grilla de tarjetas iguales.
- **Ficha de personaje** (`.personaje`): foto 4:3, nombre y una línea de dónde funciona mejor. Los que no van con la franja elegida bajan de opacidad pero siguen disponibles.
- **Campo** (`.campo`): bloque blanco con radio grande, leyenda en Fredoka violeta.
- **Opción** (`.opcion`): radio oculto y pastilla visible.
- **Marca de estimado** (`.estimado`): pastilla ámbar sobre el precio no confirmado.

## Prohibiciones de este proyecto

- Nada de `#000` ni `#fff` fuera de los dos fondos que el cliente pidió explícitamente (blanco de DAALE, negro de Noche Magik).
- Nada de tarjetas anidadas.
- Nada de gradientes como decoración: el único gradiente de la página es la costura, y es funcional.
- El 3D nunca captura el puntero ni se pone delante del texto.
