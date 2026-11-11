// Límite de peticiones por IP con ventanas fijas en MongoDB (colección `rateLimits`, con TTL).
// Cada contador es un documento `{ _id: "tipo:ip:ventana", count, expiraEn }`; Mongo borra los viejos solo.
// Una sola operación atómica (`findOneAndUpdate` con upsert) por petición: sin carreras con muchos envíos a la vez.
import "server-only";
import type { Db } from "mongodb";
import { conIndices } from "@/shared/db/mongo";

export const VENTANA_MS = 15 * 60 * 1000;

type Contador = { _id: string; count: number; expiraEn: Date };

const db = conIndices("rateLimits", (d: Db) =>
  d.collection<Contador>("rateLimits").createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0 }),
);

function clave(tipo: string, ip: string, ahora: number, ventanaMs: number) {
  const ventana = Math.floor(ahora / ventanaMs);
  return { _id: `${tipo}:${ip}:${ventana}`, expiraEn: new Date((ventana + 1) * ventanaMs) };
}

export type Resultado = { permitido: boolean; usados: number; limite: number; reintentarEnSeg: number };

/**
 * Suma un uso y dice si sigue dentro del límite. Para acciones que cuentan siempre (p. ej. cada envío del formulario).
 */
export async function consumir(tipo: string, ip: string, limite: number, ventanaMs = VENTANA_MS, ahora = Date.now()): Promise<Resultado> {
  const { _id, expiraEn } = clave(tipo, ip, ahora, ventanaMs);
  const col = (await db()).collection<Contador>("rateLimits");
  const doc = await col.findOneAndUpdate(
    { _id },
    { $inc: { count: 1 }, $setOnInsert: { expiraEn } },
    { upsert: true, returnDocument: "after" },
  );
  const usados = doc?.count ?? 1;
  return { permitido: usados <= limite, usados, limite, reintentarEnSeg: Math.ceil((expiraEn.getTime() - ahora) / 1000) };
}

/** Para acciones donde solo cuentan los fallos (login): ¿ya llegó al límite en esta ventana? */
export async function bloqueado(tipo: string, ip: string, limite: number, ventanaMs = VENTANA_MS, ahora = Date.now()): Promise<boolean> {
  const col = (await db()).collection<Contador>("rateLimits");
  const doc = await col.findOne({ _id: clave(tipo, ip, ahora, ventanaMs)._id });
  return (doc?.count ?? 0) >= limite;
}

/** Suma un fallo (login). */
export async function registrarFallo(tipo: string, ip: string, ventanaMs = VENTANA_MS, ahora = Date.now()): Promise<void> {
  const { _id, expiraEn } = clave(tipo, ip, ahora, ventanaMs);
  const col = (await db()).collection<Contador>("rateLimits");
  await col.updateOne({ _id }, { $inc: { count: 1 }, $setOnInsert: { expiraEn } }, { upsert: true });
}

export const MENSAJE_LIMITE = "Recibimos demasiados intentos desde tu conexión. Espera unos minutos e intenta otra vez.";
