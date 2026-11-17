// Aislamiento por país: si el archivo de definición de un país falla al cargarse, solo ese país queda sin
// formulario (503) y se registra en el log; los demás siguen inscribiendo. Va en su propio archivo porque
// reemplaza el módulo de un país por uno roto.
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb } from "@/shared/db/mongo";
import { cedulaUy } from "./inscripcion-datos";
import { nuevaEcu, nuevaPan, nuevaUy } from "./inscripcion-paises-datos";

// La definición de Ecuador revienta al importarse; la de Panamá carga, pero incompleta.
vi.mock("@/modules/inscripcion/paises/ecu", () => {
  throw new Error("definición de Ecuador rota a propósito");
});
vi.mock("@/modules/inscripcion/paises/pan", () => ({ definicion: { pais: "pan", pasos: [] } }));

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
let ip = 1;

async function enviar(pais: string, datos: Record<string, unknown>) {
  const { POST } = await import("@/app/api/inscripciones/route");
  const req = new Request("http://localhost/api/inscripciones", {
    method: "POST",
    body: JSON.stringify({ pais, datos, sitio_web: "", iniciadoEn: Date.now() - 60_000, idempotencia: randomUUID() }),
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": `10.6.0.${ip++}` },
  });
  const res = await POST(req);
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown>, reintentar: res.headers.get("Retry-After") };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(env, {
    MONGODB_URI: mongo.getUri(), MONGODB_DB: "pruebas_aislamiento", CONVOCATORIA_ID: "jc-2027", NODE_ENV: "test",
    CONVOCATORIA_CONFIG: JSON.stringify({ uy: { estado: "abierta" }, ecu: { estado: "abierta" }, pan: { estado: "abierta" } }),
  });
  delete env.TURNSTILE_SECRET_KEY;
  reiniciarEntorno();
});
afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});

describe("un país con la definición rota no afecta a los demás", () => {
  it("ese país responde 503 (intenta en unos minutos), queda en el log, y Uruguay sigue inscribiendo", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const ecu = await enviar("ecu", nuevaEcu());
    expect(ecu.status).toBe(503);
    expect(ecu.cuerpo).toEqual({ error: "no_disponible" });
    expect(ecu.reintentar).toBe("300");
    const pan = await enviar("pan", nuevaPan());
    expect(pan.status).toBe(503);
    expect(err.mock.calls.flat().join(" ")).toContain('"ecu"');
    expect(err.mock.calls.flat().join(" ")).toContain('"pan"');
    err.mockRestore();

    const uy = await enviar("uy", nuevaUy({ documento: cedulaUy(6_100_001) }));
    expect(uy.status).toBe(201);
  });
});
