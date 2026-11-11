// Señales baratas contra bots: campo trampa (honeypot) y tiempo mínimo de llenado.
// No reemplazan a Turnstile; filtran los scripts más simples antes de gastar una verificación remota.
// Funciones puras: se usan en el servidor (y el nombre del campo, en el formulario).

/** Nombre del campo trampa: invisible para personas, tentador para bots que llenan todo. */
export const CAMPO_TRAMPA = "sitio_web";

/** Llenar 6 pasos en menos de esto no es humano. */
export const TIEMPO_MINIMO_MS = 4_000;
/** Un formulario abierto hace más de esto se acepta igual (alguien lo dejó abierto), pero no se usa como señal. */
export const TIEMPO_MAXIMO_MS = 24 * 60 * 60 * 1000;

export type MotivoBot = "trampa" | "muy_rapido";

/**
 * Devuelve el motivo si parece un bot, o null.
 * @param trampa      valor del campo trampa (debe venir vacío)
 * @param iniciadoEn  marca de tiempo (ms) de cuando se abrió el formulario en el navegador
 */
export function senalBot(trampa: unknown, iniciadoEn: unknown, ahora = Date.now()): MotivoBot | null {
  if (typeof trampa === "string" && trampa.trim() !== "") return "trampa";
  if (typeof iniciadoEn === "number" && Number.isFinite(iniciadoEn)) {
    const transcurrido = ahora - iniciadoEn;
    if (transcurrido >= 0 && transcurrido < TIEMPO_MINIMO_MS) return "muy_rapido";
  }
  return null;
}
