// Utilidades para Route Handlers: leer el cuerpo con tope de tamaño, verificar el origen, IP del cliente y
// respuestas de error con un formato único: { error: "<codigo>", errores?: { campo: mensaje } }.
import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

/** Tamaño máximo de un cuerpo JSON (una inscripción pesa ~2 KB). */
export const MAX_CUERPO = 64 * 1024;

export type CodigoError =
  | "muy_grande"
  | "datos_invalidos"
  | "origen"
  | "limite"
  | "bot"
  | "verificacion"
  | "cerrada"
  | "mantenimiento"
  | "no_disponible"
  | "duplicado"
  | "credenciales"
  | "sesion"
  | "sin_permiso"
  | "no_encontrado"
  | "interno";

export type ErroresCampo = Record<string, string>;

/** Respuesta de error JSON. `errores` lleva los mensajes por campo cuando aplica. */
export function errorJson(status: number, error: CodigoError, extra: { errores?: ErroresCampo; [k: string]: unknown } = {}): NextResponse {
  return NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Convierte los issues de zod en { campo: primer mensaje }. */
export function erroresDeZod(error: z.ZodError): ErroresCampo {
  const salida: ErroresCampo = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "_";
    salida[campo] ??= issue.message;
  }
  return salida;
}

/**
 * Lee el cuerpo JSON, con tope de tamaño, y lo valida con el esquema.
 * Devuelve los datos tipados o la respuesta de error lista (413 / 400 con errores por campo).
 */
export async function leerCuerpo<T extends z.ZodType>(req: Request, esquema: T): Promise<{ datos: z.infer<T> } | { error: NextResponse }> {
  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (declarado > MAX_CUERPO) return { error: errorJson(413, "muy_grande") };
  const texto = await req.text().catch(() => "");
  if (texto.length > MAX_CUERPO) return { error: errorJson(413, "muy_grande") };
  let json: unknown = null;
  try {
    json = JSON.parse(texto);
  } catch {
    /* queda null y falla la validación */
  }
  const r = esquema.safeParse(json);
  if (!r.success) return { error: errorJson(400, "datos_invalidos", { errores: erroresDeZod(r.error) }) };
  return { datos: r.data };
}

/**
 * true si la petición viene del mismo sitio. Para formularios públicos se exige el encabezado Origin
 * (los navegadores lo envían siempre en POST con fetch); sin él, solo se acepta con `permitirSinOrigen`.
 */
export function mismoOrigen(req: Request, { permitirSinOrigen = false } = {}): boolean {
  const origen = req.headers.get("origin");
  if (!origen) return permitirSinOrigen;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}

/** IP del cliente. En Vercel llega en x-real-ip / x-forwarded-for (la primera es la del cliente). */
export function ipCliente(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? (fwd.split(",")[0] ?? "").trim() || "local" : "local";
}
