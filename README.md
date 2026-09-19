# DAALE!! y Noche Magik

Sitio web de las dos marcas. De día **DAALE!! Animación y Deco**, de noche **Noche Magik**.

El objetivo es que el cliente arme su propio pedido y lo mande listo por WhatsApp, en vez del ida y vuelta por mensaje directo de Instagram.

## Para mirar la página

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`.

## Qué está hecho

- **Hero partido**: DAALE de día a la izquierda, Noche Magik de noche a la derecha, con el degradado de decisión en el medio. Se arrastra la costura o se usan los botones para elegir marca.
- **Los dos logos en 3D**, modelados, que giran sobre su eje al pasarles el puntero y vuelven al punto de partida en 6 segundos.
- **Confeti y fuegos artificiales** con física, que responden al mouse y estallan al hacer clic.
- **Los tres planes** con su equipo visible, respetando la regla de un coordinador cada dos personajes.
- **Ficha de contratación**: siete campos que arman el mensaje y lo mandan al WhatsApp que corresponde según el horario elegido.
- **Catálogo de nueve personajes** con foto y recomendación de en qué franja funciona mejor.

## Qué falta

- **Precio real del VIP.** Hoy figura $190.000 marcado como *estimado*, calculado a partir de la escalera de los otros dos planes. Nadie debería cotizar con ese número hasta confirmarlo.
- La sección de **empresas**, que tiene los precios listos en las propuestas comerciales.
- El contenido de las **tres franjas horarias** del tríptico impreso: desayunos y mensajería a la mañana; efemérides, estatuas vivientes, cascada de chocolate y cotillón a la tarde.
- El **módulo de edición de precios** protegido con contraseña. Por ahora los precios viven en un objeto al principio de `src/main.js`.

## Contexto del proyecto

- [PRODUCT.md](PRODUCT.md) — qué es el negocio, a quién le habla la página y con qué tono.
- [DESIGN.md](DESIGN.md) — colores, tipografías y decisiones de forma, todas sacadas del logo y del tríptico impreso.

## Estructura

```
index.html          La página entera
src/main.js         Escena 3D, confeti, fuegos, ficha de contratación y precios
src/style.css       Estilos
src/*.glb           Los dos logos en 3D, optimizados para web
public/personajes/  Fotos del catálogo
scripts/            Herramientas para regenerar los modelos 3D desde los originales
```

El material pesado del cliente (los FBX de realidad aumentada y los GLB sin optimizar, unos 400 MB) queda fuera del repositorio. Los modelos que el sitio usa están en `src/`, y `scripts/` tiene lo necesario para rehacerlos.
