// Panel de inscritos contra un MongoDB en memoria: alcance por país aplicado en el servidor, búsqueda, filtros,
// detalle con datos sensibles reservados, estadísticas, exportación (sanitizada, sin columnas sensibles para quien
// no es admin, con auditoría) y gestión de usuarios.
import { MongoMemoryServer } from "mongodb-memory-server";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import { PAISES } from "@/shared/config/paises";
import { GET as exportar } from "@/app/api/admin/exportar/route";
import { POST as login } from "@/app/api/auth/login/route";
import { alcanceDe } from "@/modules/auth/permisos";
import { COL_AUDITORIA } from "@/modules/auth/repository";
import { crearUsuario, editarUsuario, listarUsuarios, restablecerClave, verificarSesion, type UsuarioSesion } from "@/modules/auth/service";
import { buscarInscripcion, estadisticas, listarInscritos } from "@/modules/inscripcion/panel/consultas";
import { generarCsv } from "@/modules/inscripcion/panel/exportacion";
import { aQuery, leerFiltros } from "@/modules/inscripcion/panel/filtros";
import { seccionesDetalle } from "@/modules/inscripcion/panel/presentacion";
import { seriesTablero, serieDiaria } from "@/modules/inscripcion/panel/tablero";
import { COLECCION, type Inscripcion } from "@/modules/inscripcion/repository";
import { ObjectId } from "mongodb";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
const CLAVE = "Clave-de-prueba-2027";
const ADMIN = { paises: [...PAISES], verSensibles: true };
const COORD_UY = { paises: ["uy" as const], verSensibles: false };
const filtros = (q: Record<string, string> = {}) => leerFiltros(q);
let ip = 1;

function doc(extra: Partial<Inscripcion> = {}): Inscripcion {
  const _id = new ObjectId();
  return {
    _id,
    radicado: `JC27-UY-${_id.toHexString().slice(-8).toUpperCase()}`,
    convocatoria: "jc-2027",
    pais: "uy",
    sede: "paysandu",
    ciudad: "Salto",
    direccion: "Calle 1",
    nombres: "María José",
    apellidos: "Pérez Gómez",
    tipoDocumento: "ci",
    documento: String(Math.floor(Math.random() * 1e8)),
    fechaNacimiento: "2007-05-10",
    edad: 19,
    correo: "maria@gmail.com",
    whatsapp: "+59891234567",
    telefonoAlterno: "+59899876543",
    grado: "6",
    promedio: 9.5,
    institucion: "Liceo 1",
    internet: true,
    computadora: "propia",
    autonomia: "si",
    horas: "10a15",
    ocupacion: ["estudiante"],
    emprendimiento: "no",
    otrasPostulaciones: "no",
    aplicoAntes: false,
    genero: "femenino",
    poblaciones: ["rural"],
    ingresos: "menos1",
    talla: "m",
    canal: "instagram",
    aceptaDatos: true,
    alertas: [],
    versionAutorizacion: "uy-2027-provisional-1",
    creadoEn: new Date(),
    origen: {},
    ipHash: "x",
    userAgent: "vitest",
    ...extra,
  };
}

const coleccion = async () => (await getDb()).collection<Inscripcion>(COLECCION);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(env, { MONGODB_URI: mongo.getUri(), MONGODB_DB: "pruebas_panel", NODE_ENV: "test", CONVOCATORIA_ID: "jc-2027", SESSION_SECRET: "secreto-de-pruebas-de-al-menos-32-caracteres", RATE_LIMIT_LOGIN: "50" });
  reiniciarEntorno();
  const col = await coleccion();
  await col.insertMany([
    doc({ nombres: "José", apellidos: "Núñez", documento: "11111111", correo: "jose@gmail.com" }),
    doc({ edad: 16, acudiente: { nombres: "Ana", apellidos: "Núñez", correo: "ana@gmail.com", telefono: "+59891111111", relacion: "madre" }, alertas: [{ codigo: "sin_internet", motivo: "No tiene acceso a internet" }], internet: false }),
    doc({ sede: "colonia", ciudad: "Carmelo", institucion: "=HYPERLINK(\"http://malo\",\"x\")" }),
    doc({ pais: "col", sede: "bogota", ciudad: "Bogotá D.C.", tipoDocumento: "cc", documento: "22222222", nombres: "Camilo", apellidos: "Rojas" }),
    doc({ convocatoria: "jc-2026", documento: "33333333" }), // otra convocatoria: nunca aparece
  ]);
});

afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});

beforeEach(() => reiniciarEntorno());

describe("alcance por país (en el servidor)", () => {
  it("admin ve todos los países de la convocatoria actual; coordinador solo los suyos", async () => {
    expect((await listarInscritos(ADMIN, filtros())).total).toBe(4);
    expect((await listarInscritos(COORD_UY, filtros())).total).toBe(3);
  });

  it("un coordinador que pide otro país por la URL recibe una lista vacía", async () => {
    expect((await listarInscritos(COORD_UY, filtros({ pais: "col" }))).total).toBe(0);
    expect((await estadisticas(COORD_UY, filtros({ pais: "col" }))).total).toBe(0);
  });

  it("sin países asignados no ve nada (falla cerrado)", async () => {
    const vacio = alcanceDe({ rol: "coordinador", paises: [] });
    expect((await listarInscritos(vacio, filtros())).total).toBe(0);
    expect((await estadisticas(vacio, filtros())).total).toBe(0);
  });

  it("el detalle fuera del alcance responde null", async () => {
    const col = (await (await coleccion()).findOne({ pais: "col" }))!;
    expect(await buscarInscripcion(COORD_UY, col._id.toHexString())).toBeNull();
    expect(await buscarInscripcion(ADMIN, col._id.toHexString())).not.toBeNull();
    expect(await buscarInscripcion(ADMIN, "no-es-un-id")).toBeNull();
  });
});

describe("búsqueda y filtros", () => {
  it("busca por nombre sin tildes, por documento, por correo y por radicado", async () => {
    expect((await listarInscritos(ADMIN, filtros({ q: "jose nunez" }))).filas.map((f) => f.apellidos)).toEqual(["Núñez"]);
    expect((await listarInscritos(ADMIN, filtros({ q: "11111111" }))).total).toBe(1);
    expect((await listarInscritos(ADMIN, filtros({ q: "JOSE@gmail.com" }))).total).toBe(1);
    const una = (await listarInscritos(ADMIN, filtros())).filas[0]!;
    expect((await listarInscritos(ADMIN, filtros({ q: una.radicado.toLowerCase() }))).filas[0]?.id).toBe(una.id);
    // Caracteres de regex en la búsqueda no rompen nada.
    expect((await listarInscritos(ADMIN, filtros({ q: "(.*" }))).total).toBe(0);
  });

  it("filtra por sede, menor de edad y alerta", async () => {
    expect((await listarInscritos(ADMIN, filtros({ sede: "colonia" }))).total).toBe(1);
    expect((await listarInscritos(ADMIN, filtros({ menor: "si" }))).total).toBe(1);
    expect((await listarInscritos(ADMIN, filtros({ alerta: "sin_internet" }))).total).toBe(1);
    expect((await listarInscritos(ADMIN, filtros({ alerta: "sin" }))).total).toBe(3);
  });

  it("los valores raros en la URL se ignoran y la página se acota", async () => {
    const f = filtros({ pais: "xx", orden: "hackeo", pagina: "-3", alerta: "inventada" });
    expect(f).toMatchObject({ pais: undefined, orden: "recientes", pagina: 1, alerta: undefined });
    expect((await listarInscritos(ADMIN, filtros({ pagina: "999" }))).pagina).toBe(1);
    expect(aQuery(filtros({ pais: "uy", pagina: "2" }))).toBe("?pais=uy&pagina=2");
  });
});

