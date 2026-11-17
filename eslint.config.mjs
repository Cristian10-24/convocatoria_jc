import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Las fotos ya vienen en dos tamaños (800 y 1600 px, en webp) y se sirven con srcset: no hace falta next/image,
    // que además cobra por optimización en Vercel.
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Material de referencia (solo lectura) y vista previa temporal del diseño.
    "_design-ref/**",
    "_preview-vista/**",
    // Material de diseño sin versionar (HTML exportado con scripts enormes): si se revisa, el lint agota la memoria.
    "Diseno-convocatoria/**",
    "Reforma-entrega-convocatoria-jc/**",
    "entrega-convocatoria-jc/**",
    "JovenesCreaTIvos_2027_Diseno/**",
    "capturas/**",
  ]),
]);
