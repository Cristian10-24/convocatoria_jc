// Esquemas zod del módulo auth. Sirven en el navegador (formulario de login) y en el servidor (que siempre revalida).
// Sin dependencias de servidor: el largo en bytes se mide con TextEncoder, que existe en ambos lados.
import { z } from "zod";
import { PAISES } from "@/shared/config/paises";
import { MENSAJES_AUTH as M } from "./config/textos";
import { ROLES } from "./config/roles";

/** bcrypt solo usa los primeros 72 bytes: más largo se rechaza en vez de recortarse en silencio. */
export const CLAVE_MAX_BYTES = 72;
/** Mínimo para contraseñas nuevas. */
export const CLAVE_MIN = 12;

const bytes = (s: string) => new TextEncoder().encode(s).length;
const claveLarga = M.claveLarga.replace("{max}", String(CLAVE_MAX_BYTES));

export const USUARIO_REGEX = /^[a-z0-9._-]{3,40}$/;

/** Usuario normalizado (sin espacios, en minúsculas). */
const usuarioLibre = z.string().trim().toLowerCase();

/**
 * Credenciales del login. El usuario solo se recorta y pasa a minúsculas (un formato raro responde lo mismo que un
 * usuario inexistente). La contraseña no se recorta: los espacios cuentan.
 */
export const Credenciales = z
  .object({
    usuario: usuarioLibre.pipe(z.string().min(1, M.usuarioObligatorio).max(60, M.usuarioFormato)),
    clave: z.string().min(1, M.claveObligatoria).refine((c) => bytes(c) <= CLAVE_MAX_BYTES, claveLarga),
  })
  .strict();
export type Credenciales = z.infer<typeof Credenciales>;

/** Contraseña nueva: mínimo de largo y máximo en bytes. */
export const ClaveNueva = z
  .string()
  .min(CLAVE_MIN, M.claveCorta.replace("{min}", String(CLAVE_MIN)))
  .refine((c) => bytes(c) <= CLAVE_MAX_BYTES, claveLarga);

/** Alta de usuario (script `admin:crear` y, en la fase 4, la pantalla de usuarios). */
export const NuevoUsuario = z
  .object({
    usuario: usuarioLibre.pipe(z.string().regex(USUARIO_REGEX, M.usuarioFormato)),
    nombre: z
      .string()
      .transform((s) => s.replace(/\s+/g, " ").trim())
      .pipe(z.string().min(3, M.nombre).max(80, M.nombre)),
    rol: z.enum(ROLES),
    paises: z
      .array(z.enum(PAISES))
      .max(PAISES.length)
      .default([])
      .transform((ps) => [...new Set(ps)]),
    clave: ClaveNueva,
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.rol === "coordinador" && v.paises.length === 0) ctx.addIssue({ code: "custom", path: ["paises"], message: M.paisesCoordinador });
  });
export type NuevoUsuario = z.input<typeof NuevoUsuario>;
