// Turnstile de punta a punta en el servidor: con la clave secreta puesta (como en producción y en el preview), el
// token llega a POST /api/inscripciones en el campo `turnstile`, se verifica con Cloudflare (siteverify, aquí
// simulado) y solo con un token válido se guarda la inscripción.
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/inscripciones/route";
import { COLECCION } from "@/modules/inscripcion/repository";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import { cedulaUy } from "./inscripcion-datos";
import { nuevaUy } from "./inscripcion-paises-datos";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
const SECRETO_PRUEBA = "1x0000000000000000000000000000000AA"; // clave secreta de prueba pública de Cloudflare
const TOKEN_PRUEBA = "XXXX.DUMMY.TOKEN.XXXX"; // el token que entrega la clave de sitio de prueba
let ip = 1;
let cedula = 7_100_000;

/** Simula siteverify: responde según el token y guarda lo que recibió. */
const llamadas: URLSearchParams[] = [];
function simularCloudflare() {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) => {
    if (!String(url).includes("challenges.cloudflare.com")) return real(url, init);
    const cuerpo = new URLSearchParams(String(init?.body));
    llamadas.push(cuerpo);
    const valido = cuerpo.get("secret") === SECRETO_PRUEBA && cuerpo.get("response") === TOKEN_PRUEBA;
    return new Response(JSON.stringify(valido ? { success: true, action: "inscripcion" } : { success: false, "error-codes": ["invalid-input-response"] }));
  }));
}

async function enviar(sobre: Record<string, unknown>) {
  const req = new Request("http://localhost/api/inscripciones", {
    method: "POST",
    body: JSON.stringify({ pais: "uy", datos: nuevaUy({ documento: cedulaUy(cedula++) }), sitio_web: "", iniciadoEn: Date.now() - 60_000, idempotencia: randomUUID(), ...sobre }),
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": `10.5.0.${ip++}` },
  });
  const res = await POST(req);
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown> };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(env, {
    MONGODB_URI: mongo.getUri(), MONGODB_DB: "pruebas_turnstile", CONVOCATORIA_ID: "jc-2027", NODE_ENV: "production", IP_HASH_SALT: "sal-de-prueba",
    TURNSTILE_SECRET_KEY: SECRETO_PRUEBA, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    CONVOCATORIA_CONFIG: JSON.stringify({ uy: { estado: "abierta" } }),
  });
  reiniciarEntorno();
  simularCloudflare();
});
afterEach(() => { llamadas.length = 0; });
afterAll(async () => {
  vi.unstubAllGlobals();
  for (const k of ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "IP_HASH_SALT"]) delete env[k];
  env.NODE_ENV = "test";
  reiniciarEntorno();
  await cerrarDb();
  await mongo?.stop();
});

describe("Turnstile con la clave secreta puesta (producción / preview)", () => {
  it("con el token de prueba en el campo `turnstile`, se verifica en Cloudflare y se guarda", async () => {
    const r = await enviar({ turnstile: TOKEN_PRUEBA });
    expect(r.status, JSON.stringify(r.cuerpo)).toBe(201);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.get("response")).toBe(TOKEN_PRUEBA);
    expect(llamadas[0]!.get("secret")).toBe(SECRETO_PRUEBA);
    expect(llamadas[0]!.get("idempotency_key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(await (await getDb()).collection(COLECCION).countDocuments({ radicado: r.cuerpo.radicado as string })).toBe(1);
  });

  it("sin token, con un token en otro campo o con un token inválido, rechaza y no guarda nada", async () => {
    const antes = await (await getDb()).collection(COLECCION).countDocuments();
    for (const sobre of [{}, { token: TOKEN_PRUEBA }, { "cf-turnstile-response": TOKEN_PRUEBA }, { turnstile: "token-falso" }]) {
      const r = await enviar(sobre);
      expect(r.status, JSON.stringify(sobre)).toBe(403);
      expect(r.cuerpo).toEqual({ error: "verificacion" });
    }
    expect(await (await getDb()).collection(COLECCION).countDocuments()).toBe(antes);
  });

  it("si Cloudflare no responde, rechaza (falla cerrado) y el navegador puede reintentar con un token nuevo", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("sin red"));
    expect((await enviar({ turnstile: TOKEN_PRUEBA })).status).toBe(403);
    expect((await enviar({ turnstile: TOKEN_PRUEBA })).status).toBe(201);
  });
});
