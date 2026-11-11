// POST /api/inscripciones contra un MongoDB en memoria: guardado, duplicados (también simultáneos), idempotencia,
// país cerrado, origen ajeno, antibots, rate limit, Turnstile y alertas.
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import { COLECCION } from "@/modules/inscripcion/repository";
import { POST } from "@/app/api/inscripciones/route";
import { ACUDIENTE, cedulaUy, haceAnios, inscripcionUy } from "./inscripcion-datos";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
let ip = 1;
let cedula = 3_000_000;

function configurar(extra: Record<string, string | undefined> = {}) {
  Object.assign(env, {
    NODE_ENV: "test",
    CONVOCATORIA_CONFIG: JSON.stringify({ uy: { estado: "abierta" } }),
    RATE_LIMIT_INSCRIPCION: "60",
    TURNSTILE_SECRET_KEY: undefined,
    ...extra,
  });
  for (const [k, v] of Object.entries(extra)) if (v === undefined) delete env[k];
  if (!("TURNSTILE_SECRET_KEY" in extra)) delete env.TURNSTILE_SECRET_KEY;
  reiniciarEntorno();
}

/** Arma y envía un POST como lo haría el navegador. */
async function enviar(datos: Record<string, unknown>, opciones: { pais?: string; sobre?: Record<string, unknown>; headers?: Record<string, string>; ipFija?: string } = {}) {
  const cuerpo = {
    pais: opciones.pais ?? "uy",
    datos,
    sitio_web: "",
    iniciadoEn: Date.now() - 60_000,
    idempotencia: randomUUID(),
    origen: { utm_source: "whatsapp" },
    ...opciones.sobre,
  };
  const req = new Request("http://localhost/api/inscripciones", {
    method: "POST",
    body: JSON.stringify(cuerpo),
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "content-type": "application/json",
      "user-agent": "vitest",
      "x-real-ip": opciones.ipFija ?? `10.9.0.${ip++ % 250}`,
      ...opciones.headers,
    },
  });
  const res = await POST(req);
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown> };
}

const persona = (extra: Record<string, unknown> = {}) => inscripcionUy({ documento: cedulaUy(cedula++), ...extra });
const coleccion = async () => (await getDb()).collection(COLECCION);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = "pruebas_inscripcion";
  env.CONVOCATORIA_ID = "jc-2027";
  configurar();
});

afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});

beforeEach(() => configurar());

