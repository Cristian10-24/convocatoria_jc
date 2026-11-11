// Utilidades de servidor contra un MongoDB en memoria: conexión, índices, rate limit, cuerpo, origen, Turnstile, entorno.
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, conIndices, getDb } from "@/shared/db/mongo";
import { bloqueado, consumir, registrarFallo } from "@/shared/security/rateLimit";
import { ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { verificarTurnstile } from "@/shared/security/turnstile";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = "pruebas_shared";
  reiniciarEntorno();
});

afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});

beforeEach(() => {
  delete env.TURNSTILE_SECRET_KEY;
  env.NODE_ENV = "test";
  reiniciarEntorno();
});

describe("mongo", () => {
  it("reutiliza un solo cliente y crea índices una vez", async () => {
    const a = await getDb();
    const b = await getDb();
    expect(a.databaseName).toBe("pruebas_shared");
    expect(b).not.toBe(undefined);
    let llamadas = 0;
    const db = conIndices("prueba", async (d) => {
      llamadas++;
      await d.collection("x").createIndex({ campo: 1 }, { unique: true });
    });
    await Promise.all([db(), db(), db()]);
    expect(llamadas).toBe(1);
    const indices = await (await db()).collection("x").indexes();
    expect(indices.some((i) => i.key.campo === 1 && i.unique)).toBe(true);
  });

  it("reintenta la creación de índices si falló", async () => {
    let intentos = 0;
    const db = conIndices("falla-una-vez", async () => {
      intentos++;
      if (intentos === 1) throw new Error("fallo temporal");
    });
    await expect(db()).rejects.toThrow("fallo temporal");
    await expect(db()).resolves.toBeDefined();
    expect(intentos).toBe(2);
  });
});

describe("rate limit", () => {
  it("permite hasta el límite y luego bloquea, de forma atómica con envíos simultáneos", async () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 250)}`;
    const resultados = await Promise.all(Array.from({ length: 8 }, () => consumir("prueba", ip, 5)));
    expect(resultados.filter((r) => r.permitido)).toHaveLength(5);
    expect(Math.max(...resultados.map((r) => r.usados))).toBe(8);
  });

  it("la ventana nueva empieza en cero", async () => {
    const ip = "10.1.1.1";
    const t0 = Date.UTC(2027, 0, 1, 10, 0, 0);
    expect((await consumir("ventana", ip, 1, 60_000, t0)).permitido).toBe(true);
    expect((await consumir("ventana", ip, 1, 60_000, t0 + 1_000)).permitido).toBe(false);
    expect((await consumir("ventana", ip, 1, 60_000, t0 + 61_000)).permitido).toBe(true);
  });

  it("cuenta fallos para login", async () => {
    const ip = "10.2.2.2";
    expect(await bloqueado("login", ip, 2)).toBe(false);
    await registrarFallo("login", ip);
    await registrarFallo("login", ip);
    expect(await bloqueado("login", ip, 2)).toBe(true);
  });

  it("crea el índice TTL", async () => {
    await consumir("ttl", "10.3.3.3", 10);
    const indices = await (await getDb()).collection("rateLimits").indexes();
    expect(indices.some((i) => i.key.expiraEn === 1 && i.expireAfterSeconds === 0)).toBe(true);
  });
});

describe("peticiones", () => {
  const esquema = z.object({ nombre: z.string().min(2, "Muy corto") });
  const req = (cuerpo: string, headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/x", { method: "POST", body: cuerpo, headers: { host: "localhost", ...headers } });

  it("lee y valida el cuerpo con errores por campo", async () => {
    const ok = await leerCuerpo(req(JSON.stringify({ nombre: "Ana" })), esquema);
    expect("datos" in ok && ok.datos.nombre).toBe("Ana");
    const mal = await leerCuerpo(req(JSON.stringify({ nombre: "A" })), esquema);
    expect("error" in mal && mal.error.status).toBe(400);
    if ("error" in mal) expect(await mal.error.json()).toEqual({ error: "datos_invalidos", errores: { nombre: "Muy corto" } });
    const roto = await leerCuerpo(req("{no es json"), esquema);
    expect("error" in roto && roto.error.status).toBe(400);
  });

  it("rechaza cuerpos demasiado grandes", async () => {
    const r = await leerCuerpo(req(JSON.stringify({ nombre: "x".repeat(70_000) })), esquema);
    expect("error" in r && r.error.status).toBe(413);
  });

  it("verifica el mismo origen", () => {
    expect(mismoOrigen(req("", { origin: "http://localhost" }))).toBe(true);
    expect(mismoOrigen(req("", { origin: "https://malo.com" }))).toBe(false);
    expect(mismoOrigen(req(""))).toBe(false);
    expect(mismoOrigen(req(""), { permitirSinOrigen: true })).toBe(true);
  });

  it("obtiene la IP del cliente", () => {
    expect(ipCliente(req("", { "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(ipCliente(req("", { "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(ipCliente(req(""))).toBe("local");
  });
});

describe("turnstile", () => {
  const respuesta = (datos: object) => (async () => new Response(JSON.stringify(datos))) as unknown as typeof fetch;

  it("se omite en desarrollo/pruebas sin clave", async () => {
    expect(await verificarTurnstile(undefined)).toEqual({ ok: true, omitido: true });
  });

  it("falla cerrado en producción sin clave", async () => {
    env.NODE_ENV = "production";
    reiniciarEntorno();
    expect(await verificarTurnstile("token")).toEqual({ ok: false, motivo: "config" });
  });

  it("valida la respuesta de Cloudflare", async () => {
    env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    reiniciarEntorno();
    expect(await verificarTurnstile("", { fetchImpl: respuesta({ success: true }) })).toEqual({ ok: false, motivo: "sin_token" });
    expect(await verificarTurnstile("tok", { fetchImpl: respuesta({ success: true }) })).toEqual({ ok: true });
    expect(await verificarTurnstile("tok", { fetchImpl: respuesta({ success: false, "error-codes": ["timeout-or-duplicate"] }) })).toEqual({
      ok: false,
      motivo: "invalido",
      codigos: ["timeout-or-duplicate"],
    });
    const caido = (async () => {
      throw new Error("red");
    }) as unknown as typeof fetch;
    expect(await verificarTurnstile("tok", { fetchImpl: caido })).toEqual({ ok: false, motivo: "red" });
  });
});
