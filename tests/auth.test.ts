// Autenticación del panel contra un MongoDB en memoria: login, mismo error en los tres casos de fallo, límite de
// intentos por IP y por usuario, token firmado y con expiración, revocación, desactivación, logout, auditoría,
// cookie y alcance por rol.
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import { PAISES } from "@/shared/config/paises";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { alcanceDe, filtroPais, puede } from "@/modules/auth/permisos";
import { COL_AUDITORIA, COL_USUARIOS } from "@/modules/auth/repository";
import { ClaveNueva, Credenciales } from "@/modules/auth/schema";
import { MAX_INTENTOS, MINUTOS_BLOQUEO } from "@/modules/auth/config/acceso";
import { crearUsuario, desactivarUsuario, iniciarSesion, revocarSesiones, verificarSesion } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";
import { crearToken, DURACION_SESION_MS, leerToken, nombreCookie, opcionesCookie } from "@/modules/auth/sesion";

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
const LIMITE = 4;
const CLAVE = "Clave-de-prueba-2027";
let ip = 1;
let n = 1;

function configurar(extra: Record<string, string> = {}) {
  Object.assign(env, {
    NODE_ENV: "test",
    SESSION_SECRET: "secreto-de-pruebas-de-al-menos-32-caracteres",
    RATE_LIMIT_LOGIN: String(LIMITE),
    ...extra,
  });
  reiniciarEntorno();
}

const nuevaIp = () => `10.20.${Math.floor(ip / 250)}.${ip++ % 250}`;

/** Crea un usuario con nombre único y devuelve su usuario e id. */
async function usuarioNuevo(rol: "admin" | "coordinador" | "lector" = "admin", paises: string[] = ["uy"]) {
  const usuario = `persona${n++}`;
  const r = await crearUsuario({ usuario, nombre: "Persona de Prueba", rol, paises, clave: CLAVE }, "pruebas");
  if (!r.ok) throw new Error(JSON.stringify(r));
  return { usuario, id: r.id.toHexString() };
}

function peticion(url: string, cuerpo: unknown, opciones: { ip?: string; headers?: Record<string, string>; sinOrigen?: boolean } = {}) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    headers: {
      host: "localhost",
      ...(opciones.sinOrigen ? {} : { origin: "http://localhost" }),
      "content-type": "application/json",
      "x-real-ip": opciones.ip ?? nuevaIp(),
      ...opciones.headers,
    },
  });
}

async function entrar(usuario: string, clave: string, opciones: Parameters<typeof peticion>[2] = {}) {
  const res = await login(peticion("/api/auth/login", { usuario, clave }, opciones));
  const cookie = res.headers.get("set-cookie") ?? "";
  const token = /jc_sesion=([^;]*)/.exec(cookie)?.[1];
  return { status: res.status, cuerpo: (await res.json()) as Record<string, unknown>, cookie, token };
}

const auditoria = async () => (await getDb()).collection(COL_AUDITORIA);
const usuarios = async () => (await getDb()).collection(COL_USUARIOS);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  env.MONGODB_URI = mongo.getUri();
  env.MONGODB_DB = "pruebas_auth";
  configurar();
});

afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});

beforeEach(() => configurar());

