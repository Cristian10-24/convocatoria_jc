// Formulario 2027 por país, contra un MongoDB en memoria: un envío válido y completo de cada país, formato anterior
// y nuevo de Uruguay, consentimientos separados con versión y fecha, ubicación (sede u otra ciudad) y aislamiento:
// mantenimiento o una configuración rota de un país no afectan a los demás.
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/inscripciones/route";
import { COLECCION } from "@/modules/inscripcion/repository";
import { reiniciarEntorno } from "@/shared/config/env";
import { PAISES, type PaisSlug } from "@/shared/config/paises";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import { ACUDIENTE, cedulaUy, haceAnios, inscripcionUy } from "./inscripcion-datos";
import { NUEVAS, nuevaCol, nuevaPan, nuevaUy } from "./inscripcion-paises-datos";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
let ip = 1;
let serie = 5_000_000;

const TODOS_ABIERTOS = { uy: { estado: "abierta" }, col: { estado: "abierta" }, ecu: { estado: "abierta" }, pan: { estado: "abierta" } };
function configurar(config: object = TODOS_ABIERTOS) {
  Object.assign(env, { NODE_ENV: "test", CONVOCATORIA_CONFIG: JSON.stringify(config), RATE_LIMIT_INSCRIPCION: "60" });
  delete env.TURNSTILE_SECRET_KEY;
  reiniciarEntorno();
}

async function enviar(pais: string, datos: Record<string, unknown>, origen: Record<string, string> = { utm_source: "whatsapp" }) {
  const req = new Request("http://localhost/api/inscripciones", {
    method: "POST",
    body: JSON.stringify({ pais, datos, sitio_web: "", iniciadoEn: Date.now() - 60_000, idempotencia: randomUUID(), origen }),
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "user-agent": "vitest", "x-real-ip": `10.8.0.${ip++ % 250}` },
  });
  const res = await POST(req);
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown> };
}
const coleccion = async () => (await getDb()).collection(COLECCION);
/** Documento distinto en cada envío, con la forma que pide cada país. */
const documentoDe = (pais: PaisSlug): string => {
  const n = serie++;
  return pais === "uy" ? cedulaUy(n) : pais === "col" ? `10${n}0` : pais === "ecu" ? `17${n}0` : `8-${String(n).slice(0, 3)}-${String(n).slice(3)}`;
};
const persona = (pais: PaisSlug, extra: Record<string, unknown> = {}) => NUEVAS[pais]({ documento: documentoDe(pais), ...extra });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = "pruebas_paises";
  env.CONVOCATORIA_ID = "jc-2027";
  configurar();
});
afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});
beforeEach(() => configurar());

