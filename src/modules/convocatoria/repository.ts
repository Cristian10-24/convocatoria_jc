// Acceso a datos del módulo convocatoria. Colección propia con prefijo `conv_`.
// conv_avisos: correos de quienes pidieron que les avisen cuando abran las inscripciones de un país.
import "server-only";
import type { Db } from "mongodb";
import type { PaisSlug } from "@/shared/config/paises";
import { conIndices } from "@/shared/db/mongo";

export const COLECCION_AVISOS = "conv_avisos";

export type Aviso = {
  convocatoria: string;
  pais: PaisSlug;
  /** Correo normalizado (minúsculas, sin espacios). */
  correo: string;
  creadoEn: Date;
  ipHash: string;
  /** Se llena cuando se le envía el aviso de apertura (así no se le escribe dos veces). */
  notificadoEn?: Date;
};

const db = conIndices("convocatoria", (d: Db) =>
  // Un aviso por correo, país y convocatoria: pedirlo dos veces no crea dos registros.
  d.collection<Aviso>(COLECCION_AVISOS).createIndex({ convocatoria: 1, pais: 1, correo: 1 }, { unique: true, name: "aviso_unico" }),
);

/** Guarda el aviso si no existía. Devuelve true si es nuevo. */
export async function guardarAviso(aviso: Aviso): Promise<boolean> {
  const { convocatoria, pais, correo, ...resto } = aviso;
  const r = await (await db()).collection<Aviso>(COLECCION_AVISOS).updateOne({ convocatoria, pais, correo }, { $setOnInsert: { convocatoria, pais, correo, ...resto } }, { upsert: true });
  return r.upsertedCount === 1;
}
