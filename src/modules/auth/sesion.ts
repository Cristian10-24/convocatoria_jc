// Token de sesión: `<datos>.<firma>`, ambos en base64url. Los datos son { u: id, v: tokenVersion, e: expira, i: emitido }
// y la firma es HMAC-SHA256 con SESSION_SECRET. La expiración va dentro de lo firmado: alargar el maxAge de la cookie
// no la extiende. El token no basta: service.ts revisa en cada verificación que el usuario siga activo y que su
// tokenVersion coincida (subirla cierra todas sus sesiones).
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { esProduccion, secretoSesion } from "@/shared/config/env";

/** Una jornada de trabajo. Después hay que volver a entrar. */
export const DURACION_SESION_MS = 12 * 60 * 60 * 1000;

/** Un token válido mide ~150 caracteres; cualquier cosa mucho más larga se descarta sin trabajar. */
const MAX_TOKEN = 512;
// Separa estas firmas de cualquier otro uso futuro del mismo secreto.
const CONTEXTO = "jc-sesion.v1.";

const Contenido = z.object({
  u: z.string().regex(/^[a-f0-9]{24}$/),
  v: z.number().int().min(0),
  e: z.number().int().positive(),
  i: z.number().int().positive(),
});
export type ContenidoSesion = z.infer<typeof Contenido>;

const firmar = (datos: string): Buffer => createHmac("sha256", secretoSesion()).update(CONTEXTO + datos).digest();

export function crearToken(usuarioId: string, version: number, ahora = Date.now()): string {
  const contenido: ContenidoSesion = { u: usuarioId, v: version, e: ahora + DURACION_SESION_MS, i: ahora };
  const datos = Buffer.from(JSON.stringify(contenido)).toString("base64url");
  return `${datos}.${firmar(datos).toString("base64url")}`;
}

/** Contenido del token si la firma es válida y no ha expirado; si no, null. */
export function leerToken(token: string | undefined, ahora = Date.now()): ContenidoSesion | null {
  if (!token || token.length > MAX_TOKEN) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [datos, firma] = partes as [string, string];
  const recibida = Buffer.from(firma, "base64url");
  const esperada = firmar(datos);
  // timingSafeEqual exige el mismo largo; comparar largos no filtra nada (la firma siempre mide 32 bytes).
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(datos, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const r = Contenido.safeParse(json);
  if (!r.success || r.data.e <= ahora) return null;
  return r.data;
}

/**
 * Nombre de la cookie. En producción lleva el prefijo __Host-: el navegador solo la acepta con Secure, Path=/ y sin
 * Domain, así ningún subdominio de tocaunavida.org puede sobrescribirla. En local (http) ese prefijo no funciona.
 */
export const nombreCookie = (): string => (esProduccion() ? "__Host-jc_sesion" : "jc_sesion");

export function opcionesCookie(maxAgeSeg = Math.floor(DURACION_SESION_MS / 1000)) {
  return {
    httpOnly: true,
    secure: esProduccion(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeg,
  };
}

/** Lee una cookie del encabezado de la petición (Route Handlers). */
export function leerCookie(req: Request, nombre: string): string | undefined {
  const encabezado = req.headers.get("cookie");
  if (!encabezado) return undefined;
  for (const parte of encabezado.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nombre) return parte.slice(i + 1).trim();
  }
  return undefined;
}
