// Datos legales comunes: la ley de protección de datos de cada país, la autoridad ante la que se reclama y las
// versiones vigentes de los textos. Viven en shared/ porque los usan dos módulos: el formulario (autorizaciones que
// acepta la persona, con su versión) y las páginas legales (/privacidad y /terminos).
// [TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA]: al cambiar un texto aprobado, cambia también su versión.
import type { PaisSlug } from "./paises";

export const RESPONSABLE = "Fundación ROFÉ";

export type LeyDatos = { ley: string; autoridad: string };

export const LEY_DATOS: Record<PaisSlug, LeyDatos> = {
  uy: { ley: "Ley 18.331 de Protección de Datos Personales", autoridad: "la Unidad Reguladora y de Control de Datos Personales (URCDP)" },
  col: { ley: "Ley 1581 de 2012", autoridad: "la Superintendencia de Industria y Comercio" },
  ecu: { ley: "Ley Orgánica de Protección de Datos Personales (LOPDP) de 2021", autoridad: "la Superintendencia de Protección de Datos Personales" },
  pan: { ley: "Ley 81 de 2019", autoridad: "la Autoridad Nacional de Transparencia y Acceso a la Información (ANTAI)" },
};

/** Versiones vigentes de las páginas legales. La de privacidad es la misma que acepta la persona en el formulario. */
export const VERSION_PRIVACIDAD = "privacidad-2027-provisional-1";
export const VERSION_TERMINOS = "terminos-2027-provisional-1";
/** Fecha desde la que rigen los textos provisionales (AAAA-MM-DD). */
export const VIGENTE_DESDE = "2026-11-17";
