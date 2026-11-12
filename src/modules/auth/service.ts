// Lógica del módulo auth: login con límite de intentos, verificación de sesión, cierre, revocación, desactivación y
// alta de usuarios. Todo lo que cambia sesiones queda en auth_auditoria.
import "server-only";
import type { ObjectId } from "mongodb";
import { entorno } from "@/shared/config/env";
import { hashIp } from "@/shared/security/hash";
import { bloqueado, registrarFallo, VENTANA_MS } from "@/shared/security/rateLimit";
import type { PaisSlug } from "@/shared/config/paises";
import type { Rol } from "./config/roles";
import { compararClave, hashearClave } from "./password";
import {
  buscarParaLogin,
  buscarPorId,
  desactivar,
  insertarUsuario,
  marcarIngreso,
  registrarAuditoria,
  subirVersion,
  type UsuarioPublico,
} from "./repository";
import { NuevoUsuario, USUARIO_REGEX, type Credenciales } from "./schema";
import { crearToken, leerToken } from "./sesion";

/** Lo que se sabe del usuario con sesión: nunca el hash. */
export type UsuarioSesion = { id: string; usuario: string; nombre: string; rol: Rol; paises: PaisSlug[] };

const aSesion = (u: UsuarioPublico): UsuarioSesion => ({
  id: u._id.toHexString(),
  usuario: u.usuario,
  nombre: u.nombre,
  rol: u.rol,
  paises: u.paises ?? [],
});

// Contadores de fallos: uno por IP y otro por usuario escrito (frena a quien prueba un usuario desde muchas IPs).
const TIPO_IP = "login-ip";
const TIPO_USUARIO = "login-usuario";

export type ResultadoLogin =
  | { ok: true; token: string; usuario: UsuarioSesion }
  | { ok: false; error: "credenciales" }
  | { ok: false; error: "limite"; reintentarEnSeg: number };

export async function iniciarSesion(credenciales: Credenciales, ctx: { ip: string; ahora?: number }): Promise<ResultadoLogin> {
  const ahora = ctx.ahora ?? Date.now();
  const limite = entorno().RATE_LIMIT_LOGIN;
  const { usuario, clave } = credenciales;

  const [porIp, porUsuario] = await Promise.all([
    bloqueado(TIPO_IP, ctx.ip, limite, VENTANA_MS, ahora),
    bloqueado(TIPO_USUARIO, usuario, limite, VENTANA_MS, ahora),
  ]);
  if (porIp || porUsuario) {
    return { ok: false, error: "limite", reintentarEnSeg: Math.ceil((VENTANA_MS - (ahora % VENTANA_MS)) / 1000) };
  }

  const u = await buscarParaLogin(usuario);
  // Se compara siempre (con el hash señuelo si no existe), también si está inactivo: mismo tiempo en los tres casos.
  const claveOk = await compararClave(clave, u?.passwordHash);
  const ipHash = hashIp(ctx.ip);

  if (!u || !u.activo || !claveOk) {
    await Promise.all([
      registrarFallo(TIPO_IP, ctx.ip, VENTANA_MS, ahora),
      registrarFallo(TIPO_USUARIO, usuario, VENTANA_MS, ahora),
      registrarAuditoria({
        accion: "login_fallido",
        // Solo se guarda lo escrito si parece un usuario: así no queda en la auditoría una contraseña pegada por error.
        usuario: USUARIO_REGEX.test(usuario) ? usuario : null,
        ...(u ? { usuarioId: u._id } : {}),
        detalle: !u ? "no_existe" : !u.activo ? "inactivo" : "clave",
        ipHash,
        en: new Date(ahora),
      }),
    ]);
    return { ok: false, error: "credenciales" };
  }

  await Promise.all([
    marcarIngreso(u._id, new Date(ahora)),
    registrarAuditoria({ accion: "login_ok", usuario: u.usuario, usuarioId: u._id, ipHash, en: new Date(ahora) }),
  ]);
  // aSesion copia solo los campos públicos: el hash no sale de aquí.
  return { ok: true, token: crearToken(u._id.toHexString(), u.tokenVersion ?? 0, ahora), usuario: aSesion(u) };
}

/**
 * Usuario de un token, o null. Además de la firma y la expiración, revisa en la base que siga activo y que su
 * tokenVersion coincida: desactivar, revocar o cerrar sesión aplica de inmediato.
 */
export async function verificarSesion(token: string | undefined, ahora = Date.now()): Promise<UsuarioSesion | null> {
  const contenido = leerToken(token, ahora);
  if (!contenido) return null;
  const u = await buscarPorId(contenido.u);
  if (!u || !u.activo || (u.tokenVersion ?? 0) !== contenido.v) return null;
  return aSesion(u);
}

/** Cierra la sesión: sube tokenVersion, así la cookie deja de servir aunque alguien la haya copiado. */
export async function cerrarSesion(usuario: UsuarioSesion, ctx: { ip: string }): Promise<void> {
  const u = await buscarPorId(usuario.id);
  if (!u) return;
  await subirVersion(u._id);
  await registrarAuditoria({ accion: "logout", usuario: u.usuario, usuarioId: u._id, ipHash: hashIp(ctx.ip) });
}

/** Cierra todas las sesiones de un usuario (p. ej. si perdió su equipo). `por` = quién lo hizo. */
export async function revocarSesiones(usuarioId: string, por: string): Promise<boolean> {
  const u = await buscarPorId(usuarioId);
  if (!u || !(await subirVersion(u._id))) return false;
  await registrarAuditoria({ accion: "revocacion", usuario: u.usuario, usuarioId: u._id, por });
  return true;
}

/** Desactiva un usuario y cierra sus sesiones en la misma operación. */
export async function desactivarUsuario(usuarioId: string, por: string): Promise<boolean> {
  const u = await buscarPorId(usuarioId);
  if (!u || !(await desactivar(u._id))) return false;
  await registrarAuditoria({ accion: "desactivacion", usuario: u.usuario, usuarioId: u._id, por });
  return true;
}

export type ResultadoAlta =
  | { ok: true; id: ObjectId }
  | { ok: false; error: "datos_invalidos"; errores: Record<string, string> }
  | { ok: false; error: "duplicado" };

/** Alta de usuario. Valida con el mismo esquema que usará la pantalla de usuarios. */
export async function crearUsuario(entrada: unknown, por: string): Promise<ResultadoAlta> {
  const r = NuevoUsuario.safeParse(entrada);
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[i.path.join(".") || "_"] ??= i.message;
    return { ok: false, error: "datos_invalidos", errores };
  }
  const d = r.data;
  const alta = await insertarUsuario({
    usuario: d.usuario,
    nombre: d.nombre,
    rol: d.rol,
    // Solo el coordinador usa la lista; para los demás se guarda vacía y no confunde.
    paises: d.rol === "coordinador" ? d.paises : [],
    activo: true,
    passwordHash: await hashearClave(d.clave),
    tokenVersion: 0,
    creadoEn: new Date(),
  });
  if (!alta.ok) return alta;
  await registrarAuditoria({ accion: "usuario_creado", usuario: d.usuario, usuarioId: alta.id, por, detalle: d.rol });
  return { ok: true, id: alta.id };
}
