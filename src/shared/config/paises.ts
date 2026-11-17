// Países de la convocatoria: códigos internos, segmentos de URL y datos telefónicos.
// Es el ÚNICO lugar donde se relacionan el código interno (col/pan/ecu/uy) y la URL pública (/colombia, /panama, ...).
// Funciones puras: se usan en el servidor y en el navegador.

export const PAISES = ["col", "pan", "ecu", "uy"] as const;
export type PaisSlug = (typeof PAISES)[number];

export const esPais = (v: unknown): v is PaisSlug => typeof v === "string" && (PAISES as readonly string[]).includes(v);

/** Segmento de URL pública de cada país: /colombia y /inscripcion/colombia (rediseño 2027). */
export const SEGMENTO_URL: Record<PaisSlug, string> = { col: "colombia", pan: "panama", ecu: "ecuador", uy: "uruguay" };

/** Segmentos anteriores (ya compartidos en redes y WhatsApp): next.config.ts los redirige a los nuevos. */
export const SEGMENTO_ANTERIOR: Partial<Record<PaisSlug, string>> = { col: "col", ecu: "ecu", uy: "uy" };

/** Código del país en el plan de medición (dataLayer y data-pais): co, ec, pa, uy. */
export const CODIGO_MEDICION: Record<PaisSlug, string> = { col: "co", pan: "pa", ecu: "ec", uy: "uy" };

export function paisDeSegmento(segmento: string): PaisSlug | undefined {
  return PAISES.find((p) => SEGMENTO_URL[p] === segmento.toLowerCase());
}

export const NOMBRE_PAIS: Record<PaisSlug, string> = { col: "Colombia", pan: "Panamá", ecu: "Ecuador", uy: "Uruguay" };

/** Datos para validar y formatear celulares. `nacional` = dígitos sin indicativo ni 0 inicial. */
export type PaisTelefono = { codigo: string; nombre: string; indicativo: string; nacional: number; ejemplo: string };

export const TELEFONOS = {
  CO: { codigo: "CO", nombre: "Colombia", indicativo: "57", nacional: 10, ejemplo: "300 123 4567" },
  PA: { codigo: "PA", nombre: "Panamá", indicativo: "507", nacional: 8, ejemplo: "6123 4567" },
  EC: { codigo: "EC", nombre: "Ecuador", indicativo: "593", nacional: 9, ejemplo: "99 123 4567" },
  UY: { codigo: "UY", nombre: "Uruguay", indicativo: "598", nacional: 8, ejemplo: "91 234 567" },
  AR: { codigo: "AR", nombre: "Argentina", indicativo: "54", nacional: 10, ejemplo: "3442 12 3456" },
} as const satisfies Record<string, PaisTelefono>;
export type CodigoTelefono = keyof typeof TELEFONOS;

/** Indicativo por defecto del celular según el país de la convocatoria. */
export const TELEFONO_DE_PAIS: Record<PaisSlug, CodigoTelefono> = { col: "CO", pan: "PA", ecu: "EC", uy: "UY" };
