// Lógica del módulo auth: login con límite de intentos, verificación de sesión, cierre, revocación, desactivación y
// alta de usuarios. Todo lo que cambia sesiones queda en auth_auditoria.
import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { MongoServerError, ObjectId } from "mongodb";
import { notificador } from "@/shared/notificaciones/notificador";
import { hashIp } from "@/shared/security/hash";
import { consumir } from "@/shared/security/rateLimit";
import type { PaisSlug } from "@/shared/config/paises";
import { conPaises, type Rol } from "./config/roles";
import { MAX_INTENTOS, MAX_INTENTOS_CONEXION, MINUTOS_BLOQUEO, MINUTOS_ENLACE, RUTA_RESTABLECER } from "./config/acceso";
import { MENSAJES_AUTH } from "./config/textos";
import { compararClave, hashearClave } from "./password";
import {
  actualizarUsuario,
  borrarRestablecimientos,
  buscarConHash,
  buscarParaLogin,
  buscarPorCorreo,
  guardarRestablecimiento,
  leerBloqueos,
  limpiarFallos,
  sumarFallo,
  tomarRestablecimiento,
  buscarPorId,
  contarAdminsActivos,
  desactivar,
  insertarUsuario,
  listarUsuarios as repoListar,
  marcarIngreso,
  registrarAuditoria,
  subirVersion,
  type UsuarioPublico,
} from "./repository";
import { CambioClave, ClavePorEnlace, CorreoUsuario, EdicionUsuario, NuevoUsuario, SolicitudEnlace, USUARIO_REGEX, type Credenciales } from "./schema";
import { crearToken, leerToken } from "./sesion";

/** Lo que se sabe del usuario con sesión: nunca el hash. */
export type UsuarioSesion = {
  id: string;
  usuario: string;
  correo?: string;
  nombre: string;
  rol: Rol;
  paises: PaisSlug[];
  /** Con contraseña temporal: solo puede entrar a la pantalla de cambio. */
  debeCambiarClave: boolean;
};

const aSesion = (u: UsuarioPublico): UsuarioSesion => ({
  id: u._id.toHexString(),
  usuario: u.usuario,
  ...(u.correo ? { correo: u.correo } : {}),
  nombre: u.nombre,
  rol: u.rol,
  paises: u.paises ?? [],
  debeCambiarClave: !!u.debeCambiarClave,
});

// Bloqueo por intentos fallidos: un contador por correo escrito y otro por conexión (frena a quien prueba un correo
// desde muchas IPs y a quien prueba muchos correos desde una). Ver config/acceso.ts.
const BLOQUEO_MS = MINUTOS_BLOQUEO * 60_000;
const claveUsuario = (id: string) => `u:${id}`;
const claveIp = (ip: string) => `ip:${hashIp(ip)}`;

export type ResultadoLogin =
  | { ok: true; token: string; usuario: UsuarioSesion }
  | { ok: false; error: "credenciales"; quedan: number }
  | { ok: false; error: "bloqueado"; reintentarEnSeg: number };

/** Segundos que faltan del bloqueo más largo vigente, o 0. */
const segundosBloqueo = (docs: { bloqueadoHasta?: Date }[], ahora: number) =>
  Math.max(0, ...docs.map((d) => (d.bloqueadoHasta ? Math.ceil((d.bloqueadoHasta.getTime() - ahora) / 1000) : 0)));

const pareceIdentificador = (v: string) => USUARIO_REGEX.test(v) || CorreoUsuario.safeParse(v).success;

