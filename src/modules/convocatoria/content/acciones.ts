// Botones de la convocatoria: QUÉ hace cada botón vive aquí, no en los componentes.
// El back puede cambiarlo sin tocar código con la variable CONVOCATORIA_CONFIG (JSON, ver docs/convocatoria/BACKEND.md).
// Orden de prioridad: CONVOCATORIA_CONFIG (env) → configuración del país (contenido.ts) → valores por defecto de abajo.
// La API de inscripción también lee CONVOCATORIA_CONFIG (estado por país) en cada envío.
import { z } from "zod";
import { PAISES, type PaisSlug } from "@/shared/config/paises";

export const PAISES_SLUG = PAISES;
export type { PaisSlug };

/** Lo que pasa al tocar un botón. */
export const Accion = z.discriminatedUnion("tipo", [
  /** Va a una URL externa (p. ej. Google Forms). conUtm = agrega los utm_* con los que llegó la visita. */
  z.object({ tipo: z.literal("enlace"), url: z.string().url().startsWith("https://"), nuevaPestana: z.boolean().optional(), conUtm: z.boolean().optional() }),
  /** Va a otra página de esta misma app (p. ej. "/convocatoria/postular/uy" cuando exista el formulario nativo). */
  z.object({ tipo: z.literal("ruta"), ruta: z.string().regex(/^\/[^/]/, "Debe empezar con / (ruta interna)") }),
  /** Baja a una sección de la misma página. */
  z.object({ tipo: z.literal("ancla"), id: z.string().regex(/^[a-z0-9-]+$/) }),
  /** No navega: emite el evento de ventana "convocatoria:accion" con este nombre, para que el back lo maneje (abrir un modal, etc.). */
  z.object({ tipo: z.literal("evento"), nombre: z.string().min(1).max(60) }),
  /** Botón visible pero inactivo (convocatoria sin abrir o sin destino confirmado). */
  z.object({ tipo: z.literal("pendiente"), texto: z.string().max(60).optional() }),
]);
export type Accion = z.infer<typeof Accion>;

/** Botones de la página. Los "postular-*" heredan de "postular" si no tienen configuración propia. */
export const BOTONES = ["postular", "postular-hero", "postular-requisitos", "postular-cierre", "postular-barra", "ver-ruta", "contacto"] as const;
export type IdBoton = (typeof BOTONES)[number];

export const EstadoConvocatoria = z.enum(["proxima", "abierta", "cerrada"]);
export type EstadoConvocatoria = z.infer<typeof EstadoConvocatoria>;

/** Configuración que se puede sobrescribir por país desde la variable de entorno. */
export const ConfigPais = z.object({
  estado: EstadoConvocatoria.optional(),
  /** Fecha de cierre visible (AAAA-MM-DD). */
  cierra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  acciones: z.partialRecord(z.enum(BOTONES), Accion).optional(),
});
export type ConfigPais = z.infer<typeof ConfigPais>;
export const ConfigEntorno = z.partialRecord(z.enum(PAISES_SLUG), ConfigPais);

/** Lo que hace cada botón si nadie dice otra cosa. */
export const ACCIONES_POR_DEFECTO: Record<IdBoton, Accion> = {
  postular: { tipo: "pendiente", texto: "Inscripciones muy pronto" },
  "postular-hero": { tipo: "pendiente" },
  "postular-requisitos": { tipo: "pendiente" },
  "postular-cierre": { tipo: "pendiente" },
  "postular-barra": { tipo: "pendiente" },
  "ver-ruta": { tipo: "ancla", id: "ruta" },
  contacto: { tipo: "enlace", url: "https://tocaunavida.org/contactanos/", nuevaPestana: true },
};
const HEREDAN_DE_POSTULAR = new Set<IdBoton>(["postular-hero", "postular-requisitos", "postular-cierre", "postular-barra"]);

/** Lee CONVOCATORIA_CONFIG. Si el JSON está mal, se ignora entero (y se avisa en el log) para no romper la página. */
export function leerConfigEntorno(texto = process.env.CONVOCATORIA_CONFIG): Partial<Record<PaisSlug, ConfigPais>> {
  if (!texto?.trim()) return {};
  try {
    const r = ConfigEntorno.safeParse(JSON.parse(texto));
    if (r.success) return r.data;
    console.error("[convocatoria] CONVOCATORIA_CONFIG no es válida; se ignora:", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  } catch {
    console.error("[convocatoria] CONVOCATORIA_CONFIG no es JSON; se ignora.");
  }
  return {};
}

/** Acción final de un botón: entorno → país → por defecto (con la herencia de "postular"). */
export function resolverAccion(id: IdBoton, delPais: ConfigPais | undefined, delEntorno: ConfigPais | undefined): Accion {
  const buscar = (k: IdBoton) => delEntorno?.acciones?.[k] ?? delPais?.acciones?.[k];
  const propia = buscar(id);
  if (propia) return propia;
  if (HEREDAN_DE_POSTULAR.has(id)) return buscar("postular") ?? ACCIONES_POR_DEFECTO.postular;
  return ACCIONES_POR_DEFECTO[id];
}

/** Agrega los utm_* de la visita a una URL externa (sin pisar los que ya traiga). */
export function conUtm(url: string, busquedaActual: string): string {
  const destino = new URL(url);
  new URLSearchParams(busquedaActual).forEach((v, k) => {
    if (k.startsWith("utm_") && !destino.searchParams.has(k)) destino.searchParams.set(k, v);
  });
  return destino.toString();
}
