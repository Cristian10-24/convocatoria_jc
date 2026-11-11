// Acceso a datos del módulo de inscripción. Colección propia con prefijo `insc_`.
import "server-only";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import type { PaisSlug } from "@/shared/config/paises";
import { conIndices } from "@/shared/db/mongo";
import type { Alerta } from "./config/alertas";
import type { DatosInscripcion } from "./schema";

export const COLECCION = "insc_inscripciones";

export type Inscripcion = DatosInscripcion & {
  _id: ObjectId;
  radicado: string;
  convocatoria: string;
  pais: PaisSlug;
  alertas: Alerta[];
  versionAutorizacion: string;
  versionAutorizacionAcudiente?: string;
  creadoEn: Date;
  origen: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string };
  /** Clave que manda el navegador por cada intento de envío: reintentar el mismo envío no duplica. */
  idempotencia?: string;
  ipHash: string;
  userAgent: string;
};

const db = conIndices("inscripcion", (d: Db) => {
  const c = d.collection<Inscripcion>(COLECCION);
  return Promise.all([
    // Una inscripción por persona y convocatoria (decisión 4).
    c.createIndex({ convocatoria: 1, pais: 1, tipoDocumento: 1, documento: 1 }, { unique: true, name: "unica_por_documento" }),
    c.createIndex({ radicado: 1 }, { unique: true, name: "radicado_unico" }),
    c.createIndex({ idempotencia: 1 }, { unique: true, name: "idempotencia_unica", partialFilterExpression: { idempotencia: { $type: "string" } } }),
    // Panel: filtros por país/sede/ciudad y series por fecha.
    c.createIndex({ convocatoria: 1, pais: 1, sede: 1, ciudad: 1, creadoEn: -1 }),
    c.createIndex({ convocatoria: 1, creadoEn: -1 }),
    c.createIndex({ convocatoria: 1, correo: 1 }),
    c.createIndex({ convocatoria: 1, "alertas.codigo": 1 }),
  ]);
});

export async function coleccion() {
  return (await db()).collection<Inscripcion>(COLECCION);
}

/** ¿Hay otra inscripción con este correo en la convocatoria? */
export async function existeCorreo(convocatoria: string, correo: string): Promise<boolean> {
  return (await (await coleccion()).countDocuments({ convocatoria, correo }, { limit: 1 })) > 0;
}

export type ResultadoInsercion =
  | { ok: true }
  | { ok: false; motivo: "documento" | "radicado" | "idempotencia" };

/** Inserta; si choca con un índice único, dice cuál. */
export async function insertar(doc: Inscripcion): Promise<ResultadoInsercion> {
  try {
    await (await coleccion()).insertOne(doc);
    return { ok: true };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      const clave = Object.keys((e.keyPattern as Record<string, unknown> | undefined) ?? {});
      if (clave.includes("radicado")) return { ok: false, motivo: "radicado" };
      if (clave.includes("idempotencia")) return { ok: false, motivo: "idempotencia" };
      return { ok: false, motivo: "documento" };
    }
    throw e;
  }
}

export async function buscarPorIdempotencia(idempotencia: string) {
  return (await coleccion()).findOne({ idempotencia }, { projection: { radicado: 1, nombres: 1, documento: 1, tipoDocumento: 1, pais: 1 } });
}

export async function buscarPorDocumento(convocatoria: string, pais: PaisSlug, tipoDocumento: string, documento: string) {
  return (await coleccion()).findOne({ convocatoria, pais, tipoDocumento, documento }, { projection: { radicado: 1, idempotencia: 1, nombres: 1 } });
}

export function nuevoId(): ObjectId {
  return new ObjectId();
}