describe("detalle", () => {
  it("quien no es admin ve los datos sensibles como reservados", async () => {
    const d = (await (await coleccion()).findOne({ documento: "11111111" }))!;
    const texto = (ver: boolean) => JSON.stringify(seccionesDetalle(d, ver));
    expect(texto(true)).toContain("Femenino");
    expect(texto(true)).toContain("Población rural");
    expect(texto(false)).not.toContain("Femenino");
    expect(texto(false)).not.toContain("Población rural");
    expect(texto(false)).not.toContain("Son menores a un salario mínimo");
    expect(texto(false)).toContain("solo lo ve administración");
    expect(texto(true)).toContain("Paysandú");
  });
});

describe("tablero", () => {
  it("cuenta totales, menores, alertas y agrupa con etiquetas legibles", async () => {
    const e = await estadisticas(ADMIN, filtros());
    expect(e).toMatchObject({ total: 4, hoy: 4, menores: 1, conAlertas: 1 });
    const g = seriesTablero(e);
    expect(g.porPais).toEqual(expect.arrayContaining([{ etiqueta: "Uruguay", n: 3 }, { etiqueta: "Colombia", n: 1 }]));
    expect(g.genero).toEqual([{ etiqueta: "Femenino", n: 4 }]);
    expect(g.internet).toEqual(expect.arrayContaining([{ etiqueta: "Sí", n: 3 }, { etiqueta: "No", n: 1 }]));
    expect(g.alertas).toEqual([{ etiqueta: "No tiene acceso a internet", n: 1 }]);
    expect(g.porSede.map((b) => b.etiqueta)).toContain("Paysandú · Uruguay");
  });

  it("sede vs. otra ciudad: usa viveEnSede y, en inscripciones anteriores sin ese dato, lo deduce de la ciudad", async () => {
    const e = await estadisticas(ADMIN, filtros());
    // Uruguay: Salto, Salto y Carmelo no son ciudades sede. Colombia: Bogotá D.C. sí lo es.
    expect(e.sedeVsOtra).toEqual(expect.arrayContaining([{ pais: "uy", sede: 0, otra: 3 }, { pais: "col", sede: 1, otra: 0 }]));
    expect(e.semanaAnterior).toBe(0);
  });

  it("la serie diaria rellena los días sin inscripciones y acumula", () => {
    expect(serieDiaria([{ id: "2027-01-01", n: 2 }, { id: "2027-01-03", n: 1 }])).toEqual([
      { dia: "2027-01-01", n: 2, acumulado: 2 },
      { dia: "2027-01-02", n: 0, acumulado: 2 },
      { dia: "2027-01-03", n: 1, acumulado: 3 },
    ]);
  });
});

