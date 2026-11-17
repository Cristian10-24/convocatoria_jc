// Esquemas zod del módulo auth. Sirven en el navegador (formulario de login) y en el servidor (que siempre revalida).
// Sin dependencias de servidor: el largo en bytes se mide con TextEncoder, que existe en ambos lados.
import { z } from "zod";
import { PAISES } from "@/shared/config/paises";
import { MENSAJES_AUTH as M } from "./config/textos";
import { conPaises, ROLES } from "./config/roles";

/** bcrypt solo usa los primeros 72 bytes: más largo se rechaza en vez de recortarse en silencio. */
export const CLAVE_MAX_BYTES = 72;
/** Mínimo para contraseñas nuevas. */
export const CLAVE_MIN = 12;

const bytes = (s: string) => new TextEncoder().encode(s).length;
const claveLarga = M.claveLarga.replace("{max}", String(CLAVE_MAX_BYTES));

export const USUARIO_REGEX = /^[a-z0-9._-]{3,40}$/;

/** Usuario normalizado (sin espacios, en minúsculas). */
const usuarioLibre = z.string().trim().toLowerCase();

/** Correo institucional, en minúsculas. */
export const CorreoUsuario = z.string().trim().toLowerCase().pipe(z.email(M.correo).max(120, M.correo));

/**
 * Credenciales del login. `usuario` es el correo institucional (o, mientras no lo tenga, el usuario anterior): solo se
 * recorta y pasa a minúsculas (un formato raro responde lo mismo que uno inexistente). La contraseña no se recorta.
 */
export const Credenciales = z
  .object({
    usuario: usuarioLibre.pipe(z.string().min(1, M.usuarioObligatorio).max(120, M.usuarioObligatorio)),
    clave: z.string().min(1, M.claveObligatoria).refine((c) => bytes(c) <= CLAVE_MAX_BYTES, claveLarga),
  })
  .strict();
export type Credenciales = z.infer<typeof Credenciales>;

/** Requisitos de una contraseña nueva, con su texto: la pantalla de cambio los muestra y marca al escribir. */
export const REQUISITOS_CLAVE = [
  { id: "largo", texto: M.reqLargo.replace("{min}", String(CLAVE_MIN)), cumple: (c: string) => c.length >= CLAVE_MIN },
  { id: "mayuscula", texto: M.reqMayuscula, cumple: (c: string) => /\p{Lu}/u.test(c) },
  { id: "numero", texto: M.reqNumero, cumple: (c: string) => /\d/.test(c) },
] as const;

/** Contraseña nueva: mínimo de largo, una mayúscula, un número y máximo en bytes. */
export const ClaveNueva = z
  .string()
  .min(CLAVE_MIN, M.claveCorta.replace("{min}", String(CLAVE_MIN)))
  .refine((c) => REQUISITOS_CLAVE[1].cumple(c), M.claveMayuscula)
  .refine((c) => REQUISITOS_CLAVE[2].cumple(c), M.claveNumero)
  .refine((c) => bytes(c) <= CLAVE_MAX_BYTES, claveLarga);

const coinciden = { path: ["repetir"], message: M.noCoinciden };

/** Cambio de contraseña con sesión (primer ingreso o contraseña temporal). */
export const CambioClave = z
  .object({ nueva: ClaveNueva, repetir: z.string() })
  .strict()
  .refine((v) => v.nueva === v.repetir, coinciden);
/** Contraseña nueva desde el enlace del correo. */
export const ClavePorEnlace = z
  .object({ token: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/, M.enlaceInvalido), nueva: ClaveNueva, repetir: z.string() })
  .strict()
  .refine((v) => v.nueva === v.repetir, coinciden);
/** Pedido del enlace. */
export const SolicitudEnlace = z.object({ correo: CorreoUsuario }).strict();

/** Alta de usuario (script `admin:crear` y, en la fase 4, la pantalla de usuarios). */
export const NuevoUsuario = z
  .object({
    usuario: usuarioLibre.pipe(z.string().regex(USUARIO_REGEX, M.usuarioFormato)),
    correo: CorreoUsuario.optional(),
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
    if (conPaises(v.rol) && v.paises.length === 0) ctx.addIssue({ code: "custom", path: ["paises"], message: M.paisesCoordinador });
  });
export type NuevoUsuario = z.input<typeof NuevoUsuario>;

/** Cambios a un usuario existente (pantalla de usuarios). El usuario (login) no se cambia. */
export const EdicionUsuario = z
  .object({
    nombre: z
      .string()
      .transform((s) => s.replace(/\s+/g, " ").trim())
      .pipe(z.string().min(3, M.nombre).max(80, M.nombre))
      .optional(),
    rol: z.enum(ROLES).optional(),
    paises: z
      .array(z.enum(PAISES))
      .max(PAISES.length)
      .transform((ps) => [...new Set(ps)])
      .optional(),
    activo: z.boolean().optional(),
    correo: CorreoUsuario.optional(),
  })
  .strict();
export type EdicionUsuario = z.input<typeof EdicionUsuario>;