describe("POST /api/inscripciones", () => {
  it("guarda una inscripción válida y devuelve el radicado", async () => {
    const datos = persona();
    const r = await enviar(datos);
    expect(r.status).toBe(201);
    expect(r.cuerpo.radicado).toMatch(/^JC27-UY-[0-9A-Z]{8}$/);
    expect(r.cuerpo.nombres).toBe("María José");

    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado });
    expect(doc).toMatchObject({
      convocatoria: "jc-2027",
      pais: "uy",
      sede: "paysandu",
      documento: String(datos.documento),
      whatsapp: "+59891234567",
      alertas: [],
      versionAutorizacion: "uy-2027-provisional-1",
      origen: { utm_source: "whatsapp" },
    });
    expect(doc?.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(doc)).not.toContain("10.9.0."); // la IP solo se guarda como hash
  });

  it("rechaza un documento ya inscrito (mismo país, tipo y número)", async () => {
    const datos = persona();
    expect((await enviar(datos)).status).toBe(201);
    const otra = await enviar({ ...datos, documento: `${String(datos.documento).slice(0, 7)}-${String(datos.documento).slice(7)}`, correo: "otro@gmail.com" });
    expect(otra.status).toBe(409);
    expect(otra.cuerpo.error).toBe("duplicado");
  });

  it("con envíos simultáneos del mismo documento, solo uno se guarda", async () => {
    const datos = persona();
    const resultados = await Promise.all(Array.from({ length: 6 }, () => enviar(datos)));
    expect(resultados.filter((r) => r.status === 201)).toHaveLength(1);
    expect(resultados.filter((r) => r.status === 409)).toHaveLength(5);
    expect(await (await coleccion()).countDocuments({ documento: datos.documento })).toBe(1);
  });

  it("reintentar el mismo envío (misma clave) devuelve el mismo radicado sin duplicar", async () => {
    const datos = persona();
    const idempotencia = randomUUID();
    const primero = await enviar(datos, { sobre: { idempotencia } });
    const reintento = await enviar(datos, { sobre: { idempotencia } });
    expect(primero.status).toBe(201);
    expect(reintento.status).toBe(200);
    expect(reintento.cuerpo).toMatchObject({ radicado: primero.cuerpo.radicado, yaExistia: true });
    // Doble clic: los dos llegan a la vez con la misma clave.
    const otros = persona();
    const clave = randomUUID();
    const par = await Promise.all([enviar(otros, { sobre: { idempotencia: clave } }), enviar(otros, { sobre: { idempotencia: clave } })]);
    expect(par.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(par[0]!.cuerpo.radicado).toBe(par[1]!.cuerpo.radicado);
  });

  it("no acepta países sin formulario habilitado ni convocatorias sin abrir o vencidas", async () => {
    expect((await enviar(persona(), { pais: "col" })).cuerpo.error).toBe("cerrada");
    configurar({ CONVOCATORIA_CONFIG: JSON.stringify({ uy: { estado: "proxima" } }) });
    expect((await enviar(persona())).status).toBe(409);
    configurar({ CONVOCATORIA_CONFIG: JSON.stringify({ uy: { estado: "abierta", cierra: "2020-01-31" } }) });
    expect((await enviar(persona())).cuerpo.error).toBe("cerrada");
    configurar({ CONVOCATORIA_CONFIG: "{no es json" });
    expect((await enviar(persona())).cuerpo.error).toBe("cerrada");
  });

  it("devuelve los errores por campo y el paso donde corregir", async () => {
    const r = await enviar(persona({ whatsapp: "123", talla: "" }));
    expect(r.status).toBe(400);
    expect(r.cuerpo.error).toBe("datos_invalidos");
    expect(r.cuerpo.errores).toMatchObject({ whatsapp: expect.any(String), talla: expect.any(String) });
    expect(r.cuerpo.paso).toBe("personales");
  });

  it("pide el acudiente a menores y lo guarda", async () => {
    const menor = persona({ fechaNacimiento: haceAnios(15) });
    const sin = await enviar(menor);
    expect(sin.status).toBe(400);
    expect(sin.cuerpo.paso).toBe("acudiente");
    const con = await enviar({ ...menor, ...ACUDIENTE });
    expect(con.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: con.cuerpo.radicado });
    expect(doc?.acudiente).toMatchObject({ nombres: "Laura", correo: "laura.gomez@hotmail.com", relacion: "madre" });
    expect(doc?.acudiente).not.toHaveProperty("relacionOtra"); // los opcionales vacíos no se guardan como null
    expect(doc?.versionAutorizacionAcudiente).toBe("acudiente-2027-provisional-1");
  });

  it("guarda las alertas (incluido el correo repetido) sin bloquear", async () => {
    const a = await enviar(persona({ correo: "repetido@gmail.com" }));
    const b = await enviar(persona({ correo: "repetido@gmail.com", internet: "no", horas: "5a10" }));
    expect([a.status, b.status]).toEqual([201, 201]);
    const doc = await (await coleccion()).findOne({ radicado: b.cuerpo.radicado });
    expect((doc?.alertas as { codigo: string }[]).map((x) => x.codigo)).toEqual(["sin_internet", "pocas_horas", "correo_repetido"]);
  });

  it("rechaza peticiones de otro origen", async () => {
    expect((await enviar(persona(), { headers: { origin: "https://malo.com" } })).status).toBe(403);
  });

  it("detecta bots: campo trampa y envío demasiado rápido", async () => {
    expect((await enviar(persona(), { sobre: { sitio_web: "http://spam" } })).cuerpo.error).toBe("bot");
    expect((await enviar(persona(), { sobre: { iniciadoEn: Date.now() - 500 } })).cuerpo.error).toBe("bot");
  });

  it("limita los envíos por IP", async () => {
    configurar({ RATE_LIMIT_INSCRIPCION: "3" });
    const ipFija = "10.77.77.77";
    const estados = [];
    for (let i = 0; i < 4; i++) estados.push((await enviar(persona(), { ipFija })).status);
    expect(estados).toEqual([201, 201, 201, 429]);
  });

  it("en producción exige Turnstile (sin clave, falla cerrado)", async () => {
    configurar({ NODE_ENV: "production", IP_HASH_SALT: "sal-de-pruebas-123456" });
    const r = await enviar(persona());
    expect(r.status).toBe(403);
    expect(r.cuerpo.error).toBe("verificacion");
  });

  it("rechaza cuerpos que no son una inscripción", async () => {
    const req = new Request("http://localhost/api/inscripciones", {
      method: "POST",
      body: "{no es json",
      headers: { host: "localhost", origin: "http://localhost", "x-real-ip": "10.8.8.8" },
    });
    expect((await POST(req)).status).toBe(400);
    expect((await enviar(persona(), { pais: "ar" })).status).toBe(400);
  });

  it("crea los índices únicos", async () => {
    const indices = await (await coleccion()).indexes();
    const nombres = indices.map((i) => i.name);
    expect(nombres).toEqual(expect.arrayContaining(["unica_por_documento", "radicado_unico", "idempotencia_unica"]));
  });
});