describe("un envío válido y completo por cada país", () => {
  it.each(PAISES)("%s: se guarda con su sede, sus respuestas y sus consentimientos", async (pais) => {
    const r = await enviar(pais, persona(pais));
    expect(r.cuerpo, JSON.stringify(r.cuerpo)).toMatchObject({ yaExistia: false });
    expect(r.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ pais, convocatoria: "jc-2027", formato: 2, aceptaDatos: true, nombres: expect.any(String) });
    expect(doc!.sede).toBeTruthy();
    expect(typeof doc!.viveEnSede).toBe("boolean");
    // Consentimientos separados: qué aceptó, versión del texto y fecha.
    const consentimientos = doc!.consentimientos as Array<{ clave: string; respuesta: boolean; version: string; fecha: Date }>;
    expect(consentimientos.map((c) => c.clave)).toEqual(["privacidad", "datos"]);
    for (const c of consentimientos) {
      expect(c.respuesta).toBe(true);
      expect(c.version).toMatch(/provisional/);
      expect(c.fecha).toBeInstanceOf(Date);
    }
    expect(consentimientos[1]!.version).toContain(pais);
  });

  it("cada país guarda sus propias preguntas y no las de otro", async () => {
    const col = await (await coleccion()).findOne({ radicado: (await enviar("col", persona("col"))).cuerpo.radicado as string });
    expect(col).toMatchObject({ estrato: "2", vivienda: "familiar", nucleo: "4", laboral: "parcial_sin", conocimiento: "ninguno", ingles: "principiante", embajador: "Embajador de prueba 123", aplicoAntes: false });
    expect(col).not.toHaveProperty("promedio");
    const ecu = await (await coleccion()).findOne({ radicado: (await enviar("ecu", persona("ecu"))).cuerpo.radicado as string });
    expect(ecu).toMatchObject({ vivienda: "arrendada", canal: "flom_becario", lenguajes: "Python" });
    expect(ecu).not.toHaveProperty("estrato");
    const pan = await (await coleccion()).findOne({ radicado: (await enviar("pan", persona("pan"))).cuerpo.radicado as string });
    expect(pan).toMatchObject({ ingresos: "usd_650", documento: expect.stringMatching(/^8-\d+-\d+$/), ingles: "intermedio" });
    for (const k of ["vivienda", "estrato", "conocimiento", "aplicoAntes", "promedio"]) expect(pan).not.toHaveProperty(k);
    const uy = await (await coleccion()).findOne({ radicado: (await enviar("uy", persona("uy"))).cuerpo.radicado as string });
    expect(uy).toMatchObject({ promedio: 9.5, sede: "paysandu", ciudad: "Salto", viveEnSede: false, talla: "m" });
    for (const k of ["vivienda", "estrato", "ingles"]) expect(uy).not.toHaveProperty(k);
  });
});

describe("Uruguay: formato anterior y nuevo", () => {
  it("la API sigue aceptando el formato anterior (una casilla) y guarda su consentimiento con la versión de siempre", async () => {
    const r = await enviar("uy", inscripcionUy({ documento: documentoDe("uy") }));
    expect(r.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ formato: 1, aceptaDatos: true, versionAutorizacion: "uy-2027-provisional-1" });
    expect(doc!.consentimientos).toMatchObject([{ clave: "datos", respuesta: true, version: "uy-2027-provisional-1" }]);
  });

  it("formato anterior sin aceptar: lo rechaza y lo manda a su último paso", async () => {
    const r = await enviar("uy", inscripcionUy({ documento: documentoDe("uy"), aceptaDatos: false }));
    expect(r.status).toBe(400);
    expect(r.cuerpo).toMatchObject({ error: "datos_invalidos", paso: "cierre" });
    expect((r.cuerpo.errores as Record<string, string>).aceptaDatos).toBeDefined();
  });

  it("formato nuevo: las dos casillas son obligatorias y ninguna vale por la otra", async () => {
    for (const falta of ["aceptaPrivacidad", "autorizaDatos"]) {
      const documento = documentoDe("uy");
      const r = await enviar("uy", nuevaUy({ documento, [falta]: false }));
      expect(r.status).toBe(400);
      expect(r.cuerpo).toMatchObject({ error: "datos_invalidos", paso: "autorizacion" });
      expect(Object.keys(r.cuerpo.errores as object)).toEqual([falta]);
      expect(await (await coleccion()).countDocuments({ documento })).toBe(0);
    }
  });

  it("menor de edad: además autoriza el adulto responsable, y queda guardado", async () => {
    const { autorizaAcudiente: _casilla, ...adulto } = ACUDIENTE;
    void _casilla;
    const menor = nuevaUy({ documento: documentoDe("uy"), fechaNacimiento: haceAnios(16), ...adulto });
    const sin = await enviar("uy", menor);
    expect(sin.status).toBe(400);
    expect(Object.keys(sin.cuerpo.errores as object)).toEqual(["autorizaAcudiente"]);
    const con = await enviar("uy", { ...menor, autorizaAcudiente: true });
    expect(con.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: con.cuerpo.radicado as string });
    expect((doc!.consentimientos as Array<{ clave: string }>).map((c) => c.clave)).toEqual(["privacidad", "datos", "acudiente"]);
    expect(doc!.versionAutorizacionAcudiente).toBe("acudiente-2027-provisional-2");
  });

  it("Uruguay conserva sus preguntas: población múltiple, tallas XS–XXL, DNI argentino y ciudades argentinas", async () => {
    const r = await enviar("uy", nuevaUy({ tipoDocumento: "dni_ar", documento: "32456789", ciudad: "Colón (Argentina)", poblaciones: ["rural", "migrante"], talla: "xxl" }));
    expect(r.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ tipoDocumento: "dni_ar", ciudad: "Colón (Argentina)", poblaciones: ["rural", "migrante"], talla: "xxl" });
  });

  it("los datos sensibles se pueden dejar en «Prefiero no responder»", async () => {
    const r = await enviar("uy", nuevaUy({ documento: documentoDe("uy"), genero: "prefiero_no", poblaciones: ["prefiero_no"], ingresos: "prefiero_no" }));
    expect(r.status).toBe(201);
    const mezcla = await enviar("uy", nuevaUy({ documento: documentoDe("uy"), poblaciones: ["prefiero_no", "rural"] }));
    expect(mezcla.status).toBe(400);
  });
});