describe("exportación", () => {
  it("el CSV neutraliza fórmulas y omite columnas sensibles para quien no es admin", async () => {
    const docs = await (await coleccion()).find({ convocatoria: "jc-2027" }).toArray();
    const sinSensibles = generarCsv(docs, false);
    const conSensibles = generarCsv(docs, true);
    expect(sinSensibles).toContain(`"'=HYPERLINK(""http://malo"",""x"")"`);
    expect(sinSensibles).not.toMatch(/(^|;)=HYPERLINK/m);
    expect(sinSensibles).not.toContain("Ingresos");
    expect(sinSensibles).not.toContain("Femenino");
    expect(conSensibles).toContain("Femenino");
    expect(conSensibles.startsWith("﻿")).toBe(true);
  });

  async function sesionDe(rol: "admin" | "coordinador" | "lector", paises: string[] = []) {
    const usuario = `exporta.${rol}.${ip}`;
    await crearUsuario({ usuario, nombre: "Persona Prueba", rol, paises, clave: CLAVE }, "pruebas");
    const res = await login(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario, clave: CLAVE }),
      headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": `10.30.0.${ip++}` },
    }));
    return /jc_sesion=([^;]*)/.exec(res.headers.get("set-cookie") ?? "")![1]!;
  }

  const pedir = (token: string | undefined, query: string) =>
    exportar(new Request(`http://localhost/api/admin/exportar${query}`, { headers: token ? { cookie: `jc_sesion=${token}`, "x-real-ip": "10.30.1.1" } : {} }));

  it("exige sesión", async () => {
    expect((await pedir(undefined, "?formato=csv")).status).toBe(401);
  });

  it("un coordinador exporta solo su país, sin columnas sensibles, y queda auditado", async () => {
    const token = await sesionDe("coordinador", ["uy"]);
    const res = await pedir(token, "?formato=csv&pais=col");
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv.trim().split("\r\n")).toHaveLength(1); // solo encabezados: pidió Colombia, no la ve
    const todo = await (await pedir(token, "?formato=csv")).text();
    expect(todo.trim().split("\r\n")).toHaveLength(4);
    expect(todo).not.toContain("Ingresos");

    const auditoria = await (await getDb()).collection(COL_AUDITORIA).find({ accion: "exportacion" }).toArray();
    expect(auditoria.some((a) => String(a.detalle).includes("filas=3"))).toBe(true);
  });

  it("admin descarga un Excel con hoja de datos y resumen, con celdas sanitizadas", async () => {
    const token = await sesionDe("admin");
    const res = await pedir(token, "?formato=xlsx");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="inscritos-jc-\d{4}-\d{2}-\d{2}\.xlsx"/);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(Buffer.from(await res.arrayBuffer()) as unknown as ArrayBuffer);
    const hoja = libro.getWorksheet("Inscritos")!;
    expect(hoja.rowCount).toBe(5);
    const valores = JSON.stringify(hoja.getSheetValues());
    expect(valores).toContain("'=HYPERLINK");
    expect(valores).toContain("Femenino");
    expect(libro.getWorksheet("Resumen")).toBeDefined();
  });
});

describe("gestión de usuarios", () => {
  async function nuevo(rol: "admin" | "coordinador" | "lector", paises: string[] = ["uy"]): Promise<UsuarioSesion> {
    const usuario = `gestion.${rol}.${ip++}`;
    const r = await crearUsuario({ usuario, nombre: "Persona Prueba", rol, paises, clave: CLAVE }, "pruebas");
    if (!r.ok) throw new Error(JSON.stringify(r));
    return { id: r.id.toHexString(), usuario, nombre: "Persona Prueba", rol, paises: rol === "coordinador" ? (paises as never) : [], debeCambiarClave: false };
  }

  it("un admin no puede quitarse su propio rol ni desactivarse", async () => {
    const yo = await nuevo("admin");
    expect(await editarUsuario(yo.id, { rol: "lector" }, yo)).toEqual({ ok: false, error: "propio" });
    expect(await editarUsuario(yo.id, { activo: false }, yo)).toEqual({ ok: false, error: "propio" });
  });

  it("desactivar cierra la sesión; coordinador sin países no se permite", async () => {
    const admin = await nuevo("admin");
    const coord = await nuevo("coordinador");
    expect(await editarUsuario(coord.id, { paises: [] }, admin)).toMatchObject({ ok: false, error: "datos_invalidos" });
    expect(await editarUsuario(coord.id, { paises: ["uy", "col"] }, admin)).toEqual({ ok: true });
    expect(await editarUsuario(coord.id, { activo: false }, admin)).toEqual({ ok: true });
    const lista = await listarUsuarios();
    expect(lista.find((u) => u.id === coord.id)).toMatchObject({ activo: false, paises: ["uy", "col"] });
    expect(JSON.stringify(lista)).not.toContain("passwordHash");
  });

  it("restablecer la contraseña da una temporal y cierra las sesiones abiertas", async () => {
    const admin = await nuevo("admin");
    const lector = await nuevo("lector");
    const res = await login(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario: lector.usuario, clave: CLAVE }),
      headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": `10.31.0.${ip++}` },
    }));
    const token = /jc_sesion=([^;]*)/.exec(res.headers.get("set-cookie") ?? "")![1];
    expect(await verificarSesion(token)).not.toBeNull();
    const r = await restablecerClave(lector.id, admin);
    expect(r.ok && r.clave).toMatch(/^[a-zA-Z2-9]{14}$/);
    expect(await verificarSesion(token)).toBeNull();
  });
});
