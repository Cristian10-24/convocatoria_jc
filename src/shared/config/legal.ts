// Datos legales comunes: la ley de protección de datos de cada país, la autoridad ante la que se reclama y las
// versiones vigentes de los textos. Viven en shared/ porque los usan dos módulos: el formulario (autorizaciones que
// acepta la persona, con su versión) y las páginas legales (/privacidad y /terminos).
// [TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA]: al cambiar un texto aprobado, cambia también su versión.
import type { PaisSlug } from "./paises";

export const RESPONSABLE = "Fundación ROFÉ";

/** Política de Tratamiento de Datos oficial de la Fundación ROFÉ, publicada en su sitio (PDF). */
export const POLITICA_OFICIAL = {
  url: "https://tocaunavida.org/wp-content/uploads/2024/01/2.-DE-010-D-Politica-de-Tratamiento-de-datos.pdf",
  texto: "Consulta la Política de Tratamiento de Datos oficial de la Fundación ROFÉ (PDF)",
  corto: "Política de Tratamiento de Datos de la Fundación ROFÉ (PDF)",
} as const;

/**
 * Marcas de lo pendiente en los textos legales ("[POR CONFIRMAR]", "[TEXTO LEGAL PROVISIONAL…]"). En `false` (sitio
 * publicado) no se muestran: los textos no cambian, solo cómo se ven (ver `sinMarcas`).
 */
export const MOSTRAR_MARCAS_LEGALES = false;

const MARCA = /\[[^\]]+\]/;

/**
 * Texto sin marcas pendientes, para mostrarlo. Una oración que es solo "Rótulo: [MARCA]." (rótulo corto) se quita
 * entera; en una oración más larga solo se quita ": [MARCA]" y queda la oración. Sin marcas, el texto queda igual.
 */
export function sinMarcas(texto: string): string {
  if (!MARCA.test(texto)) return texto;
  const oraciones = texto.match(/[^.]+(?:\.|$)/g) ?? [texto];
  return oraciones
    .map((o) => {
      if (!MARCA.test(o)) return o;
      const antes = o.split(/:?\s*\[/)[0]!.trim();
      if (antes.split(/\s+/).length <= 8) return "";
      return o.replace(/:?\s*\[[^\]]+\]/g, "");
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** La marca de texto provisional sin corchetes: el aviso se mantiene, pero no como dato pendiente. */
export const avisoProvisional = (marca: string): string => marca.replace(/^\[|\]$/g, "");

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
