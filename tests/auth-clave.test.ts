// Acceso al panel con correo, contraseña temporal (cambio obligatorio al primer ingreso) y enlace para restablecer
// la contraseña. MongoDB en memoria; el correo saliente se reemplaza por uno que guarda lo que se habría enviado.
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { reiniciarEntorno } from "@/shared/config/env";
import { cerrarDb, getDb } from "@/shared/db/mongo";
import type { EventoRestablecer } from "@/shared/notificaciones/notificador";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as cambiar } from "@/app/api/auth/clave/route";
import { POST as olvide } from "@/app/api/auth/olvide/route";
import { POST as restablecer } from "@/app/api/auth/restablecer/route";
import { MINUTOS_ENLACE } from "@/modules/auth/config/acceso";
import { COL_RESTABLECER, COL_USUARIOS } from "@/modules/auth/repository";
import { CambioClave } from "@/modules/auth/schema";
import { claveConEnlace, crearUsuario, editarUsuario, restablecerClave, solicitarEnlace, verificarSesion } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";

const enviados = vi.hoisted(() => [] as EventoRestablecer[]);
vi.mock("@/shared/notificaciones/notificador", () => ({
  notificador: () => ({ inscripcionRegistrada: async () => {}, restablecerClave: async (e: EventoRestablecer) => void enviados.push(e) }),
}));

let mongo: MongoMemoryServer;
const env = process.env as Record<string, string | undefined>;
const CLAVE = "Temporal-de-prueba-1";
let n = 1;
const nuevaIp = () => `10.40.${Math.floor(n / 250)}.${n++ % 250}`;

function peticion(url: string, cuerpo: unknown, cookie?: string) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(cuerpo),
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-real-ip": nuevaIp(), ...(cookie ? { cookie } : {}) },
  });
}
const galleta = (res: Response) => /jc_sesion=[^;]*/.exec(res.headers.get("set-cookie") ?? "")?.[0];

async function nuevo(claveTemporal: boolean) {
  const i = n++;
  const correo = `persona.${i}@tocaunavida.org`;
  const r = await crearUsuario({ usuario: `persona.clave${i}`, correo, nombre: "Persona Prueba", rol: "lector", paises: ["uy"], clave: CLAVE }, "pruebas", { claveTemporal });
  if (!r.ok) throw new Error(JSON.stringify(r));
  return { correo, id: r.id.toHexString() };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(env, { MONGODB_URI: mongo.getUri(), MONGODB_DB: "pruebas_auth_clave", NODE_ENV: "test", SESSION_SECRET: "secreto-de-pruebas-de-al-menos-32-caracteres" });
  reiniciarEntorno();
});
afterAll(async () => {
  await cerrarDb();
  await mongo?.stop();
});
beforeEach(() => void (enviados.length = 0));

describe("ingreso con correo", () => {
  it("entra con el correo (sin importar mayúsculas) y con el usuario anterior", async () => {
    const { correo } = await nuevo(false);
    expect((await login(peticion("/api/auth/login", { usuario: ` ${correo.toUpperCase()} `, clave: CLAVE }))).status).toBe(200);
    expect((await login(peticion("/api/auth/login", { usuario: `persona.clave${n - 2}`, clave: CLAVE }))).status).toBe(200);
  });

  it("el correo es único", async () => {
    const { correo } = await nuevo(false);
    expect(await crearUsuario({ usuario: `otra.persona${n++}`, correo, nombre: "Otra Persona", rol: "lector", paises: ["uy"], clave: CLAVE }, "pruebas")).toEqual({ ok: false, error: "duplicado" });
  });

  it("alta solo con el correo: el usuario interno sale de la parte antes de la @", async () => {
    const r = await crearUsuario({ correo: "Maria.Nunez@TocaUnaVida.org", nombre: "María Núñez", rol: "admin", clave: CLAVE }, "pruebas");
    expect(r.ok).toBe(true);
    expect(await (await getDb()).collection(COL_USUARIOS).findOne({ correo: "maria.nunez@tocaunavida.org" })).toMatchObject({ usuario: "maria.nunez" });
  });

  it("a un usuario anterior (sin correo) se le asigna el correo y desde entonces entra con él", async () => {
    const r = await crearUsuario({ usuario: `anterior${n++}`, nombre: "Usuario Anterior", rol: "admin", clave: CLAVE }, "pruebas");
    if (!r.ok) throw new Error("no se creó");
    const id = r.id.toHexString();
    const actor = { id: "000000000000000000000000", usuario: "admin", nombre: "Admin", rol: "admin" as const, paises: [], debeCambiarClave: false };
    const correo = `anterior.${n++}@tocaunavida.org`;
    expect(await editarUsuario(id, { correo }, actor)).toEqual({ ok: true });
    expect((await login(peticion("/api/auth/login", { usuario: correo, clave: CLAVE }))).status).toBe(200);
    // Un correo que ya usa otra persona no se acepta.
    const otro = await nuevo(false);
    expect(await editarUsuario(id, { correo: otro.correo }, actor)).toMatchObject({ ok: false, error: "datos_invalidos", errores: { correo: expect.any(String) } });
  });
});

