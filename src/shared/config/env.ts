// Variables de entorno del servidor, validadas con zod.
// Se leen de forma perezosa (al usarlas), para que `next build` funcione aunque falten las de MongoDB o sesión:
// las páginas públicas son estáticas y no las necesitan. Cada getter falla con un mensaje claro si falta algo.
import "server-only";
import { z } from "zod";

const texto = z.string().trim();
const opcional = texto.optional().transform((v) => (v ? v : undefined));
const entero = (porDefecto: number) =>
  z.preprocess((v) => (v === undefined || v === "" ? porDefecto : Number(v)), z.number().int().positive());

const Esquema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: opcional,
  MONGODB_DB: texto.default("convocatoria_jc"),
  MONGODB_MAX_POOL: entero(10),
  APP_URL: opcional,
  CONVOCATORIA_ID: texto.regex(/^[a-z0-9-]{3,40}$/).default("jc-2027"),
  SESSION_SECRET: opcional,
  IP_HASH_SALT: opcional,
  RATE_LIMIT_INSCRIPCION: entero(60),
  RATE_LIMIT_LOGIN: entero(10),
  TURNSTILE_SECRET_KEY: opcional,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: opcional,
  // Correo saliente (Resend). Sin RESEND_API_KEY no se envía nada.
  RESEND_API_KEY: opcional,
  CORREO_REMITENTE: opcional,
});
export type Entorno = z.infer<typeof Esquema>;

let cache: Entorno | undefined;

/** Entorno validado. Se recalcula si cambias `process.env` y llamas a `reiniciarEntorno()` (pruebas). */
export function entorno(): Entorno {
  if (cache) return cache;
  const r = Esquema.safeParse(process.env);
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`[env] Variables de entorno inválidas: ${detalle}`);
  }
  cache = r.data;
  return cache;
}

/** Solo para pruebas: vuelve a leer `process.env`. */
export function reiniciarEntorno(): void {
  cache = undefined;
}

export const esProduccion = (): boolean => entorno().NODE_ENV === "production";

/** Lanza un error claro si falta una variable obligatoria para esta operación. */
export function requerida<K extends keyof Entorno>(clave: K): NonNullable<Entorno[K]> {
  const valor = entorno()[clave];
  if (valor === undefined || valor === null || valor === "") throw new Error(`[env] Falta la variable de entorno ${String(clave)}`);
  return valor as NonNullable<Entorno[K]>;
}

/** Secreto de sesión: obligatorio y de al menos 32 caracteres. */
export function secretoSesion(): string {
  const s = requerida("SESSION_SECRET");
  if (s.length < 32) throw new Error("[env] SESSION_SECRET debe tener al menos 32 caracteres");
  return s;
}
