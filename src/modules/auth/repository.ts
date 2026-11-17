// Acceso a datos del módulo auth: colecciones `auth_usuarios`, `auth_auditoria`, `auth_bloqueos` (intentos fallidos)
// y `auth_restablecer` (enlaces para crear una contraseña nueva; solo se guarda el hash del enlace).
// Nunca se devuelve ni se registra una contraseña; el hash solo sale de aquí para compararlo en el login.
import "server-only";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import { conIndices } from "@/shared/db/mongo";
import type { PaisSlug } from "@/shared/config/paises";
import type { Rol } from "./config/roles";

export const COL_USUARIOS = "auth_usuarios";
export const COL_AUDITORIA = "auth_auditoria";
export const COL_BLOQUEOS = "auth_bloqueos";
export const COL_RESTABLECER = "auth_restablecer";

export type Usuario = {
  _id: ObjectId;
  usuario: string;
  /** Correo institucional con el que entra (en minúsculas). Los usuarios anteriores pueden no tenerlo todavía. */
  correo?: string;
  nombre: string;
  rol: Rol;
  paises: PaisSlug[];
  activo: boolean;
  passwordHash: string;
  /** Subirlo invalida todas las sesiones abiertas del usuario. */
  tokenVersion: number;
  /** Entró (o va a entrar) con una contraseña temporal: hasta cambiarla solo puede ver la pantalla de cambio. */
  debeCambiarClave?: boolean;
  creadoEn: Date;
  ultimoIngreso?: Date;
};

/** Usuario sin el hash: lo que se usa fuera del login. */
export type UsuarioPublico = Omit<Usuario, "passwordHash">;

export type AccionAuditoria =
  | "login_ok"
  | "login_fallido"
  | "logout"
  | "revocacion"
  | "desactivacion"
  | "usuario_creado"
  | "usuario_editado"
  | "clave_restablecida"
  | "clave_cambiada"
  | "bloqueo"
  | "enlace_solicitado"
  | "clave_por_enlace"
  | "exportacion";

/**
 * Intentos fallidos de una clave ("u:<correo o usuario>" o "ip:<hash>"). Al llegar al máximo se bloquea un tiempo y
 * el contador vuelve a cero. Mongo borra el documento solo cuando ya no hay fallos ni bloqueo vigentes.
 */
export type Bloqueo = { _id: string; fallos: number; bloqueadoHasta?: Date; expiraEn: Date };

/** Enlace para crear una contraseña nueva: se guarda el hash del enlace, nunca el enlace. Sirve una sola vez. */
export type Restablecimiento = { _id: string; usuarioId: ObjectId; creadoEn: Date; expiraEn: Date };

export type EventoAuditoria = {
  accion: AccionAuditoria;
  /** Usuario afectado (en un login fallido, el escrito si tiene formato de usuario; si no, null). */
  usuario: string | null;
  usuarioId?: ObjectId;
  /** Quién hizo la acción, si no es el propio usuario (revocar, desactivar, crear). */
  por?: string;
  /** Motivo interno (p. ej. "no_existe", "inactivo", "clave"). Nunca se muestra a quien intenta entrar. */
  detalle?: string;
  ipHash?: string;
  en: Date;
};

const db = conIndices("auth", (d: Db) =>
  Promise.all([
    d.collection<Usuario>(COL_USUARIOS).createIndex({ usuario: 1 }, { unique: true, name: "usuario_unico" }),
    // Único solo entre quienes ya tienen correo (los usuarios anteriores no lo tienen).
    d.collection<Usuario>(COL_USUARIOS).createIndex({ correo: 1 }, { unique: true, name: "correo_unico", partialFilterExpression: { correo: { $type: "string" } } }),
    d.collection<Bloqueo>(COL_BLOQUEOS).createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0 }),
    d.collection<Restablecimiento>(COL_RESTABLECER).createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0 }),
    d.collection<Restablecimiento>(COL_RESTABLECER).createIndex({ usuarioId: 1 }),
    d.collection<EventoAuditoria>(COL_AUDITORIA).createIndex({ en: -1 }),
    d.collection<EventoAuditoria>(COL_AUDITORIA).createIndex({ usuario: 1, en: -1 }),
  ]),
);

const usuarios = async () => (await db()).collection<Usuario>(COL_USUARIOS);
const auditoria = async () => (await db()).collection<EventoAuditoria>(COL_AUDITORIA);

const SIN_HASH = { projection: { passwordHash: 0 } } as const;

/** Para el login: incluye el hash. Se entra con el correo o, mientras no lo tenga, con el usuario anterior. */
export async function buscarParaLogin(identificador: string): Promise<Usuario | null> {
  return (await usuarios()).findOne({ $or: [{ correo: identificador }, { usuario: identificador }] });
}

/** Usuario por id, con el hash (para comprobar que la contraseña nueva sea distinta de la actual). */
export async function buscarConHash(id: string): Promise<Usuario | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await usuarios()).findOne({ _id: new ObjectId(id) });
}

export async function buscarPorCorreo(correo: string): Promise<UsuarioPublico | null> {
  return (await usuarios()).findOne<UsuarioPublico>({ correo }, SIN_HASH);
}

