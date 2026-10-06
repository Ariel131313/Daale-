# Daale y Noche Magik

Sitio de las dos marcas hermanas:

- **Daale**: personajes, animación, deco y experiencias para familias, celebraciones, empresas, shoppings, cines, comercios y marcas.
- **Noche Magik**: shows y experiencias para fiestas de 15 y de 18, casamientos, boliches y eventos de empresa.

Quien entra elige la marca, arma su evento en pocos pasos y lo manda por WhatsApp con un mensaje ordenado. No hay cuentas, pagos ni precios automáticos: la cotización la hace una persona.

Versión de revisión publicada: <https://ariel131313.github.io/Daale-/>

## Instalar y correr

Hace falta Node 20 o más nuevo (la publicación usa Node 22) y npm.

```bash
npm install
npm run dev
```

El sitio queda en <http://localhost:3000>.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en vivo. |
| `npm run build` | Genera el sitio estático en `out/`. |
| `npm start` | Sirve `out/` como lo publica GitHub Pages (ver [Publicación](#publicación)). |
| `npm test` | Pruebas de la lógica: separación de públicos, configurador, mensaje de WhatsApp, Lead, almacenamiento. |
| `npm run lint` | Revisión de estilo y errores comunes. |
| `npm run imagenes` | Optimiza las fotos de `media-fuente/` a WebP (ver [Fotos e imágenes](#fotos-e-imágenes)). |

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Portada neutral: «¿Qué tipo de evento estás imaginando?» con una tarjeta por marca. No redirige por hora, edad ni campaña. |
| `/daale/` | Landing de Daale. |
| `/daale/armar/` | Configurador de Daale. Con `?para=empresa` muestra primero las opciones para empresas. |
| `/noche-magik/` | Landing de Noche Magik. |
| `/noche-magik/armar/` | Configurador de Noche Magik. |
| `/noche-magik/mayores/` | Recorrido separado para mayores de 18. Hoy muestra «Esta sección no está disponible» (ver [Público](#público-y-mayores-de-18)). |

Las campañas pueden enlazar directo a `/daale/` o `/noche-magik/`. Los parámetros `utm_*` se guardan durante la visita para el Lead, pero no van en el mensaje de WhatsApp.

## Qué se edita y dónde

Todo lo que cambia el contenido vive en `src/config/`. Los componentes no tienen textos de catálogo ni reglas de negocio propias.

| Qué | Archivo |
|---|---|
| Interruptores del sitio (precios, portfolio, sección 18+, imágenes ilustrativas, servicios sin confirmar, marcas de revisión, analítica) | `src/config/site.ts` |
| Nombre, logos, rutas, textos del hero, «Cómo funciona», Instagram, WhatsApp, analítica y encabezado del mensaje de cada marca | `src/config/brands.ts` |
| Tipos de evento, con su público y si piden datos de empresa o de edades | `src/config/eventTypes.ts` |
| Servicios, categorías, público y «pendiente de confirmar» | `src/config/services.ts` |
| Tipos de evento y servicios exclusivos para mayores (aparte, ver [Público](#público-y-mayores-de-18)) | `src/config/adultos.ts` |
| Personajes | `src/config/characters.ts` |
| Sugerencias del paso 4: reglas por tipo de evento (`recommendations.ts`) y combinaciones de cada servicio (`pairsWith` en `services.ts`) | `src/config/recommendations.ts` y `src/config/services.ts` |
| Preguntas frecuentes | `src/config/faq.ts` |
| Rangos de presupuesto orientativo | `src/config/budgets.ts` |
| Fotos, textos alternativos y permisos | `src/config/media.ts` |
| Textos propios de las landings | `src/components/landing/content.ts` |
| Títulos e indicaciones de cada paso del configurador | `src/components/configurator/copy.ts` |
| Colores y tipografías | `src/app/globals.css` y [DESIGN.md](DESIGN.md) |

Lo que la marca todavía no confirmó se marca siempre:

- Los servicios y personajes con `pendingConfirmation: true` aparecen con la etiqueta «Pendiente de confirmar». Si apagás `showPendingServices`, dejan de ofrecerse en listados, tarjetas y sugerencias. El 30/09/2026 el cliente confirmó todos los servicios del catálogo, así que hoy no hay ninguno pendiente a la vista; el mecanismo queda para lo que se sume más adelante.
- Las preguntas frecuentes con `pendingPolicy: true` tienen respuestas neutrales que invitan a consultar. Mientras `showReviewBadges` esté encendido, llevan la etiqueta «Respuesta provisoria».

Todos los precios están en `null`, y `showPrices` sigue apagado.

## WhatsApp por marca

Cada marca tiene su número, y el configurador de una nunca escribe al de la otra.

| Marca | Variable de entorno | Valor actual |
|---|---|---|
| Daale | `NEXT_PUBLIC_WHATSAPP_DAALE` | `5492644398407` (264 439-8407) |
| Noche Magik | `NEXT_PUBLIC_WHATSAPP_NOCHE_MAGIK` | `5492646269681` (264 626-9681) |

Los dos números los confirmó el cliente. El número va con código de país y sin `+`, espacios ni guiones: `549` + característica + número. Si falta o está mal escrito, el sitio no enlaza a ningún chat: muestra «WhatsApp sin configurar» y deja copiar el mensaje. Los valores por defecto están en `src/config/brands.ts`; las variables de entorno los reemplazan al construir.

Hay dos formas de escribir:

- **«Hablar por WhatsApp»** abre el chat con un saludo corto.
- **«Enviar mi evento por WhatsApp»**, al final del configurador, manda el resumen completo. Solo incluye los datos que la persona completó.

## Logos

| Dónde | Archivo publicado | Original |
|---|---|---|
| Header, tarjetas y resumen de Daale | `public/brand/daale/daale-insta.webp` | `D:\WORKS\DALE!!\export\DAALE INSTA 02.png` |
| Todo Noche Magik | `public/brand/noche-magik/noche-magik.webp` | `LOGO NOCHE MAGICA.PNG` |

A las copias solo se les quitaron los márgenes 100% transparentes y se pasaron a WebP: el dibujo no cambió. En pantalla se muestran con `object-fit: contain`, sin filtros, sombras ni recortes.

El nombre del logo de Noche Magik es azul oscuro y no se lee sobre la noche. Por eso siempre se apoya en una placa clara color luna (`#EAF2FA`), y el header de Noche Magik es claro.

## Fotos e imágenes

| Carpeta | Contenido |
|---|---|
| `media-fuente/reales/` | Recortes de fotos reales: solo artistas con máscara o disfraz, sin chicos, invitados ni logos de terceros. Al hombre espejo se le tapó el cartel del local, y el mercenario quedó a medio cuerpo, sin los globos estampados con la máscara ni los regalos. La ilustración del chocolatero se amplió y se reencuadró en 3:2 sobre un fondo en el mismo estilo (`scripts/recomponer-chocolatero.py`). |
| `media-fuente/generadas/` | Imágenes ilustrativas hechas con ComfyUI. No se versionan en git porque se regeneran. |
| `public/media/` | Versiones WebP en 480, 960 y 1440 px que usa el sitio. |
| `src/config/mediaSizes.json` | Medidas de cada imagen. Lo escribe `npm run imagenes`. |

Cada imagen tiene una ficha en `src/config/media.ts`:

- `generated: true`: es ilustrativa. Se muestra con la leyenda «Imagen ilustrativa» y solo mientras `showIllustrativeMedia` esté encendido.
- `identifiablePeople: true`: aparece alguien reconocible. No se publica hasta marcar `authorized: true`, con el permiso por escrito de esas personas. Con menores, siempre con autorización de sus responsables.

**Para reemplazar una imagen por una foto real:**

1. Guardá la foto en `media-fuente/reales/` con el mismo nombre que la imagen actual (por ejemplo `daale-hero.jpg`).
2. Corré `npm run imagenes`.
3. En `src/config/media.ts`, cambiá la ficha: `generated: false`, `identifiablePeople` y `authorized` según corresponda, y un `sourceNote` que diga de dónde salió.

**Para regenerar las ilustrativas:** con ComfyUI escuchando en `127.0.0.1:8188` y los modelos Flux.2 Klein 4B (`flux-2-klein-base-4b-fp8`, `qwen_3_4b`, `flux2-vae`), corré `python scripts/generar-imagenes.py [id ...]` y después `npm run imagenes`. Las semillas son fijas: cada id sale siempre igual.

## Público y mayores de 18

Todas las listas de tipos de evento, servicios, personajes y sugerencias pasan por `src/lib/audience.ts`, y ningún componente filtra por su cuenta. Las reglas:

1. Lo exclusivo para mayores solo existe con `enableAdultCategory` encendido, solo en Noche Magik y solo en `/noche-magik/mayores/`, después de que la persona declare tener 18 años o más. Su catálogo vive aparte, en `src/config/adultos.ts`, y solo lo carga esa ruta: sus textos no viajan en el JavaScript de la portada, de Daale ni del recorrido general.
2. Lo pensado para adultos nunca se ofrece donde hay o puede haber menores. **Nocturno no es adulto**: una fiesta de 15 es un evento con menores.
3. El mensaje de WhatsApp y el Lead vuelven a aplicar estas reglas antes de armarse, aunque los datos lleguen sin pasar por el configurador.
4. Nada del recorrido para mayores se manda a Google ni a Meta.

La confirmación de edad es una autodeclaración: no es una verificación legal ni técnica, y el sitio lo dice así. Queda solo en la pestaña abierta, igual que las respuestas de ese recorrido. La sección no tiene imágenes, no la indexan los buscadores y el enlace de entrada aparece discreto al final de la landing de Noche Magik, solo con el interruptor encendido. Antes de encenderlo conviene revisar esos textos con un abogado.

Las pruebas de `src/lib/audience.test.ts` recorren todas las combinaciones de marca, modo, tipo de evento y servicio.

## Configurador

Tiene hasta cinco pasos visibles y un resumen, con «Paso X de Y»:

1. Tipo de evento.
2. Qué sumar, con la opción de contar la idea con palabras propias.
3. Fecha y lugar. La fecha puede ser tentativa o quedar sin definir. En empresas se pide empresa y objetivo. De los chicos solo se pide cuántos son y un rango de edad, nunca datos personales.
4. Sugerencias («Personajes que suman» en Noche Magik, «Ideas que suman» en Daale). Cambian según lo que se elige: primero va lo que combina con lo último que se marcó y después lo que sugieren las reglas del tipo de evento, con un máximo de cuatro. Solo aparece si hay algo para sugerir, o si ya se sumó alguna (así siempre se puede sacar), y nunca promete disponibilidad.
5. Nombre, que es obligatorio, y presupuesto orientativo opcional, con «Prefiero conversarlo».

Las respuestas se guardan en el navegador, por marca, durante 14 días, y se pueden borrar con «Borrar respuestas y empezar de nuevo». Recargar o usar el botón Atrás no hace perder nada.

Un cambio de tipo de evento se confirma al tocar «Continuar». Recorrer las opciones, con el mouse o con las flechas del teclado, no borra nada de lo ya cargado. Recién al confirmar se ajusta lo que el nuevo tipo no admite.

## Lead

Al tocar «Enviar mi evento por WhatsApp» se arma un objeto `Lead` con los campos del brief y `status: "new_lead"` (`src/lib/lead.ts`). Hoy no se envía a ningún servidor: pasa por `noopLeadSink`, que es el punto para conectar un CRM más adelante. El sitio nunca dice que la consulta quedó guardada: solo avisa que se abrió WhatsApp.

## Analítica

Sin IDs configurados no se carga ningún script y no aparece el aviso de consentimiento. Cada marca puede tener sus propias cuentas, y además puede haber unas compartidas para todo el sitio. Se definen al construir:

| Variable | Recibe |
|---|---|
| `NEXT_PUBLIC_GA4_ID_DAALE`, `NEXT_PUBLIC_META_PIXEL_ID_DAALE` | Solo los eventos de Daale. |
| `NEXT_PUBLIC_GA4_ID_NOCHE_MAGIK`, `NEXT_PUBLIC_META_PIXEL_ID_NOCHE_MAGIK` | Solo los eventos de Noche Magik. |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Todos los eventos, portada incluida (opcional). |

Cómo funciona:

- GA4 y Meta se cargan recién cuando la persona acepta en el aviso.
- Lo que pasa antes de decidir (por ejemplo, la visita a la landing) espera en memoria: se manda si acepta y se descarta si no.
- El pie de página tiene «Preferencias de medición» para cambiar la decisión. Si alguien que había aceptado dice que no, la página se recarga para que los scripts dejen de medir.
- El interruptor `enableAnalytics` de `src/config/site.ts` apaga todo aunque haya IDs.

Los eventos son `landing_view`, `brand_selected`, `configurator_started`, `client_type_selected`, `service_selected`, `character_selected`, `configuration_completed` y `whatsapp_clicked`. Llevan marca, tipo de evento, ids de servicios y personajes, cantidades y si hay fecha o presupuesto. Nunca llevan nombres, notas, teléfonos, fechas exactas ni datos de menores. Del recorrido para mayores no se manda nada.

## Publicación

Cada push a `main` corre `.github/workflows/deploy.yml`: instala, corre las pruebas, construye con el prefijo del repositorio y publica en GitHub Pages. En GitHub, en *Settings → Pages → Build and deployment*, la fuente tiene que ser **GitHub Actions**.

Para ver en tu máquina exactamente lo que se publica:

```bash
NEXT_PUBLIC_BASE_PATH=/Daale- npm run build
npm start -- --base Daale-
```

y abrí <http://localhost:4173/Daale-/>. En Windows, la primera línea conviene correrla en PowerShell, porque Git Bash convierte `/Daale-` en una ruta de disco: `$env:NEXT_PUBLIC_BASE_PATH='/Daale-'; npm run build`.

Con dominio propio:

- Sacá el prefijo.
- Definí `NEXT_PUBLIC_SITE_URL` (por ejemplo `https://daale.com.ar`) para que el sitemap y las vistas previas al compartir usen direcciones completas.

## Antes de abrirlo al público

- [ ] Apagar `showReviewBadges`.
- [ ] Reemplazar las imágenes ilustrativas por fotos reales, o apagar `showIllustrativeMedia`.
- [ ] Completar o quitar las respuestas provisorias de las preguntas frecuentes.
- [ ] Sumar los textos legales: aviso de privacidad y términos.
- [ ] Configurar dominio, `NEXT_PUBLIC_SITE_URL` e IDs de analítica.

## Decisiones visuales tomadas de cada logo

**Daale**

- La paleta sale del logo: rojo `#EA3030`, violeta `#7E4296` y azul `#007EC0`.
- Para textos y botones se usan versiones más oscuras que pasan contraste AA: violeta `#6B2F86`, rojo `#C42424` y azul `#0068A3`. Los tonos originales quedan para detalles.
- El fondo es cálido y luminoso (`#FFFBF6`), con superficies lavanda suaves. La barra negra de la variante con usuario de Instagram no se tomó como color de marca.
- Los títulos van en Fredoka, redondeada como las letras del logo.
- El motivo es confeti en los tres colores del logo: pocas piezas, en bordes y separadores.

**Noche Magik**

- La paleta sale de la luna y el nombre: azul noche `#0B1630`, azul lunar `#9BD0F0` para los botones (con texto `#06142B`) y dorado medido `#F2C14E` solo para foco y selección.
- Nunca va azul oscuro sobre negro ni dorado de bajo contraste.
- Como el nombre del logo es azul `#003870` y sobre la noche da 1,5:1, el logo siempre se apoya en una placa color luna `#EAF2FA`, y el header es claro, «luz de luna».
- Los títulos van en Young Serif, en su único peso, sin negrita inventada. Es una serif blanda y editorial que acompaña el nombre del logo.
- El motivo son estrellas de cuatro puntas como las del logo, azules y doradas, pocas y quietas.

**Portada**: fondo neutral cálido que pasa suave a un crepúsculo lavanda, sin pantalla partida. El confeti va solo en la tarjeta de Daale y las estrellas solo en la de Noche Magik.

## Datos pendientes

| Qué falta | Estado |
|---|---|
| Show para público adulto | Es el único servicio que sigue «pendiente de confirmar»: está oculto junto con toda la sección para mayores. Definir qué se ofrece antes de encenderla. |
| Precios | No se muestran. Los rangos de presupuesto son orientativos y hay que validarlos. |
| Fotos reales | El cliente las va a ir cargando de a poco. Faltan para reemplazar las 13 ilustrativas hechas con ComfyUI (hero y servicios de las dos marcas, empresas y ambientación) y la ilustración del chocolatero, que parece hecha con IA a partir de una foto de un evento. También hace falta el permiso de los artistas de los 7 recortes reales, aunque estén disfrazados. |
| Políticas comerciales | Anticipación para reservar, duración, zonas y forma de reserva y pago. Hoy son respuestas provisorias en las preguntas frecuentes de las dos marcas. |
| Textos legales | Aviso de privacidad (analítica, WhatsApp) y términos. Revisión legal de la sección 18+ antes de encenderla. |
| Dominio | Pendiente. Mientras tanto se publica en GitHub Pages. |
| Analítica | IDs de GA4 y Meta Pixel. |
| Logos | Versión compacta y transparente de Daale sin el usuario de Instagram, para el header y el ícono del navegador. |
| Material del brief no recibido | `project_sources/01-DAALE-INSTA22.png` (versión apaisada), `project_sources/02-DAALE-INSTA.png`, `image.png`, `image(1).png`, `image(2).png` y `project_sources/03-Megaprompt-IA-CM-en-Argentina.txt`. |

## Más contexto

- [PRODUCT.md](PRODUCT.md): el negocio, el público y el tono.
- [DESIGN.md](DESIGN.md): colores, tipografías, motivos y accesibilidad.
- El prototipo anterior, con hero 3D y pantalla partida, quedó en la etiqueta git `prototipo-3d-hero`.