export async function iniciarSesion(credenciales: Credenciales, ctx: { ip: string; ahora?: number }): Promise<ResultadoLogin> {
  const ahora = ctx.ahora ?? Date.now();
  const { usuario, clave } = credenciales;
  const claves = [claveUsuario(usuario), claveIp(ctx.ip)];

  // Bloqueado: no se compara la contraseña ni se suma otro fallo.
  const vigente = segundosBloqueo(await leerBloqueos(claves), ahora);
  if (vigente > 0) return { ok: false, error: "bloqueado", reintentarEnSeg: vigente };

  const u = await buscarParaLogin(usuario);
  // Se compara siempre (con el hash señuelo si no existe), también si está inactivo: mismo tiempo en los tres casos.
  const claveOk = await compararClave(clave, u?.passwordHash);
  const ipHash = hashIp(ctx.ip);

  if (!u || !u.activo || !claveOk) {
    const fecha = new Date(ahora);
    const maximos = [MAX_INTENTOS, MAX_INTENTOS_CONEXION];
    const estados = await Promise.all(claves.map((c, i) => sumarFallo(c, maximos[i]!, BLOQUEO_MS, fecha)));
    const seg = segundosBloqueo(estados, ahora);
    await registrarAuditoria({
      accion: seg > 0 ? "bloqueo" : "login_fallido",
      // Solo se guarda lo escrito si parece un correo o usuario: así no queda una contraseña pegada por error.
      usuario: pareceIdentificador(usuario) ? usuario : null,
      ...(u ? { usuarioId: u._id } : {}),
      detalle: !u ? "no_existe" : !u.activo ? "inactivo" : "clave",
      ipHash,
      en: fecha,
    });
    if (seg > 0) return { ok: false, error: "bloqueado", reintentarEnSeg: seg };
    return { ok: false, error: "credenciales", quedan: Math.min(...estados.map((e, i) => maximos[i]! - e.fallos)) };
  }

  await Promise.all([
    limpiarFallos(claveUsuario(usuario)),
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

// ---------- Gestión de usuarios (pantalla de usuarios, solo admin) ----------

/** Lo que la pantalla de usuarios ve de cada uno (nunca el hash). */
export type VistaUsuario = UsuarioSesion & { activo: boolean; creadoEn: string; ultimoIngreso?: string };

export async function listarUsuarios(): Promise<VistaUsuario[]> {
  return (await repoListar()).map((u) => ({
    ...aSesion(u),
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
    ...(u.ultimoIngreso ? { ultimoIngreso: u.ultimoIngreso.toISOString() } : {}),
  }));
}

export type ResultadoEdicion =
  | { ok: true }
  | { ok: false; error: "datos_invalidos"; errores: Record<string, string> }
  | { ok: false; error: "no_encontrado" | "propio" | "ultimo_admin" };

const erroresZod = (e: { issues: { path: PropertyKey[]; message: string }[] }) => {
  const errores: Record<string, string> = {};
  for (const i of e.issues) errores[i.path.map(String).join(".") || "_"] ??= i.message;
  return errores;
};

/**
 * Edita nombre, rol, países o estado. Reglas: nadie se quita a sí mismo el rol de admin ni se desactiva, y siempre
 * queda al menos un admin activo. Desactivar cierra sus sesiones (sube tokenVersion).
 */
export async function editarUsuario(id: string, entrada: unknown, actor: UsuarioSesion): Promise<ResultadoEdicion> {
  const r = EdicionUsuario.safeParse(entrada);
  if (!r.success) return { ok: false, error: "datos_invalidos", errores: erroresZod(r.error) };
  const u = await buscarPorId(id);
  if (!u) return { ok: false, error: "no_encontrado" };

  const cambios = r.data;
  const rol = cambios.rol ?? u.rol;
  const activo = cambios.activo ?? u.activo;
  const paises = conPaises(rol) ? (cambios.paises ?? u.paises ?? []) : [];
  if (conPaises(rol) && paises.length === 0) return { ok: false, error: "datos_invalidos", errores: { paises: MENSAJES_AUTH.paisesCoordinador } };

  const pierdeAdmin = u.rol === "admin" && u.activo && (rol !== "admin" || !activo);
  if (pierdeAdmin && u._id.toHexString() === actor.id) return { ok: false, error: "propio" };
  if (pierdeAdmin && (await contarAdminsActivos(u._id)) === 0) return { ok: false, error: "ultimo_admin" };

  const seDesactiva = u.activo && !activo;
  try {
    await actualizarUsuario(u._id, { ...(cambios.nombre ? { nombre: cambios.nombre } : {}), ...(cambios.correo ? { correo: cambios.correo } : {}), rol, paises, activo }, seDesactiva);
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) return { ok: false, error: "datos_invalidos", errores: { correo: MENSAJES_AUTH.duplicado } };
    throw e;
  }
  await registrarAuditoria({
    accion: seDesactiva ? "desactivacion" : "usuario_editado",
    usuario: u.usuario,
    usuarioId: u._id,
    por: actor.usuario,
    detalle: `rol=${rol}; paises=${paises.join(",") || "-"}; activo=${activo}${cambios.correo ? `; correo=${cambios.correo}` : ""}`,
  });
  return { ok: true };
}

/** Contraseña temporal legible (sin 0/O ni 1/l/I), de 14 caracteres, con mayúscula y número. */
export function generarClaveTemporal(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  for (;;) {
    const c = Array.from({ length: 14 }, () => chars[randomInt(chars.length)]).join("");
    if (/[A-Z]/.test(c) && /[0-9]/.test(c)) return c;
  }
}

/** Restablece la contraseña con una temporal (se muestra una sola vez) y cierra todas sus sesiones. */
export async function restablecerClave(id: string, actor: UsuarioSesion): Promise<{ ok: true; clave: string } | { ok: false; error: "no_encontrado" }> {
  const u = await buscarPorId(id);
  if (!u) return { ok: false, error: "no_encontrado" };
  const clave = generarClaveTemporal();
  await actualizarUsuario(u._id, { passwordHash: await hashearClave(clave), debeCambiarClave: true }, true);
  await registrarAuditoria({ accion: "clave_restablecida", usuario: u.usuario, usuarioId: u._id, por: actor.usuario });
  return { ok: true, clave };
}

/** Deja constancia de quién exportó datos personales y con qué filtros. */
export async function registrarExportacion(actor: UsuarioSesion, detalle: string, ip: string): Promise<void> {
  await registrarAuditoria({ accion: "exportacion", usuario: actor.usuario, usuarioId: new ObjectId(actor.id), detalle: detalle.slice(0, 500), ipHash: hashIp(ip) });
}

/** Si llega el correo sin usuario, el usuario (identificador interno) sale de la parte antes de la "@". */
function conUsuarioDelCorreo(entrada: unknown): unknown {
  if (!entrada || typeof entrada !== "object") return entrada;
  const e = entrada as Record<string, unknown>;
  if (e.usuario || typeof e.correo !== "string") return entrada;
  const local = e.correo.trim().toLowerCase().split("@")[0] ?? "";
  const usuario = local.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  return { ...e, usuario };
}

/**
 * Alta de usuario. Valida con el mismo esquema que la pantalla de usuarios. `claveTemporal`: la contraseña la eligió
 * otra persona (alta desde el panel), así que al primer ingreso hay que cambiarla.
 */
export async function crearUsuario(entrada: unknown, por: string, { claveTemporal = false } = {}): Promise<ResultadoAlta> {
  const r = NuevoUsuario.safeParse(conUsuarioDelCorreo(entrada));
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[i.path.join(".") || "_"] ??= i.message;
    return { ok: false, error: "datos_invalidos", errores };
  }
  const d = r.data;
  const alta = await insertarUsuario({
    usuario: d.usuario,
    ...(d.correo ? { correo: d.correo } : {}),
    nombre: d.nombre,
    rol: d.rol,
    // Solo Coordinación y Consulta usan la lista; para administración se guarda vacía y no confunde.
    paises: conPaises(d.rol) ? d.paises : [],
    activo: true,
    passwordHash: await hashearClave(d.clave),
    tokenVersion: 0,
    debeCambiarClave: claveTemporal,
    creadoEn: new Date(),
  });
  if (!alta.ok) return alta;
  await registrarAuditoria({ accion: "usuario_creado", usuario: d.usuario, usuarioId: alta.id, por, detalle: d.rol });
  return { ok: true, id: alta.id };
}

// ---------- Contraseña: cambio con sesión y enlace por correo ----------

export type ResultadoClave =
  | { ok: true; token: string; usuario: UsuarioSesion }
  | { ok: false; error: "datos_invalidos"; errores: Record<string, string> }
  | { ok: false; error: "enlace" | "no_encontrado" };

/** Guarda la contraseña nueva, quita la marca de temporal, cierra las demás sesiones y abre una nueva. */
async function guardarClave(id: ObjectId, nueva: string, ahora: number): Promise<{ token: string; usuario: UsuarioSesion } | null> {
  await actualizarUsuario(id, { passwordHash: await hashearClave(nueva), debeCambiarClave: false }, true);
  await borrarRestablecimientos(id);
  const u = await buscarPorId(id.toHexString());
  if (!u || !u.activo) return null;
  await Promise.all([limpiarFallos(claveUsuario(u.usuario)), ...(u.correo ? [limpiarFallos(claveUsuario(u.correo))] : [])]);
  return { token: crearToken(u._id.toHexString(), u.tokenVersion ?? 0, ahora), usuario: aSesion(u) };
}

/** Cambio de contraseña con sesión (primer ingreso o temporal). La nueva tiene que ser distinta de la actual. */
export async function cambiarClave(actor: UsuarioSesion, entrada: unknown, ctx: { ip: string; ahora?: number }): Promise<ResultadoClave> {
  const r = CambioClave.safeParse(entrada);
  if (!r.success) return { ok: false, error: "datos_invalidos", errores: erroresZod(r.error) };
  const u = await buscarConHash(actor.id);
  if (!u || !u.activo) return { ok: false, error: "no_encontrado" };
  if (await compararClave(r.data.nueva, u.passwordHash)) return { ok: false, error: "datos_invalidos", errores: { nueva: MENSAJES_AUTH.igualAnterior } };
  const hecho = await guardarClave(u._id, r.data.nueva, ctx.ahora ?? Date.now());
  if (!hecho) return { ok: false, error: "no_encontrado" };
  await registrarAuditoria({ accion: "clave_cambiada", usuario: u.usuario, usuarioId: u._id, ipHash: hashIp(ctx.ip) });
  return { ok: true, ...hecho };
}

const hashEnlace = (token: string) => createHash("sha256").update(token).digest("base64url");

export type ResultadoEnlace =
  | { ok: true }
  | { ok: false; error: "datos_invalidos"; errores: Record<string, string> }
  | { ok: false; error: "limite"; reintentarEnSeg: number };

/**
 * Pide el enlace para restablecer. Responde siempre igual (exista o no el correo) y no cuenta como intento de
 * ingreso. Límite propio por conexión y por correo para que no sirva para llenar buzones.
 */
export async function solicitarEnlace(entrada: unknown, ctx: { ip: string; origen: string; ahora?: number }): Promise<ResultadoEnlace> {
  const r = SolicitudEnlace.safeParse(entrada);
  if (!r.success) return { ok: false, error: "datos_invalidos", errores: erroresZod(r.error) };
  const ahora = ctx.ahora ?? Date.now();
  const { correo } = r.data;
  const [porIp, porCorreo] = await Promise.all([
    consumir("enlace-ip", ctx.ip, 10, BLOQUEO_MS, ahora),
    consumir("enlace-correo", correo, 3, BLOQUEO_MS, ahora),
  ]);
  if (!porIp.permitido) return { ok: false, error: "limite", reintentarEnSeg: porIp.reintentarEnSeg };
  // Por correo se responde igual que si se hubiera enviado: no revela si existe.
  if (!porCorreo.permitido) return { ok: true };

  const u = await buscarPorCorreo(correo);
  if (!u || !u.activo) return { ok: true };
  const token = randomBytes(32).toString("base64url");
  await guardarRestablecimiento({ _id: hashEnlace(token), usuarioId: u._id, creadoEn: new Date(ahora), expiraEn: new Date(ahora + MINUTOS_ENLACE * 60_000) });
  // El token va después de "#": el navegador no lo manda al servidor, así no queda en registros ni en el Referer.
  const enlace = `${ctx.origen}${RUTA_RESTABLECER}#t=${token}`;
  await notificador().restablecerClave({ correo, nombre: u.nombre, enlace, minutos: MINUTOS_ENLACE });
  await registrarAuditoria({ accion: "enlace_solicitado", usuario: u.usuario, usuarioId: u._id, ipHash: hashIp(ctx.ip) });
  return { ok: true };
}

/** Contraseña nueva desde el enlace: vale una sola vez y antes de vencer. */
export async function claveConEnlace(entrada: unknown, ctx: { ip: string; ahora?: number }): Promise<ResultadoClave> {
  const r = ClavePorEnlace.safeParse(entrada);
  if (!r.success) {
    const errores = erroresZod(r.error);
    return errores.token ? { ok: false, error: "enlace" } : { ok: false, error: "datos_invalidos", errores };
  }
  const ahora = ctx.ahora ?? Date.now();
  const enlace = await tomarRestablecimiento(hashEnlace(r.data.token), new Date(ahora));
  if (!enlace) return { ok: false, error: "enlace" };
  const hecho = await guardarClave(enlace.usuarioId, r.data.nueva, ahora);
  if (!hecho) return { ok: false, error: "enlace" };
  await registrarAuditoria({ accion: "clave_por_enlace", usuario: hecho.usuario.usuario, usuarioId: enlace.usuarioId, ipHash: hashIp(ctx.ip) });
  return { ok: true, ...hecho };
}
