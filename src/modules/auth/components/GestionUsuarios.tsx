"use client";
// Pantalla de usuarios (solo admin): crear, cambiar rol y países, desactivar, restablecer contraseña y cerrar
// sesiones. Las reglas (no quitarse el propio admin, dejar siempre un admin activo) se aplican en el servidor.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { NOMBRE_PAIS, PAISES, type PaisSlug } from "@/shared/config/paises";
import { NOMBRE_ROL, ROLES, type Rol } from "../config/roles";
import type { VistaUsuario } from "../service";
import s from "./Auth.module.css";

type Respuesta = { ok?: boolean; clave?: string; mensaje?: string; errores?: Record<string, string> };

async function llamar(url: string, metodo: "POST" | "PATCH", cuerpo?: unknown): Promise<Respuesta & { status: number }> {
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { "content-type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      credentials: "same-origin",
    });
    return { status: res.status, ...((await res.json().catch(() => ({}))) as Respuesta) };
  } catch {
    return { status: 0, mensaje: "No hay conexión. Intenta otra vez." };
  }
}

const textoError = (r: Respuesta & { status: number }) =>
  r.mensaje ?? (r.errores ? Object.values(r.errores).join(" ") : r.status === 401 ? "Tu sesión terminó. Vuelve a entrar." : "No se pudo guardar.");

const fecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

function SelectorPaises({ valor, onChange, nombre }: { valor: PaisSlug[]; onChange: (p: PaisSlug[]) => void; nombre: string }) {
  return (
    <fieldset className={s.paises}>
      <legend className={s.oculto}>Países: {nombre}</legend>
      {PAISES.map((p) => (
        <label key={p}>
          <input type="checkbox" checked={valor.includes(p)} onChange={(e) => onChange(e.target.checked ? [...valor, p] : valor.filter((x) => x !== p))} />
          {NOMBRE_PAIS[p]}
        </label>
      ))}
    </fieldset>
  );
}

export default function GestionUsuarios({ usuarios, yo }: { usuarios: VistaUsuario[]; yo: string }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string; clave?: string } | null>(null);

  // ---------- Alta ----------
  const [nuevo, setNuevo] = useState({ usuario: "", nombre: "", rol: "coordinador" as Rol, paises: [] as PaisSlug[] });
  const [creando, setCreando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (creando) return;
    setCreando(true);
    const r = await llamar("/api/admin/usuarios", "POST", { ...nuevo, paises: nuevo.rol === "coordinador" ? nuevo.paises : [] });
    setCreando(false);
    if (r.ok && r.clave) {
      setAviso({ tipo: "ok", texto: `Usuario «${nuevo.usuario.trim().toLowerCase()}» creado. Contraseña temporal (cópiala ahora, no se vuelve a mostrar):`, clave: r.clave });
      setNuevo({ usuario: "", nombre: "", rol: "coordinador", paises: [] });
      router.refresh();
    } else setAviso({ tipo: "error", texto: textoError(r) });
  }

  return (
    <div className={s.gestion}>
      {aviso && (
        <div className={aviso.tipo === "ok" ? s.avisoOk : s.alerta} role={aviso.tipo === "ok" ? "status" : "alert"}>
          <p>{aviso.texto}</p>
          {aviso.clave && <code className={s.clave}>{aviso.clave}</code>}
          <button type="button" className={s.botonSecundario} onClick={() => setAviso(null)}>
            Cerrar
          </button>
        </div>
      )}

      <section className={s.tarjeta + " " + s.tarjetaPanel}>
        <h2 className={s.tituloSeccion}>Nuevo usuario</h2>
        <form className={s.formFila} onSubmit={crear}>
          <div className={s.campo}>
            <label htmlFor="n-usuario">Usuario</label>
            <input id="n-usuario" required value={nuevo.usuario} onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })} autoCapitalize="none" spellCheck={false} placeholder="ana.perez" />
          </div>
          <div className={s.campo}>
            <label htmlFor="n-nombre">Nombre completo</label>
            <input id="n-nombre" required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </div>
          <div className={s.campo}>
            <label htmlFor="n-rol">Rol</label>
            <select id="n-rol" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {NOMBRE_ROL[r]}
                </option>
              ))}
            </select>
          </div>
          {nuevo.rol === "coordinador" && <SelectorPaises nombre="el nuevo usuario" valor={nuevo.paises} onChange={(paises) => setNuevo({ ...nuevo, paises })} />}
          <button className={s.botonCompacto} type="submit" disabled={creando}>
            {creando ? "Creando…" : "Crear"}
          </button>
        </form>
        <p className={s.ayuda}>
          Administración ve todo y gestiona usuarios. Coordinación ve solo sus países. Consulta ve todos los países. Solo administración ve
          género, poblaciones e ingresos de cada persona.
        </p>
      </section>

      <div className={s.listaUsuarios}>
        {usuarios.map((u) => (
          <FilaUsuario key={u.id} u={u} esYo={u.id === yo} onAviso={setAviso} />
        ))}
      </div>
    </div>
  );
}

