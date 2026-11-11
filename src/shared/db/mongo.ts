// Conexión a MongoDB Atlas compartida por todos los módulos.
//
// - Un solo MongoClient por proceso, guardado en `globalThis`: se reutiliza entre recargas en desarrollo y entre
//   invocaciones de la misma instancia en Vercel (Fluid Compute), así una ráfaga de inscripciones no abre una
//   conexión por petición.
// - Cada módulo declara sus índices con `conIndices(clave, crear)`. Se crean una sola vez por proceso y, si fallan,
//   se reintenta en la siguiente petición (no se queda "envenenada" la promesa).
import "server-only";
import { MongoClient, type Db } from "mongodb";
import { entorno, requerida } from "@/shared/config/env";

declare global {
  var _convMongo: { uri: string; cliente: Promise<MongoClient> } | undefined;
  var _convIndices: Map<string, Promise<void>> | undefined;
}

function cliente(): Promise<MongoClient> {
  const uri = requerida("MONGODB_URI");
  // Si cambia la URI (pruebas), se abre un cliente nuevo.
  if (globalThis._convMongo?.uri !== uri) {
    const promesa = new MongoClient(uri, {
      maxPoolSize: entorno().MONGODB_MAX_POOL,
      // Falla rápido si Atlas no responde, en vez de colgar la función hasta su límite.
      serverSelectionTimeoutMS: 8_000,
      appName: "convocatoria-jc",
    }).connect();
    globalThis._convMongo = { uri, cliente: promesa };
    // Si la conexión falla, se olvida para reintentar en la próxima petición.
    promesa.catch(() => {
      if (globalThis._convMongo?.cliente === promesa) globalThis._convMongo = undefined;
    });
  }
  return globalThis._convMongo!.cliente;
}

/** Base de datos de la app (`MONGODB_DB`). El cluster puede tener otras bases: nunca se tocan. */
export async function getDb(): Promise<Db> {
  return (await cliente()).db(entorno().MONGODB_DB);
}

/**
 * Devuelve una función que entrega la base con los índices del módulo ya creados.
 * @param clave  nombre único del módulo (p. ej. "inscripcion")
 * @param crear  crea los índices (idempotente: `createIndex` no falla si ya existen con la misma definición)
 */
export function conIndices(clave: string, crear: (db: Db) => Promise<unknown>): () => Promise<Db> {
  return async () => {
    const db = await getDb();
    const mapa = (globalThis._convIndices ??= new Map());
    let listo = mapa.get(clave);
    if (!listo) {
      listo = crear(db).then(() => undefined);
      mapa.set(clave, listo);
      listo.catch(() => mapa.delete(clave));
    }
    await listo;
    return db;
  };
}

/** Host sin credenciales, para mostrar en scripts y logs. */
export function hostDb(): string {
  return (process.env.MONGODB_URI ?? "").replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, "").split(/[/?]/)[0] ?? "";
}

/** Para scripts y pruebas: cierra la conexión y olvida los índices. */
export async function cerrarDb(): Promise<void> {
  const actual = globalThis._convMongo;
  globalThis._convMongo = undefined;
  globalThis._convIndices = undefined;
  if (actual) await (await actual.cliente).close();
}
