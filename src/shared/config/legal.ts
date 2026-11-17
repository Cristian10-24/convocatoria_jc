// Datos legales comunes, tomados de la política oficial de la Fundación ROFÉ: "Política de Tratamiento de Datos y
// Aviso de Privacidad de sus Datos Personales" (DE-010-D, versión 1, 20/11/2023). Una sola política para los 4 países.
// Viven en shared/ porque los usan dos módulos: el formulario (autorizaciones, con su versión) y /privacidad.
// Si la Fundación publica otra versión del documento, se actualiza aquí y se sube la versión de las autorizaciones:
// las inscripciones nuevas quedan con la nueva y las ya guardadas conservan la suya.
import type { PaisSlug } from "./paises";

/** Responsable del tratamiento (sección 3 del documento). */
export const RESPONSABLE = {
  nombre: "Fundación ROFÉ",
  nit: "901.144.889-7",
  direccion: "Carrera 6 # 109-07, Bogotá D.C., Colombia",
  web: "https://tocaunavida.org/",
  correo: "admin@tocaunavida.org",
} as const;

/** El documento oficial (PDF) y su identificación. */
export const POLITICA_OFICIAL = {
  url: "https://tocaunavida.org/wp-content/uploads/2024/01/2.-DE-010-D-Politica-de-Tratamiento-de-datos.pdf",
  titulo: "Política de Tratamiento de Datos y Aviso de Privacidad de sus Datos Personales",
  codigo: "DE-010-D",
  version: 1,
  /** Vigencia: "rigen a partir del día 20 del mes de noviembre de 2023". */
  vigente: "2023-11-20",
  texto: "Consulta la Política de Tratamiento de Datos oficial de la Fundación ROFÉ (PDF)",
  corto: "Política de Tratamiento de Datos de la Fundación ROFÉ (PDF)",
} as const;

export type LeyDatos = { ley: string; marco: string; autoridad: string; autoridadWeb: string; autoridadCorreo: string };

/** Marco legal del documento (Colombia) y autoridad ante la que se presenta la queja. */
const LEY: LeyDatos = {
  ley: "Ley Estatutaria 1581 de 2012",
  marco: "el artículo 15 de la Constitución Política, la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013",
  autoridad: "la Superintendencia de Industria y Comercio (SIC)",
  autoridadWeb: "https://www.sic.gov.co",
  autoridadCorreo: "contactenos@sic.gov.co",
};

/** La misma política rige en los 4 países (la de la Fundación, en Colombia). */
export const LEY_DATOS: Record<PaisSlug, LeyDatos> = { col: LEY, ecu: LEY, pan: LEY, uy: LEY };

/**
 * Versiones de lo que acepta la persona en el formulario. Cambian cuando cambia el texto aceptado: las inscripciones
 * guardadas conservan la versión con la que se hicieron (antes: privacidad-2027-provisional-1, datos-<país>-2027-
 * provisional-1 y acudiente-2027-provisional-2).
 */
export const VERSION_PRIVACIDAD = "politica-DE-010-D-v1";
export const VERSION_DATOS = "datos-DE-010-D-v1";
export const VERSION_ACUDIENTE = "acudiente-DE-010-D-v1";
/** Desde cuándo rige el texto que muestra /privacidad (la vigencia del documento oficial). */
export const VIGENTE_DESDE = POLITICA_OFICIAL.vigente;