describe("contraseña temporal: cambio obligatorio", () => {
  it("con temporal, el login lleva a /admin/clave y el panel responde 403 hasta cambiarla", async () => {
    const { correo } = await nuevo(true);
    const res = await login(peticion("/api/auth/login", { usuario: correo, clave: CLAVE }));
    expect(await res.json()).toEqual({ ok: true, destino: "/admin/clave" });
    const cookie = galleta(res)!;
    const api = await exigirApi(peticion("/api/admin/exportar", {}, cookie), "ver_panel");
    expect("error" in api && api.error.status).toBe(403);

    // Igual a la temporal: no se acepta.
    const igual = await cambiar(peticion("/api/auth/clave", { nueva: CLAVE, repetir: CLAVE }, cookie));
    expect(igual.status).toBe(400);
    expect((await igual.json()).errores.nueva).toMatch(/distinta/);

    const nueva = "Mi-clave-propia-2027";
    const ok = await cambiar(peticion("/api/auth/clave", { nueva, repetir: nueva }, cookie));
    expect(ok.status).toBe(200);
    const nuevaCookie = galleta(ok)!;
    // La sesión anterior se cerró; la nueva ya entra al panel.
    expect(await verificarSesion(cookie.split("=")[1])).toBeNull();
    expect("usuario" in (await exigirApi(peticion("/api/admin/exportar", {}, nuevaCookie), "ver_panel"))).toBe(true);
    expect((await login(peticion("/api/auth/login", { usuario: correo, clave: nueva }))).status).toBe(200);
  });

  it("restablecer desde la pantalla de usuarios deja la contraseña como temporal", async () => {
    const { correo, id } = await nuevo(false);
    const r = await restablecerClave(id, { id, usuario: "admin", nombre: "Admin", rol: "admin", paises: [], debeCambiarClave: false });
    if (!r.ok) throw new Error("no restableció");
    const res = await login(peticion("/api/auth/login", { usuario: correo, clave: r.clave }));
    expect(await res.json()).toMatchObject({ destino: "/admin/clave" });
  });

  it("requisitos: largo, mayúscula, número y que coincidan", () => {
    const errores = (nueva: string, repetir = nueva) => {
      const r = CambioClave.safeParse({ nueva, repetir });
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    expect(errores("Corta-1")).toEqual([expect.stringMatching(/al menos 12/)]);
    expect(errores("sin-mayuscula-2027")).toEqual([expect.stringMatching(/mayúscula/)]);
    expect(errores("Sin-numero-largo")).toEqual([expect.stringMatching(/número/)]);
    expect(errores("Completa-2027-ok", "otra")).toEqual([expect.stringMatching(/no coinciden/)]);
    expect(errores("Completa-2027-ok")).toEqual([]);
  });
});

describe("olvidé mi contraseña", () => {
  it("responde igual exista o no el correo, y solo envía si existe y está activo", async () => {
    const { correo } = await nuevo(false);
    const existe = await olvide(peticion("/api/auth/olvide", { correo }));
    const noExiste = await olvide(peticion("/api/auth/olvide", { correo: "nadie@tocaunavida.org" }));
    expect(existe.status).toBe(200);
    expect(await existe.json()).toEqual(await noExiste.json());
    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toMatchObject({ correo, minutos: MINUTOS_ENLACE });
    expect(enviados[0]!.enlace).toMatch(/\/admin\/restablecer#t=[A-Za-z0-9_-]{43}$/);
  });

  it("el enlace sirve una sola vez, guarda la contraseña y deja la sesión abierta", async () => {
    const { correo } = await nuevo(false);
    await olvide(peticion("/api/auth/olvide", { correo }));
    const token = enviados[0]!.enlace.split("#t=")[1]!;
    // En la base solo está el hash del enlace.
    const guardado = await (await getDb()).collection(COL_RESTABLECER).findOne({});
    expect(JSON.stringify(guardado)).not.toContain(token);

    const nueva = "Desde-el-enlace-2027";
    const r = await restablecer(peticion("/api/auth/restablecer", { token, nueva, repetir: nueva }));
    expect(r.status).toBe(200);
    expect(galleta(r)).toBeTruthy();
    expect((await login(peticion("/api/auth/login", { usuario: correo, clave: nueva }))).status).toBe(200);
    expect((await restablecer(peticion("/api/auth/restablecer", { token, nueva, repetir: nueva }))).status).toBe(410);
  });

  it("el enlace vence a los minutos configurados y solo vale el último", async () => {
    const { correo } = await nuevo(false);
    const t0 = Date.now();
    await solicitarEnlace({ correo }, { ip: nuevaIp(), origen: "https://x", ahora: t0 });
    await solicitarEnlace({ correo }, { ip: nuevaIp(), origen: "https://x", ahora: t0 + 1 });
    const [viejo, ultimo] = enviados.map((e) => e.enlace.split("#t=")[1]!);
    const nueva = "Vencido-o-no-2027";
    expect(await claveConEnlace({ token: viejo, nueva, repetir: nueva }, { ip: nuevaIp(), ahora: t0 + 2 })).toEqual({ ok: false, error: "enlace" });
    expect(await claveConEnlace({ token: ultimo, nueva, repetir: nueva }, { ip: nuevaIp(), ahora: t0 + MINUTOS_ENLACE * 60_000 + 5 })).toEqual({ ok: false, error: "enlace" });
  });

  it("limita los pedidos por correo sin revelarlo", async () => {
    const { correo } = await nuevo(false);
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) expect(await solicitarEnlace({ correo }, { ip: nuevaIp(), origen: "https://x", ahora: t0 + i })).toEqual({ ok: true });
    expect(enviados).toHaveLength(3);
  });
});