describe("login", () => {
  it("con credenciales correctas entrega una cookie firmada y registra el ingreso", async () => {
    const { usuario, id } = await usuarioNuevo();
    const r = await entrar(` ${usuario.toUpperCase()} `, CLAVE);
    expect(r.status).toBe(200);
    expect(r.cuerpo).toEqual({ ok: true, destino: "/admin" });
    expect(r.cookie).toMatch(/^jc_sesion=/);
    expect(r.cookie).toMatch(/HttpOnly/i);
    expect(r.cookie).toMatch(/SameSite=lax/i);
    expect(r.cookie).toMatch(/Path=\//);
    expect(r.cookie).not.toMatch(/Secure/i); // en local sobre http

    const sesion = await verificarSesion(r.token);
    expect(sesion).toEqual({ id, usuario, nombre: "Persona de Prueba", rol: "admin", paises: [], debeCambiarClave: false });

    const doc = await (await usuarios()).findOne({ usuario });
    expect(doc?.ultimoIngreso).toBeInstanceOf(Date);
    expect(await (await auditoria()).findOne({ accion: "login_ok", usuario })).toMatchObject({ ipHash: expect.stringMatching(/^[0-9a-f]{32}$/) });
  });

  it("responde exactamente lo mismo con clave incorrecta, usuario inexistente o usuario inactivo", async () => {
    const activo = await usuarioNuevo();
    const inactivo = await usuarioNuevo();
    await desactivarUsuario(inactivo.id, "pruebas");

    const clave = await entrar(activo.usuario, "otra-clave-equivocada");
    const inexistente = await entrar("nadie.aqui", CLAVE);
    const desactivado = await entrar(inactivo.usuario, CLAVE);

    for (const r of [clave, inexistente, desactivado]) {
      expect(r.status).toBe(401);
      expect(r.cookie).toBe("");
    }
    expect(inexistente.cuerpo).toEqual(clave.cuerpo);
    expect(desactivado.cuerpo).toEqual(clave.cuerpo);
    expect(clave.cuerpo).toEqual({ error: "credenciales", quedan: MAX_INTENTOS - 1 });

    // El motivo real queda solo en la auditoría interna.
    const col = await auditoria();
    expect(await col.findOne({ accion: "login_fallido", usuario: activo.usuario })).toMatchObject({ detalle: "clave" });
    expect(await col.findOne({ accion: "login_fallido", usuario: "nadie.aqui" })).toMatchObject({ detalle: "no_existe" });
    expect(await col.findOne({ accion: "login_fallido", usuario: inactivo.usuario })).toMatchObject({ detalle: "inactivo" });
  });

  it("rechaza peticiones sin Origin o de otro sitio", async () => {
    const { usuario } = await usuarioNuevo();
    expect((await entrar(usuario, CLAVE, { sinOrigen: true })).status).toBe(403);
    expect((await entrar(usuario, CLAVE, { headers: { origin: "https://otro-sitio.com" } })).status).toBe(403);
  });

  it("rechaza contraseñas de más de 72 bytes sin compararlas", async () => {
    const { usuario } = await usuarioNuevo();
    const r = await entrar(usuario, "ñ".repeat(37)); // 74 bytes en UTF-8
    expect(r.status).toBe(400);
    expect(r.cuerpo.error).toBe("datos_invalidos");
    expect(Credenciales.safeParse({ usuario, clave: "ñ".repeat(36) }).success).toBe(true); // 72 bytes
  });
});

describe("bloqueo por intentos fallidos", () => {
  it("bloquea por conexión tras el máximo de fallos, aunque luego la clave sea correcta", async () => {
    const { usuario } = await usuarioNuevo();
    const ipFija = nuevaIp();
    for (let i = 0; i < MAX_INTENTOS - 1; i++) expect((await entrar(`intruso${i}`, "nada-que-ver", { ip: ipFija })).cuerpo).toEqual({ error: "credenciales", quedan: MAX_INTENTOS - 1 - i });
    const ultimo = await entrar("intruso.final", "nada-que-ver", { ip: ipFija });
    expect(ultimo.status).toBe(429);
    expect(ultimo.cuerpo).toMatchObject({ error: "bloqueado", reintentarEnSeg: MINUTOS_BLOQUEO * 60 });
    const r = await entrar(usuario, CLAVE, { ip: ipFija });
    expect(r.status).toBe(429);
    expect(r.cookie).toBe("");
    // Otra conexión sigue pudiendo entrar.
    expect((await entrar(usuario, CLAVE)).status).toBe(200);
  });

  it("bloquea por correo aunque los fallos lleguen desde conexiones distintas, y avisa cuántos intentos quedan", async () => {
    const { usuario } = await usuarioNuevo();
    const quedan: unknown[] = [];
    for (let i = 0; i < MAX_INTENTOS - 1; i++) quedan.push((await entrar(usuario, "clave-equivocada")).cuerpo.quedan);
    expect(quedan).toEqual([4, 3, 2, 1]);
    expect((await entrar(usuario, "clave-equivocada")).status).toBe(429);
    const r = await entrar(usuario, CLAVE); // conexión nueva, clave correcta
    expect(r.status).toBe(429);
    expect(r.cookie).toBe("");
    expect(await (await auditoria()).findOne({ accion: "bloqueo", usuario })).toBeTruthy();
  });

  it("el bloqueo vence a los minutos configurados y un ingreso correcto reinicia la cuenta", async () => {
    const { usuario } = await usuarioNuevo();
    const ipFija = nuevaIp();
    const t0 = Date.now();
    for (let i = 0; i < MAX_INTENTOS; i++) await iniciarSesion({ usuario, clave: "mala" }, { ip: ipFija, ahora: t0 + i });
    expect(await iniciarSesion({ usuario, clave: CLAVE }, { ip: ipFija, ahora: t0 + 60_000 })).toMatchObject({ ok: false, error: "bloqueado" });
    expect(await iniciarSesion({ usuario, clave: CLAVE }, { ip: ipFija, ahora: t0 + MINUTOS_BLOQUEO * 60_000 + 10 })).toMatchObject({ ok: true });
    expect(await iniciarSesion({ usuario, clave: "mala" }, { ip: nuevaIp(), ahora: t0 + MINUTOS_BLOQUEO * 60_000 + 20 })).toMatchObject({ ok: false, quedan: MAX_INTENTOS - 1 });
  });
});

describe("token de sesión", () => {
  it("la expiración va dentro de lo firmado", async () => {
    const { id } = await usuarioNuevo();
    const ahora = Date.now();
    const token = crearToken(id, 0, ahora);
    expect(leerToken(token, ahora + DURACION_SESION_MS - 1000)).not.toBeNull();
    expect(leerToken(token, ahora + DURACION_SESION_MS + 1)).toBeNull();
    expect(await verificarSesion(token, ahora + DURACION_SESION_MS + 1)).toBeNull();
  });

  it("rechaza un token alterado o firmado con otro secreto", async () => {
    const { id } = await usuarioNuevo();
    const token = crearToken(id, 0);
    const [datos, firma] = token.split(".") as [string, string];

    // Cambiar el contenido (p. ej. alargar la expiración) invalida la firma.
    const contenido = JSON.parse(Buffer.from(datos, "base64url").toString());
    const alterado = Buffer.from(JSON.stringify({ ...contenido, e: contenido.e + 864e5 })).toString("base64url");
    expect(leerToken(`${alterado}.${firma}`)).toBeNull();
    expect(leerToken(`${datos}.${firma.slice(0, -2)}`)).toBeNull();
    expect(leerToken(`${datos}.${firma}.extra`)).toBeNull();
    expect(leerToken("x".repeat(2000))).toBeNull();
    expect(leerToken(undefined)).toBeNull();

    configurar({ SESSION_SECRET: "otro-secreto-distinto-de-al-menos-32-caracteres" });
    expect(leerToken(token)).toBeNull();
  });

  it("en producción la cookie lleva el prefijo __Host- y Secure", () => {
    configurar({ NODE_ENV: "production" });
    expect(nombreCookie()).toBe("__Host-jc_sesion");
    expect(opcionesCookie()).toMatchObject({ secure: true, path: "/", httpOnly: true });
    expect(opcionesCookie()).not.toHaveProperty("domain");
    configurar();
    expect(nombreCookie()).toBe("jc_sesion");
    expect(opcionesCookie().secure).toBe(false);
  });
});

describe("revocación, desactivación y logout", () => {
  it("revocar cierra las sesiones abiertas y se audita", async () => {
    const { usuario, id } = await usuarioNuevo();
    const antes = await entrar(usuario, CLAVE);
    expect(await verificarSesion(antes.token)).not.toBeNull();

    expect(await revocarSesiones(id, "admin.prueba")).toBe(true);
    expect(await verificarSesion(antes.token)).toBeNull();
    expect(await (await auditoria()).findOne({ accion: "revocacion", usuario })).toMatchObject({ por: "admin.prueba" });

    // Una sesión nueva sí sirve.
    expect(await verificarSesion((await entrar(usuario, CLAVE)).token)).not.toBeNull();
  });

  it("desactivar sube tokenVersion y la sesión deja de servir al instante", async () => {
    const { usuario, id } = await usuarioNuevo();
    const s = await entrar(usuario, CLAVE);
    expect(await desactivarUsuario(id, "admin.prueba")).toBe(true);

    const doc = await (await usuarios()).findOne({ usuario });
    expect(doc).toMatchObject({ activo: false, tokenVersion: 1 });
    expect(await verificarSesion(s.token)).toBeNull();

    // Aunque se reactive a mano, la cookie vieja sigue sin servir.
    await (await usuarios()).updateOne({ usuario }, { $set: { activo: true } });
    expect(await verificarSesion(s.token)).toBeNull();
    expect(await (await auditoria()).findOne({ accion: "desactivacion", usuario })).toMatchObject({ por: "admin.prueba" });
  });

  it("el logout es POST del mismo origen, borra la cookie e invalida el token", async () => {
    const { usuario } = await usuarioNuevo();
    const s = await entrar(usuario, CLAVE);
    const conCookie = { headers: { cookie: `otra=1; jc_sesion=${s.token}` } };

    expect((await logout(peticion("/api/auth/logout", undefined, { ...conCookie, sinOrigen: true }))).status).toBe(403);
    expect((await logout(peticion("/api/auth/logout", undefined, { ...conCookie, headers: { ...conCookie.headers, origin: "https://malo.com" } }))).status).toBe(403);
    expect(await verificarSesion(s.token)).not.toBeNull();

    const res = await logout(peticion("/api/auth/logout", undefined, conCookie));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/jc_sesion=;.*Max-Age=0/i);
    expect(await verificarSesion(s.token)).toBeNull();
    expect(await (await auditoria()).findOne({ accion: "logout", usuario })).not.toBeNull();

    // Sin sesión también responde bien (y borra la cookie).
    expect((await logout(peticion("/api/auth/logout", undefined))).status).toBe(200);
  });
});