function FilaUsuario({ u, esYo, onAviso }: { u: VistaUsuario; esYo: boolean; onAviso: (a: { tipo: "ok" | "error"; texto: string; clave?: string }) => void }) {
  const router = useRouter();
  const [rol, setRol] = useState<Rol>(u.rol);
  const [paises, setPaises] = useState<PaisSlug[]>(u.paises);
  const [ocupado, setOcupado] = useState(false);
  const cambiado = rol !== u.rol || (rol === "coordinador" && [...paises].sort().join() !== [...u.paises].sort().join());

  async function accion(url: string, metodo: "POST" | "PATCH", cuerpo: unknown, exito: string, confirmar?: string) {
    if (ocupado || (confirmar && !window.confirm(confirmar))) return;
    setOcupado(true);
    const r = await llamar(url, metodo, cuerpo);
    setOcupado(false);
    if (r.ok) {
      onAviso(r.clave ? { tipo: "ok", texto: `${exito} Cópiala ahora, no se vuelve a mostrar:`, clave: r.clave } : { tipo: "ok", texto: exito });
      router.refresh();
    } else onAviso({ tipo: "error", texto: textoError(r) });
  }

  return (
    <section className={`${s.tarjeta} ${s.tarjetaPanel} ${u.activo ? "" : s.inactivo}`}>
      <div className={s.filaUsuario}>
        <div>
          <strong>{u.nombre}</strong>
          {esYo && <span className={s.chip}>tú</span>}
          {!u.activo && <span className={s.chip}>inactivo</span>}
          <span className={s.ayuda}>
            {u.usuario} · {u.ultimoIngreso ? `último ingreso ${fecha.format(new Date(u.ultimoIngreso))}` : "nunca ha entrado"}
          </span>
        </div>
        <div className={s.campo}>
          <label htmlFor={`rol-${u.id}`}>Rol</label>
          <select id={`rol-${u.id}`} value={rol} onChange={(e) => setRol(e.target.value as Rol)} disabled={!u.activo}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {NOMBRE_ROL[r]}
              </option>
            ))}
          </select>
        </div>
        {rol === "coordinador" && <SelectorPaises nombre={u.nombre} valor={paises} onChange={setPaises} />}
      </div>
      <div className={s.accionesUsuario}>
        {cambiado && (
          <button type="button" className={s.botonCompacto} disabled={ocupado} onClick={() => accion(`/api/admin/usuarios/${u.id}`, "PATCH", { rol, paises }, "Cambios guardados.")}>
            Guardar cambios
          </button>
        )}
        {u.activo ? (
          <>
            <button
              type="button"
              className={s.botonSecundario}
              disabled={ocupado}
              onClick={() => accion(`/api/admin/usuarios/${u.id}/clave`, "POST", undefined, `Contraseña nueva para «${u.usuario}».`, `¿Restablecer la contraseña de ${u.nombre}? Se cerrarán sus sesiones.`)}
            >
              Restablecer contraseña
            </button>
            <button type="button" className={s.botonSecundario} disabled={ocupado} onClick={() => accion(`/api/admin/usuarios/${u.id}/sesiones`, "POST", undefined, "Sesiones cerradas.", `¿Cerrar todas las sesiones de ${u.nombre}?`)}>
              Cerrar sesiones
            </button>
            {!esYo && (
              <button type="button" className={s.botonPeligro} disabled={ocupado} onClick={() => accion(`/api/admin/usuarios/${u.id}`, "PATCH", { activo: false }, "Usuario desactivado.", `¿Desactivar a ${u.nombre}? No podrá entrar al panel.`)}>
                Desactivar
              </button>
            )}
          </>
        ) : (
          <button type="button" className={s.botonSecundario} disabled={ocupado} onClick={() => accion(`/api/admin/usuarios/${u.id}`, "PATCH", { activo: true }, "Usuario reactivado.")}>
            Reactivar
          </button>
        )}
      </div>
    </section>
  );
}
