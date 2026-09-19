import { defineConfig } from "vite";

// Rutas relativas para que el build funcione servido desde cualquier subcarpeta.
export default defineConfig({
  base: "./",
  // El .glb de la luna viaja incrustado en el bundle: así la página funciona
  // servida desde cualquier lado, incluso donde no se sirven archivos binarios.
  assetsInlineLimit: 300 * 1024,
  assetsInclude: ["**/*.glb", "**/*.glb?inline"],
});