describe("auditoría", () => {
  it("nunca guarda contraseñas ni hashes", async () => {
    const { usuario } = await usuarioNuevo();
    await entrar(usuario, CLAVE);
    await entrar(usuario, "clave-secreta-equivocada");
    // Contraseña pegada por error en el campo usuario: no tiene formato de usuario y no se guarda.
    await entrar("Mi Clave Secreta 123!", CLAVE);

    const eventos = await (await auditoria()).find({}).toArray();
    const texto = JSON.stringify(eventos);
    for (const secreto of [CLAVE, "clave-secreta-equivocada", "mi clave secreta 123!", "$2"]) expect(texto).not.toContain(secreto);
    expect(eventos.some((e) => e.accion === "login_fallido" && e.usuario === null)).toBe(true);
  });
});

describe("exigirApi", () => {
  it("401 sin sesión, 403 sin permiso y el usuario si todo está bien", async () => {
    const lector = await usuarioNuevo("lector");
    const admin = await usuarioNuevo("admin");
    const tokenLector = (await entrar(lector.usuario, CLAVE)).token;
    const tokenAdmin = (await entrar(admin.usuario, CLAVE)).token;
    const req = (token?: string) => new Request("http://localhost/api/admin/x", { headers: token ? { cookie: `jc_sesion=${token}` } : {} });

    const sin = await exigirApi(req());
    expect("error" in sin && sin.error.status).toBe(401);
    const sinPermiso = await exigirApi(req(tokenLector), "gestionar_usuarios");
    expect("error" in sinPermiso && sinPermiso.error.status).toBe(403);
    const ok = await exigirApi(req(tokenAdmin), "gestionar_usuarios");
    expect("usuario" in ok && ok.usuario.usuario).toBe(admin.usuario);
  });
});

