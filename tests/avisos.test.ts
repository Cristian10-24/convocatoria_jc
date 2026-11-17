// POST /api/avisos ("Avísame cuando abran") contra un MongoDB en memoria: guarda solo el correo, no duplica,
// solo acepta países en "muy pronto" y rechaza origen ajeno, bots y abuso.
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/avisos/route";
import { COLECCION_AVISOS } from "@/modules/convocatoria/repository";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
let ip = 1;

async function enviar(cuerpo: Record<string, unknown>, opciones: { headers?: Record<string, string>; ipFija?: string } = {}) {
  const req = new Request("http://localhost/api/avisos", {
    method: "POST",
    body: JSON.stringify(cuerpo),
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": opciones.ipFija ?? `10.7.0.${ip++ % 250}`, ...opciones.headers },
  });
  const res = await POST(req);
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown> };
}
const avisos = async () => (await getDb()).collection(COLECCION_AVISOS);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = "pruebas_avisos";
  env.CONVOCATORIA_ID = "jc-2027";
});
afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});
beforeEach(() => {
  env.CONVOCATORIA_CONFIG = JSON.stringify({ uy: { estado: "abierta" } });
  reiniciarEntorno();
});

describe("POST /api/avisos", () => {
  it("guarda el correo normalizado de un país en muy pronto, sin datos de más", async () => {
    const r = await enviar({ pais: "pan", correo: "  Lucia.Prueba@Gmail.com ", sitio_web: "" });
    expect(r.status).toBe(201);
    const doc = await (await avisos()).findOne({ pais: "pan" });
    expect(doc).toMatchObject({ convocatoria: "jc-2027", pais: "pan", correo: "lucia.prueba@gmail.com" });
    expect(Object.keys(doc!).sort()).toEqual(["_id", "convocatoria", "correo", "creadoEn", "ipHash", "pais"]);
    expect(String(doc!.ipHash)).not.toContain("10.7.0");
  });

  it("pedirlo dos veces no crea dos registros y responde igual", async () => {
    const a = await enviar({ pais: "col", correo: "repetido@gmail.com" });
    const b = await enviar({ pais: "col", correo: "REPETIDO@gmail.com" });
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(await (await avisos()).countDocuments({ pais: "col", correo: "repetido@gmail.com" })).toBe(1);
  });

  it("solo aplica en muy pronto: un país abierto, cerrado o en mantenimiento lo rechaza", async () => {
    expect((await enviar({ pais: "uy", correo: "abierta@gmail.com" })).status).toBe(409);
    env.CONVOCATORIA_CONFIG = JSON.stringify({ ecu: { estado: "mantenimiento" }, col: { estado: "cerrada" } });
    expect((await enviar({ pais: "ecu", correo: "mant@gmail.com" })).status).toBe(409);
    expect((await enviar({ pais: "col", correo: "cerrada@gmail.com" })).status).toBe(409);
    expect((await enviar({ pais: "pan", correo: "pronto@gmail.com" })).status).toBe(201);
  });

  it("rechaza correos inválidos, países desconocidos, origen ajeno y la trampa antibots", async () => {
    expect((await enviar({ pais: "pan", correo: "sin-arroba" })).status).toBe(400);
    expect((await enviar({ pais: "xx", correo: "a@gmail.com" })).status).toBe(400);
    expect((await enviar({ pais: "pan", correo: "a@gmail.com" }, { headers: { origin: "https://otro.example" } })).status).toBe(403);
    expect((await enviar({ pais: "pan", correo: "bot@gmail.com", sitio_web: "http://spam" })).status).toBe(400);
    expect(await (await avisos()).countDocuments({ correo: "bot@gmail.com" })).toBe(0);
  });

  it("limita los avisos por IP", async () => {
    const ipFija = "10.7.9.9";
    let ultimo = 0;
    for (let i = 0; i < 21; i++) ultimo = (await enviar({ pais: "pan", correo: `limite${i}@gmail.com` }, { ipFija })).status;
    expect(ultimo).toBe(429);
  });
});
