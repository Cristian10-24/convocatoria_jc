// [PROVISIONAL] Textos legales de autorización de datos, por país.
// Base: texto del formulario oficial 2026, adaptado a la ley de cada país. DEBEN ser revisados y reemplazados por la
// Fundación antes de abrir las inscripciones. Para reemplazarlos se edita SOLO este archivo; cada versión queda
// guardada en la inscripción (`versionAutorizacion`), así que al cambiar un texto hay que cambiar su `version`.
import type { PaisSlug } from "@/shared/config/paises";

export type TextoLegal = {
  version: string;
  provisional: boolean;
  titulo: string;
  parrafos: string[];
};

const CONTACTO = "Para inquietudes o reclamos sobre tus datos, escribe a la Fundación ROFÉ a contabilidad@tocaunavida.org.";

const comun = (ley: string, autoridad: string): string[] => [
  "Al enviar este formulario autorizas a la Fundación ROFÉ a tratar tus datos personales según su política de privacidad (disponible en www.tocaunavida.org). Esto incluye gestionar tu participación en sus programas y enviarte información futura.",
  "Algunos datos sensibles (como las poblaciones con las que te identificas o los ingresos del hogar) se recogen para asignar mejor los programas. Entregarlos es voluntario, pero necesario para el proceso de selección.",
  "Debes tener al menos 14 años para enviar el formulario. Si eres menor de edad, necesitamos la autorización de tu padre, madre, acudiente o tutor.",
  `Tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, a pedir prueba de esta autorización y a revocarla, conforme a ${ley}. Puedes presentar reclamos ante ${autoridad}.`,
  CONTACTO,
];

export const LEGAL: Record<PaisSlug, TextoLegal> = {
  uy: {
    version: "uy-2027-provisional-1",
    provisional: true,
    titulo: "Autorización de uso de datos de beneficiarios",
    parrafos: [
      "Al enviar este formulario autorizás a la Fundación ROFÉ a tratar tus datos personales según su política de privacidad (disponible en www.tocaunavida.org). Esto incluye gestionar tu participación en sus programas y enviarte información futura.",
      "Algunos datos sensibles (como las poblaciones con las que te identificás o los ingresos del hogar) se recogen para asignar mejor los programas. Entregarlos es voluntario, pero necesario para el proceso de selección.",
      "Tenés que tener al menos 14 años para enviar el formulario. Si sos menor de edad, necesitamos la autorización de tu padre, madre, acudiente o tutor.",
      "Tenés derecho a acceder, rectificar, actualizar, incluir y suprimir tus datos, y a revocar esta autorización, conforme a la Ley N.º 18.331 de Protección de Datos Personales. Podés presentar reclamos ante la Unidad Reguladora y de Control de Datos Personales (URCDP).",
      "Para consultas o reclamos sobre tus datos, escribí a la Fundación ROFÉ a contabilidad@tocaunavida.org.",
    ],
  },
  col: { version: "col-2027-provisional-1", provisional: true, titulo: "Autorización de uso de datos de beneficiarios", parrafos: comun("la Ley 1581 de 2012", "la Superintendencia de Industria y Comercio") },
  pan: { version: "pan-2027-provisional-1", provisional: true, titulo: "Autorización de uso de datos de beneficiarios", parrafos: comun("la Ley 81 de 2019", "la Autoridad Nacional de Transparencia y Acceso a la Información (ANTAI)") },
  ecu: { version: "ecu-2027-provisional-1", provisional: true, titulo: "Autorización de uso de datos de beneficiarios", parrafos: comun("la Ley Orgánica de Protección de Datos Personales", "la Superintendencia de Protección de Datos Personales") },
};

/** [PROVISIONAL] Texto de la autorización del adulto responsable (solo menores de edad). */
export const AUTORIZACION_ACUDIENTE = {
  version: "acudiente-2027-provisional-1",
  provisional: true,
  texto:
    "El padre, madre, acudiente o tutor cuyos datos figuran en este formulario declara que conoce y autoriza la inscripción de la persona menor de edad en Jóvenes creaTIvos, y el tratamiento de sus datos personales en los términos anteriores.",
};
