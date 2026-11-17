// Configuración de la convocatoria por país que se cambia SIN tocar código: variable CONVOCATORIA_CONFIG (JSON).
// La usan dos módulos: las landings (estado, fecha de cierre y botones) y la inscripción (¿se aceptan envíos?).
// Por eso vive en shared/. Se valida PAÍS POR PAÍS: si la entrada de un país está mal, solo ese país queda en
// "próxima" (muy pronto) y se registra en el log; los demás siguen con su configuración. Así un error de tipeo en
// un país no publica un botón roto, no abre ese país por accidente y no apaga a los otros.
import { z } from "zod";
import { PAISES, esPais, type PaisSlug } from "./paises";

/** Lo que pasa al tocar un botón de la landing. */
export const Accion = z.discriminatedUnion("tipo", [
  /** Va a una URL externa (p. ej. Google Forms). conUtm = agrega los utm_* con los que llegó la visita. */
  z.object({ tipo: z.literal("enlace"), url: z.string().url().startsWith("https://"), nuevaPestana: z.boolean().optional(), conUtm: z.boolean().optional() }),
  /** Va a otra página de esta misma app (p. ej. "/inscripcion/uy"). */
  z.object({ tipo: z.literal("ruta"), ruta: z.string().regex(/^\/[^/]/, "Debe empezar con / (ruta interna)") }),
  /** Baja a una sección de la misma página. */
  z.object({ tipo: z.literal("ancla"), id: z.string().regex(/^[a-z0-9-]+$/) }),
  /** No navega: emite el evento de ventana "convocatoria:accion" con este nombre. */
  z.object({ tipo: z.literal("evento"), nombre: z.string().min(1).max(60) }),
  /** Botón visible pero inactivo (convocatoria sin abrir o sin destino confirmado). */
  z.object({ tipo: z.literal("pendiente"), texto: z.string().max(60).optional() }),
]);
export type Accion = z.infer<typeof Accion>;

/** Botones de la landing. Los "postular-*" heredan de "postular" si no tienen configuración propia. */
export const BOTONES = ["postular", "postular-hero", "postular-requisitos", "postular-cierre", "postular-barra", "ver-ruta", "contacto"] as const;
export type IdBoton = (typeof BOTONES)[number];

/** "mantenimiento" apaga un país desde Vercel sin tocar código: la landing y el formulario muestran el aviso. */
export const EstadoConvocatoria = z.enum(["proxima", "abierta", "cerrada", "mantenimiento"]);
export type EstadoConvocatoria = z.infer<typeof EstadoConvocatoria>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Configuración de un país (en contenido.ts o en la variable de entorno). */
export const ConfigPais = z.object({
  estado: EstadoConvocatoria.optional(),
  /** Último día para inscribirse (AAAA-MM-DD). Pasado ese día, "abierta" se trata como "cerrada". */
  cierra: z.string().regex(FECHA).optional(),
  acciones: z.partialRecord(z.enum(BOTONES), Accion).optional(),
});
export type ConfigPais = z.infer<typeof ConfigPais>;
export const ConfigEntorno = z.partialRecord(z.enum(PAISES), ConfigPais);

/**
 * Lee CONVOCATORIA_CONFIG y valida cada país por separado. Un país con la entrada inválida queda en "proxima";
 * una clave que no es un país se ignora. Si el texto ni siquiera es JSON no hay forma de separar países: se
 * ignora entero y cada país usa su configuración por defecto. Todo queda en el log, nunca lanza.
 */
export function leerConfigEntorno(texto = process.env.CONVOCATORIA_CONFIG): Partial<Record<PaisSlug, ConfigPais>> {
  if (!texto?.trim()) return {};
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    console.error("[convocatoria] CONVOCATORIA_CONFIG no es JSON; se ignora.");
    return {};
  }
  if (typeof crudo !== "object" || crudo === null || Array.isArray(crudo)) {
    console.error("[convocatoria] CONVOCATORIA_CONFIG debe ser un objeto con los países como claves; se ignora.");
    return {};
  }
  const config: Partial<Record<PaisSlug, ConfigPais>> = {};
  for (const [clave, valor] of Object.entries(crudo)) {
    if (!esPais(clave)) {
      console.error(`[convocatoria] CONVOCATORIA_CONFIG: "${clave}" no es un país (${PAISES.join(", ")}); se ignora.`);
      continue;
    }
    const r = ConfigPais.safeParse(valor);
    if (r.success) config[clave] = r.data;
    else {
      const detalle = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.error(`[convocatoria] CONVOCATORIA_CONFIG: la entrada de "${clave}" no es válida; ese país queda en "muy pronto". ${detalle}`);
      config[clave] = { estado: "proxima" };
    }
  }
  return config;
}

/**
 * Fin del día de cierre. Se toma la hora de Bogotá/Panamá/Quito (UTC-5), la más tardía de los 4 países,
 * igual que la cuenta regresiva de la landing.
 */
export function finDelCierre(cierra: string): number {
  return new Date(`${cierra}T23:59:59-05:00`).getTime();
}

/**
 * Estado efectivo de un país: entorno → configuración del país → "proxima".
 * "abierta" con fecha de cierre ya pasada se trata como "cerrada".
 */
export function estadoConvocatoria(
  pais: PaisSlug,
  opciones: { delPais?: ConfigPais; entorno?: Partial<Record<PaisSlug, ConfigPais>>; ahora?: number } = {},
): { estado: EstadoConvocatoria; cierra?: string } {
  const entorno = (opciones.entorno ?? leerConfigEntorno())[pais];
  const estado = entorno?.estado ?? opciones.delPais?.estado ?? "proxima";
  const cierra = entorno?.cierra ?? opciones.delPais?.cierra;
  if (estado === "abierta" && cierra && (opciones.ahora ?? Date.now()) > finDelCierre(cierra)) return { estado: "cerrada", cierra };
  return { estado, cierra };
}
