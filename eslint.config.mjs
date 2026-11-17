import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
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
