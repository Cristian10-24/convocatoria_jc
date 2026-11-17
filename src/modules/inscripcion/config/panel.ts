// Configuración del panel de inscritos: zonas horarias, campos sensibles y textos. Solo datos.
import type { PaisSlug } from "@/shared/config/paises";
import type { IdCampo } from "./preguntas";

/**
 * Zona horaria para contar "hoy", "por día" y "por hora". Ningún país de la convocatoria tiene horario de verano,
 * así que el desfase es fijo. Si el filtro mira un solo país se usa la suya; si mira varios, la de Bogotá.
 */
export const ZONAS: Record<PaisSlug, { iana: string; desfase: string }> = {
  col: { iana: "America/Bogota", desfase: "-05:00" },
  pan: { iana: "America/Panama", desfase: "-05:00" },
  ecu: { iana: "America/Guayaquil", desfase: "-05:00" },
  uy: { iana: "America/Montevideo", desfase: "-03:00" },
};
export const ZONA_VARIOS_PAISES = ZONAS.col;

/**
 * Datos sensibles (decisión F14): solo admin ve el detalle individual y los exporta. Los demás roles los ven solo
 * agregados en el tablero.
 */
export const CAMPOS_SENSIBLES: readonly IdCampo[] = ["genero", "poblaciones", "poblacionOtra", "ingresos"];

/** Filas por página en la lista de inscritos. */
export const TAM_PAGINA = 50;
/** Tope de filas por exportación (una función de Vercel tiene memoria y tiempo acotados). */
export const MAX_EXPORTACION = 50_000;

export const TEXTOS_PANEL = {
  tablero: "Tablero",
  inscritos: "Inscritos",
  usuarios: "Usuarios",
  total: "Inscritos",
  hoy: "Hoy",
  semana: "Últimos 7 días",
  menores: "Menores de edad",
  conAlertas: "Con alertas",
  sinDatos: "Todavía no hay inscripciones con estos filtros.",
  filtrar: "Filtrar",
  limpiar: "Limpiar filtros",
  buscar: "Buscar por nombre, documento, correo o radicado",
  exportarExcel: "Exportar a Excel",
  exportarCsv: "Exportar CSV",
  anterior: "Anterior",
  siguiente: "Siguiente",
  volver: "Volver a la lista",
  sensibleOculto: "Dato reservado: solo lo ve administración.",
  actualizado: "Se actualiza solo cada 30 segundos.",
} as const;

/** Etiquetas de los filtros de alerta además de las de cada código. */
export const TEXTO_FILTRO_ALERTA = { con: "Con alguna alerta", sin: "Sin alertas" } as const;
