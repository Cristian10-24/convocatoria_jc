// Acceso a datos del módulo auth: colecciones `auth_usuarios` y `auth_auditoria`.
// Nunca se devuelve ni se registra una contraseña; el hash solo sale de aquí para compararlo en el login.
import "server-only";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import { conIndices } from "@/shared/db/mongo";
import type { PaisSlug } from "@/shared/config/paises";
import type { Rol } from "./config/roles";

export const COL_USUARIOS = "auth_usuarios";
export const COL_AUDITORIA = "auth_auditoria";

export type Usuario = {
  _id: ObjectId;
  usuario: string;
  nombre: string;
  rol: Rol;
  paises: PaisSlug[];
  activo: boolean;
  passwordHash: string;
  /** Subirlo invalida todas las sesiones abiertas del usuario. */
  tokenVersion: number;
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
  | "usuario_creado";

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
    d.collection<EventoAuditoria>(COL_AUDITORIA).createIndex({ en: -1 }),
    d.collection<EventoAuditoria>(COL_AUDITORIA).createIndex({ usuario: 1, en: -1 }),
  ]),
);

const usuarios = async () => (await db()).collection<Usuario>(COL_USUARIOS);
const auditoria = async () => (await db()).collection<EventoAuditoria>(COL_AUDITORIA);

const SIN_HASH = { projection: { passwordHash: 0 } } as const;

/** Para el login: incluye el hash. */
export async function buscarParaLogin(usuario: string): Promise<Usuario | null> {
  return (await usuarios()).findOne({ usuario });
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

export async function registrarAuditoria(evento: Omit<EventoAuditoria, "en"> & { en?: Date }): Promise<void> {
  await (await auditoria()).insertOne({ ...evento, en: evento.en ?? new Date() });
}
