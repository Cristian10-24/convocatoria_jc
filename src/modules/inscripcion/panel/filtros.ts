// Filtros del panel, leídos de la URL (?pais=uy&sede=paysandu&pagina=2...). Función pura: un valor raro se ignora
// (no rompe la página), y el servidor vuelve a aplicar el alcance del usuario encima de lo que pida la URL.
import { z } from "zod";
import { PAISES, type PaisSlug } from "@/shared/config/paises";
import { ALERTAS } from "../config/alertas";

export const ORDENES = ["recientes", "antiguos", "apellido"] as const;
export type Orden = (typeof ORDENES)[number];

const CODIGOS_ALERTA = Object.keys(ALERTAS) as [keyof typeof ALERTAS, ...(keyof typeof ALERTAS)[]];
/** "con" = alguna alerta, "sin" = ninguna, o un código concreto. */
export const FILTROS_ALERTA = ["con", "sin", ...CODIGOS_ALERTA] as const;

const vacioAIndefinido = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const opcional = <T extends z.ZodType>(e: T) => z.preprocess(vacioAIndefinido, e.optional()).catch(undefined);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const FiltrosPanel = z.object({
  pais: opcional(z.enum(PAISES)),
  sede: opcional(z.string().regex(/^[a-z0-9_-]{1,40}$/)),
  ciudad: opcional(z.string().trim().max(80)),
  desde: opcional(z.string().regex(FECHA)),
  hasta: opcional(z.string().regex(FECHA)),
  menor: opcional(z.enum(["si", "no"])),
  alerta: opcional(z.enum(FILTROS_ALERTA)),
  q: opcional(z.string().trim().max(80)),
  orden: z.preprocess(vacioAIndefinido, z.enum(ORDENES).default("recientes")).catch("recientes"),
  pagina: z.preprocess(vacioAIndefinido, z.coerce.number().int().min(1).max(100_000).default(1)).catch(1),
});
export type Filtros = z.infer<typeof FiltrosPanel>;

type Parametros = Record<string, string | string[] | undefined> | URLSearchParams;

/** Lee los filtros de searchParams (página) o de URLSearchParams (ruta de exportación). */
export function leerFiltros(parametros: Parametros): Filtros {
  const plano: Record<string, string | undefined> = {};
  if (parametros instanceof URLSearchParams) {
    for (const clave of Object.keys(FiltrosPanel.shape)) plano[clave] = parametros.get(clave) ?? undefined;
  } else {
    for (const clave of Object.keys(FiltrosPanel.shape)) {
      const v = parametros[clave];
      plano[clave] = Array.isArray(v) ? v[0] : v;
    }
  }
  return FiltrosPanel.parse(plano);
}

/** Query string con los filtros (sin los valores por defecto), con cambios opcionales. */
export function aQuery(f: Filtros, cambios: Partial<Record<keyof Filtros, string | number | undefined>> = {}): string {
  const p = new URLSearchParams();
  const todo: Record<string, unknown> = { ...f, ...cambios };
  for (const clave of Object.keys(FiltrosPanel.shape)) {
    const v = todo[clave];
    if (v === undefined || v === "") continue;
    if (clave === "orden" && v === "recientes") continue;
    if (clave === "pagina" && Number(v) === 1) continue;
    p.set(clave, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** ¿Hay algún filtro activo (aparte de orden y página)? */
export function hayFiltros(f: Filtros): boolean {
  return [f.pais, f.sede, f.ciudad, f.desde, f.hasta, f.menor, f.alerta, f.q].some((v) => v !== undefined);
}

/** Alcance que el panel recibe de la sesión (lo arma el módulo auth; aquí solo se describe su forma). */
export type AlcancePanel = { paises: readonly PaisSlug[]; verSensibles: boolean };
