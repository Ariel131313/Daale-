import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Material de trabajo que no es código del sitio (no se publica).
    "RA/**",
    "lua 3d/**",
    "media-fuente/**",
    "FOTOS DAALE/**",
    "FOTOS NOCHE MAGIC/**",
    "Precios/**",
    "instrucciones/**",
    "triptico/**",
  ]),
]);

export default eslintConfig;