describe("ubicación: sede u otra ciudad", () => {
  it("quien vive en otra ciudad dice a qué sede podría asistir; la residencia se guarda aparte", async () => {
    const sinSede = await enviar("col", persona("col", { sede: "__otra__", ciudadOtra: "Soledad", ciudad: "" }));
    expect(sinSede.status).toBe(400);
    expect((sinSede.cuerpo.errores as Record<string, string>).sedeCercana).toBeDefined();
    expect(sinSede.cuerpo.paso).toBe("ubicacion");
    const r = await enviar("col", persona("col", { sede: "__otra__", ciudadOtra: "Soledad", ciudad: "", sedeCercana: "barranquilla" }));
    expect(r.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ sede: "barranquilla", ciudad: "Soledad", viveEnSede: false });
    expect(doc).not.toHaveProperty("ciudadOtra");
  });

  it("una ciudad cercana de la lista (Bello, del Valle de Aburrá) se guarda con la sede elegida", async () => {
    const r = await enviar("col", persona("col", { sede: "__otra__", ciudadOtra: "Bello", sedeCercana: "medellin", ciudad: "" }));
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ sede: "medellin", ciudad: "Bello", viveEnSede: false });
  });

  it("Uruguay: una ciudad cercana con la sede a la que asistiría, en el formato nuevo y en el anterior", async () => {
    const nuevo = await enviar("uy", nuevaUy({ documento: documentoDe("uy"), sede: "colonia", ciudad: "Carmelo" }));
    expect(nuevo.status).toBe(201);
    expect(await (await coleccion()).findOne({ radicado: nuevo.cuerpo.radicado as string })).toMatchObject({ sede: "colonia", ciudad: "Carmelo", viveEnSede: false });
    // Formato anterior (pestañas abiertas antes del cambio): sede y una ciudad de su lista, como siempre.
    const anterior = await enviar("uy", inscripcionUy({ documento: documentoDe("uy"), sede: "paysandu", ciudad: "Salto" }));
    expect(anterior.status).toBe(201);
    const ciudadSede = await enviar("uy", nuevaUy({ documento: documentoDe("uy"), sede: "colonia", ciudad: "Colonia del Sacramento" }));
    expect(await (await coleccion()).findOne({ radicado: ciudadSede.cuerpo.radicado as string })).toMatchObject({ viveEnSede: true });
  });

  it("con una sola sede (Panamá) no se pregunta cuál: se asigna", async () => {
    const r = await enviar("pan", persona("pan", { sede: "__otra__", ciudadOtra: "Colón", ciudad: "" }));
    expect(r.status).toBe(201);
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc).toMatchObject({ sede: "panama", ciudad: "Colón", viveEnSede: false });
  });

  it("una sede que no es del país se rechaza", async () => {
    expect((await enviar("ecu", persona("ecu", { sede: "medellin" }))).status).toBe(400);
  });
});