describe("permisos y alcance", () => {
  it("coordinador con la lista vacía no ve nada (falla cerrado)", () => {
    const alcance = alcanceDe({ rol: "coordinador", paises: [] });
    expect(alcance).toEqual({ paises: [], verSensibles: false });
    expect(filtroPais(alcance)).toEqual({ pais: { $in: [] } });
  });

  it("coordinador ve solo sus países válidos", () => {
    expect(alcanceDe({ rol: "coordinador", paises: ["uy", "xx", "uy"] }).paises).toEqual(["uy"]);
  });

  it("Consulta ve solo sus países y sin detalle sensible (con la lista vacía, nada); admin ve todo", () => {
    expect(alcanceDe({ rol: "lector", paises: ["pan", "uy"] })).toEqual({ paises: ["pan", "uy"], verSensibles: false });
    expect(alcanceDe({ rol: "lector", paises: [] })).toEqual({ paises: [], verSensibles: false });
    expect(alcanceDe({ rol: "admin", paises: [] })).toEqual({ paises: [...PAISES], verSensibles: true });
    expect(puede("lector", "ver_detalle_sensible")).toBe(false);
    expect(puede("coordinador", "ver_detalle_sensible")).toBe(false);
    expect(puede("admin", "ver_detalle_sensible")).toBe(true);
    expect(puede("lector", "gestionar_usuarios")).toBe(false);
  });

  it("un rol desconocido no puede nada", () => {
    expect(alcanceDe({ rol: "superusuario", paises: ["uy"] })).toEqual({ paises: [], verSensibles: false });
    expect(puede("superusuario", "ver_panel")).toBe(false);
    expect(puede(undefined, "ver_panel")).toBe(false);
  });
});

describe("alta de usuarios", () => {
  it("exige contraseña de al menos 12 caracteres, coordinador con país y usuario único", async () => {
    expect(ClaveNueva.safeParse("corta").success).toBe(false);
    expect(ClaveNueva.safeParse("a".repeat(73)).success).toBe(false);

    const sinPais = await crearUsuario({ usuario: "coord.sin.pais", nombre: "Coordinación", rol: "coordinador", paises: [], clave: CLAVE }, "pruebas");
    expect(sinPais).toMatchObject({ ok: false, error: "datos_invalidos", errores: { paises: expect.any(String) } });

    const { usuario } = await usuarioNuevo();
    expect(await crearUsuario({ usuario, nombre: "Otra Persona", rol: "lector", paises: ["uy"], clave: CLAVE }, "pruebas")).toEqual({ ok: false, error: "duplicado" });
    const consultaSinPais = await crearUsuario({ usuario: "consulta.sin.pais", nombre: "Consulta", rol: "lector", paises: [], clave: CLAVE }, "pruebas");
    expect(consultaSinPais).toMatchObject({ ok: false, error: "datos_invalidos", errores: { paises: expect.any(String) } });

    const doc = await (await usuarios()).findOne({ usuario });
    expect(doc?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(doc?.passwordHash).not.toContain(CLAVE);
  });
});