export async function buscarPorId(id: string): Promise<UsuarioPublico | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await usuarios()).findOne<UsuarioPublico>({ _id: new ObjectId(id) }, SIN_HASH);
}

export async function insertarUsuario(datos: Omit<Usuario, "_id">): Promise<{ ok: true; id: ObjectId } | { ok: false; error: "duplicado" }> {
  try {
    const r = await (await usuarios()).insertOne({ _id: new ObjectId(), ...datos });
    return { ok: true, id: r.insertedId };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) return { ok: false, error: "duplicado" };
    throw e;
  }
}

export async function marcarIngreso(id: ObjectId, en = new Date()): Promise<void> {
  await (await usuarios()).updateOne({ _id: id }, { $set: { ultimoIngreso: en } });
}

/** Sube tokenVersion: cierra todas las sesiones del usuario. Devuelve false si no existe. */
export async function subirVersion(id: ObjectId): Promise<boolean> {
  const r = await (await usuarios()).updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
  return r.matchedCount === 1;
}

/** Desactiva y, en la misma operación, sube tokenVersion (sus sesiones se cierran aunque luego se reactive). */
export async function desactivar(id: ObjectId): Promise<boolean> {
  const r = await (await usuarios()).updateOne({ _id: id }, { $set: { activo: false }, $inc: { tokenVersion: 1 } });
  return r.matchedCount === 1;
}

export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  return (await usuarios()).find<UsuarioPublico>({}, SIN_HASH).sort({ activo: -1, usuario: 1 }).toArray();
}

/** Cuántos admins activos hay, sin contar `excepto` (para no dejar el panel sin administración). */
export async function contarAdminsActivos(excepto?: ObjectId): Promise<number> {
  return (await usuarios()).countDocuments({ rol: "admin", activo: true, ...(excepto ? { _id: { $ne: excepto } } : {}) });
}

/** Cambia datos del usuario. `cerrarSesiones` sube tokenVersion en la misma operación. */
export async function actualizarUsuario(
  id: ObjectId,
  cambios: Partial<Pick<Usuario, "nombre" | "correo" | "rol" | "paises" | "activo" | "passwordHash" | "debeCambiarClave">>,
  cerrarSesiones = false,
): Promise<boolean> {
  const r = await (await usuarios()).updateOne({ _id: id }, { $set: cambios, ...(cerrarSesiones ? { $inc: { tokenVersion: 1 } } : {}) });
  return r.matchedCount === 1;
}

export async function registrarAuditoria(evento: Omit<EventoAuditoria, "en"> & { en?: Date }): Promise<void> {
  await (await auditoria()).insertOne({ ...evento, en: evento.en ?? new Date() });
}

// ---------- Bloqueo por intentos fallidos ----------

const bloqueos = async () => (await db()).collection<Bloqueo>(COL_BLOQUEOS);

export async function leerBloqueos(claves: string[]): Promise<Bloqueo[]> {
  return (await bloqueos()).find({ _id: { $in: claves } }).toArray();
}

/**
 * Suma un fallo en una operación atómica. Si llega a `maximo`, bloquea hasta `ahora + bloqueoMs` y deja el contador
 * en cero (el siguiente ciclo empieza limpio). Devuelve el estado resultante.
 */
export async function sumarFallo(clave: string, maximo: number, bloqueoMs: number, ahora: Date): Promise<Bloqueo> {
  const hasta = new Date(ahora.getTime() + bloqueoMs);
  const doc = await (await bloqueos()).findOneAndUpdate(
    { _id: clave },
    [
      { $set: { fallos: { $add: [{ $ifNull: ["$fallos", 0] }, 1] } } },
      {
        $set: {
          bloqueadoHasta: { $cond: [{ $gte: ["$fallos", maximo] }, hasta, "$bloqueadoHasta"] },
          fallos: { $cond: [{ $gte: ["$fallos", maximo] }, 0, "$fallos"] },
          expiraEn: hasta,
        },
      },
    ],
    { upsert: true, returnDocument: "after" },
  );
  return doc ?? { _id: clave, fallos: 1, expiraEn: hasta };
}

export async function limpiarFallos(clave: string): Promise<void> {
  await (await bloqueos()).deleteOne({ _id: clave });
}

// ---------- Enlaces para restablecer la contraseña ----------

const restablecer = async () => (await db()).collection<Restablecimiento>(COL_RESTABLECER);

/** Guarda un enlace nuevo y anula los anteriores del mismo usuario (solo vale el último). */
export async function guardarRestablecimiento(r: Restablecimiento): Promise<void> {
  const col = await restablecer();
  await col.deleteMany({ usuarioId: r.usuarioId });
  await col.insertOne(r);
}

/** Toma el enlace (lo borra en la misma operación) si existe y no venció. */
export async function tomarRestablecimiento(hash: string, ahora: Date): Promise<Restablecimiento | null> {
  return (await restablecer()).findOneAndDelete({ _id: hash, expiraEn: { $gt: ahora } });
}

export async function borrarRestablecimientos(usuarioId: ObjectId): Promise<void> {
  await (await restablecer()).deleteMany({ usuarioId });
}