describe("reglas propias de cada país", () => {
  it("Panamá: la cédula conserva sus guiones; sin ellos se rechaza", async () => {
    const mala = await enviar("pan", nuevaPan({ documento: "81234567" }));
    expect(mala.status).toBe(400);
    expect((mala.cuerpo.errores as Record<string, string>).documento).toContain("guiones");
    const buena = await enviar("pan", nuevaPan({ documento: "pe-12-345" }));
    expect(buena.status).toBe(201);
    expect(await (await coleccion()).findOne({ radicado: buena.cuerpo.radicado as string })).toMatchObject({ documento: "PE-12-345" });
  });

  it("Colombia: la población es una sola respuesta y las condiciones laborales son opcionales", async () => {
    expect((await enviar("col", persona("col", { poblaciones: ["campesina", "migrante"] }))).status).toBe(400);
    const r = await enviar("col", persona("col", { laboral: "" }));
    expect(r.status).toBe(201);
    expect(await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string })).not.toHaveProperty("laboral");
  });

  it("Colombia: no acepta opciones de otro país ni preguntas sin responder", async () => {
    expect((await enviar("col", persona("col", { ingresos: "usd_650" }))).status).toBe(400);
    expect((await enviar("col", persona("col", { ocupacion: ["estudiante"] }))).status).toBe(400);
    const r = await enviar("col", persona("col", { estrato: "", servicios: [] }));
    expect(Object.keys(r.cuerpo.errores as object).sort()).toEqual(["estrato", "servicios"]);
    expect(r.cuerpo.paso).toBe("sociodemograficos");
  });

  it("el mismo documento no se inscribe dos veces en un país, pero sí en países distintos", async () => {
    const datos = nuevaCol({ documento: "1098765432" });
    expect((await enviar("col", datos)).status).toBe(201);
    expect((await enviar("col", { ...datos, correo: "otro.correo@gmail.com" })).status).toBe(409);
  });

  it("guarda el origen de la visita: UTM, fbclid y desde dónde abrió el formulario", async () => {
    const r = await enviar("pan", persona("pan"), { utm_source: "instagram", utm_campaign: "jc27", fbclid: "abc123", origen: "landing_pais", ubicacion: "hero_slide_1" });
    const doc = await (await coleccion()).findOne({ radicado: r.cuerpo.radicado as string });
    expect(doc!.origen).toEqual({ utm_source: "instagram", utm_campaign: "jc27", fbclid: "abc123", origen: "landing_pais", ubicacion: "hero_slide_1" });
  });
});

describe("aislamiento por país", () => {
  it("mantenimiento bloquea solo a ese país", async () => {
    configurar({ ...TODOS_ABIERTOS, uy: { estado: "mantenimiento" } });
    const documento = documentoDe("uy");
    const uy = await enviar("uy", nuevaUy({ documento }));
    expect(uy.status).toBe(503);
    expect(uy.cuerpo).toEqual({ error: "mantenimiento" });
    expect(await (await coleccion()).countDocuments({ documento })).toBe(0);
    for (const pais of ["col", "ecu", "pan"] as const) expect((await enviar(pais, persona(pais))).status, pais).toBe(201);
  });

  it("la configuración inválida de un país lo deja cerrado y no afecta a los demás", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    configurar({ ...TODOS_ABIERTOS, col: { estado: "abierrta" } });
    const col = await enviar("col", persona("col"));
    expect(col.status).toBe(409);
    expect(col.cuerpo).toEqual({ error: "cerrada" });
    for (const pais of ["uy", "ecu", "pan"] as const) expect((await enviar(pais, persona(pais))).status, pais).toBe(201);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("con el valor de producción solo Uruguay recibe inscripciones", async () => {
    configurar({ uy: { estado: "abierta", cierra: "2099-12-31" } });
    expect((await enviar("uy", persona("uy"))).status).toBe(201);
    for (const pais of ["col", "ecu", "pan"] as const) expect((await enviar(pais, persona(pais))).status, pais).toBe(409);
  });
});
