"use client";
// Pantalla de usuarios (solo admin; diseño 2027: AdminUsuarios): crear por correo, cambiar rol y países, desactivar,
// restablecer contraseña y cerrar sesiones. Las reglas (no quitarse el propio admin, dejar siempre un admin activo,
// países obligatorios para Coordinación y Consulta) se aplican en el servidor; aquí solo se muestran sus mensajes.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { NOMBRE_PAIS, PAISES, type PaisSlug } from "@/shared/config/paises";
import { conPaises, NOMBRE_ROL, ROLES, type Rol } from "../config/roles";
import type { VistaUsuario } from "../service";
import "./usuarios.css";

type Respuesta = { ok?: boolean; clave?: string; mensaje?: string; errores?: Record<string, string> };
type Aviso = { tipo: "ok" | "error"; texto: string; clave?: string };

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

const fecha = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" });

/** Países como botones que se marcan (diseño): cada uno es una casilla con aspecto de botón. */
function SelectorPaises({ valor, onChange, nombre, deshabilitado }: { valor: PaisSlug[]; onChange: (p: PaisSlug[]) => void; nombre: string; deshabilitado?: boolean }) {
  return (
    <fieldset className="u-paises">
      <legend className="solo-lector">Países que puede ver {nombre}</legend>
      {PAISES.map((p) => {
        const sel = valor.includes(p);
        return (
          <label key={p} className={sel ? "op seg is-sel" : "op seg"}>
            <input type="checkbox" checked={sel} disabled={deshabilitado} onChange={(e) => onChange(e.target.checked ? [...valor, p] : valor.filter((x) => x !== p))} />
            {NOMBRE_PAIS[p]}
          </label>
        );
      })}
    </fieldset>
  );
}

function AvisoClave({ aviso, cerrar }: { aviso: Aviso; cerrar: () => void }) {
  const [copiada, setCopiada] = useState(false);
  return (
    <div className={aviso.tipo === "ok" ? "aviso-info u-aviso" : "aviso-err u-aviso"} role={aviso.tipo === "ok" ? "status" : "alert"}>
      <div>
        <p>{aviso.texto}</p>
        {aviso.clave ? (
          <p className="u-clave">
            <code>{aviso.clave}</code>
            <button type="button" className="btn btn-borde btn-sm" onClick={() => navigator.clipboard?.writeText(aviso.clave!).then(() => setCopiada(true))}>
              {copiada ? "Copiada" : "Copiar"}
            </button>
          </p>
        ) : null}
      </div>
      <button type="button" className="btn btn-texto btn-sm" onClick={cerrar}>Cerrar</button>
    </div>
  );
}

export default function GestionUsuarios({ usuarios, yo }: { usuarios: VistaUsuario[]; yo: string }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [nuevo, setNuevo] = useState({ correo: "", nombre: "", rol: "coordinador" as Rol, paises: [] as PaisSlug[] });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [creando, setCreando] = useState(false);

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (creando) return;
    setCreando(true);
    const r = await llamar("/api/admin/usuarios", "POST", { ...nuevo, paises: conPaises(nuevo.rol) ? nuevo.paises : [] });
    setCreando(false);
    if (r.ok && r.clave) {
      setErrores({});
      setAviso({ tipo: "ok", texto: `Usuario ${nuevo.correo.trim().toLowerCase()} creado. Contraseña temporal (cópiala ahora; no se vuelve a mostrar y deberá cambiarla en su primer ingreso):`, clave: r.clave });
      setNuevo({ correo: "", nombre: "", rol: "coordinador", paises: [] });
      router.refresh();
    } else {
      setErrores(r.errores ?? {});
      setAviso({ tipo: "error", texto: textoError(r) });
    }
  }

  return (
    <>
      {aviso ? <AvisoClave aviso={aviso} cerrar={() => setAviso(null)} /> : null}

      <section className="caja u-caja" aria-labelledby="t-nuevo">
        <h2 id="t-nuevo" className="h-caja">Nuevo usuario</h2>
        <form className="u-nuevo" onSubmit={crear} noValidate>
          <div className="u-campos">
            <div className="campo">
              <label className="lbl" htmlFor="n-correo">Correo</label>
              <input id="n-correo" className="input input-sm" type="email" required value={nuevo.correo} placeholder="nombre@tocaunavida.org" autoCapitalize="none" spellCheck={false}
                onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} aria-invalid={errores.correo ? true : undefined} aria-describedby={errores.correo ? "n-correo-error" : undefined} />
              {errores.correo ? <span id="n-correo-error" className="err">{errores.correo}</span> : null}
            </div>
            <div className="campo">
              <label className="lbl" htmlFor="n-nombre">Nombre completo</label>
              <input id="n-nombre" className="input input-sm" required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                aria-invalid={errores.nombre ? true : undefined} aria-describedby={errores.nombre ? "n-nombre-error" : undefined} />
              {errores.nombre ? <span id="n-nombre-error" className="err">{errores.nombre}</span> : null}
            </div>
            <div className="campo">
              <label className="lbl" htmlFor="n-rol">Rol</label>
              <select id="n-rol" className="input input-sm" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })}>
                {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
              </select>
            </div>
          </div>
          {conPaises(nuevo.rol) ? (
            <div className="campo">
              <span className="lbl" id="n-paises">Países que puede ver</span>
              <SelectorPaises nombre="el nuevo usuario" valor={nuevo.paises} onChange={(paises) => setNuevo({ ...nuevo, paises })} />
              {errores.paises ? <span className="err">{errores.paises}</span> : null}
            </div>
          ) : null}
          <div className="u-pie">
            <p className="ayuda">
              Administración ve todo y gestiona usuarios. Coordinación y Consulta ven solo sus países, y los datos sensibles solo sumados en el
              tablero. La contraseña temporal se genera al crear el usuario; la persona deberá cambiarla en su primer ingreso.
            </p>
            <button className="btn btn-primario" type="submit" disabled={creando}>{creando ? "Creando…" : "Crear usuario"}</button>
          </div>
        </form>
      </section>

      {usuarios.map((u) => (
        <FilaUsuario key={u.id} u={u} esYo={u.id === yo} onAviso={setAviso} />
      ))}
    </>
  );
}

function FilaUsuario({ u, esYo, onAviso }: { u: VistaUsuario; esYo: boolean; onAviso: (a: Aviso) => void }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [correo, setCorreo] = useState("");

  async function accion(url: string, metodo: "POST" | "PATCH", cuerpo: unknown, exito: string, confirmar?: string) {
    if (ocupado || (confirmar && !window.confirm(confirmar))) return false;
    setOcupado(true);
    const r = await llamar(url, metodo, cuerpo);
    setOcupado(false);
    if (r.ok) {
      onAviso(r.clave ? { tipo: "ok", texto: `${exito} Cópiala ahora; no se vuelve a mostrar y deberá cambiarla al entrar:`, clave: r.clave } : { tipo: "ok", texto: exito });
      router.refresh();
      return true;
    }
    onAviso({ tipo: "error", texto: textoError(r) });
    router.refresh();
    return false;
  }

  // Rol y países se guardan al cambiarlos (el servidor revisa las reglas y, si algo no vale, se vuelve al valor guardado).
  const guardar = (cambios: { rol?: Rol; paises?: PaisSlug[] }) => {
    const rol = cambios.rol ?? u.rol;
    void accion(`/api/admin/usuarios/${u.id}`, "PATCH", { rol, paises: cambios.paises ?? u.paises }, `Cambios guardados para ${u.nombre}.`);
  };
  const meta = [u.correo ?? `usuario ${u.usuario} (sin correo)`, u.ultimoIngreso ? `último ingreso ${fecha.format(new Date(u.ultimoIngreso))}` : "nunca ha entrado"];

  return (
    <section className={u.activo ? "caja u-caja u-fila" : "caja u-caja u-fila inactivo"} aria-label={u.nombre}>
      <div className="u-cab">
        <div className="u-quien">
          <h2 className="h-caja">
            {u.nombre}
            {esYo ? <span className="chip mini c-no">tú</span> : null}
            <span className={u.activo ? "chip mini c-si" : "chip mini c-no"}>{u.activo ? "Activo" : "Desactivado"}</span>
            {u.debeCambiarClave ? <span className="chip mini c-alerta">contraseña temporal</span> : null}
          </h2>
          <p>{meta.join(" · ")}</p>
        </div>
        <div className="u-acciones">
          {u.activo ? (
            <>
              <button type="button" className="btn btn-borde btn-sm" disabled={ocupado}
                onClick={() => accion(`/api/admin/usuarios/${u.id}/clave`, "POST", undefined, `Contraseña temporal nueva para ${u.nombre}.`, `¿Restablecer la contraseña de ${u.nombre}? Se cerrarán sus sesiones.`)}>
                Restablecer contraseña
              </button>
              <button type="button" className="btn btn-borde btn-sm" disabled={ocupado}
                onClick={() => accion(`/api/admin/usuarios/${u.id}/sesiones`, "POST", undefined, "Sesiones cerradas.", `¿Cerrar todas las sesiones de ${u.nombre}?`)}>
                Cerrar sesiones
              </button>
              {!esYo ? (
                <button type="button" className="btn btn-peligro btn-sm" disabled={ocupado}
                  onClick={() => accion(`/api/admin/usuarios/${u.id}`, "PATCH", { activo: false }, "Usuario desactivado.", `¿Desactivar a ${u.nombre}? No podrá entrar al panel.`)}>
                  Desactivar
                </button>
              ) : null}
            </>
          ) : (
            <button type="button" className="btn btn-peligro btn-sm" disabled={ocupado} onClick={() => accion(`/api/admin/usuarios/${u.id}`, "PATCH", { activo: true }, "Usuario reactivado.")}>
              Reactivar
            </button>
          )}
        </div>
      </div>

      <div className="u-permisos">
        <div className="campo u-rol">
          <label className="lbl" htmlFor={`rol-${u.id}`}>Rol</label>
          <select id={`rol-${u.id}`} className="input input-sm" value={u.rol} disabled={!u.activo || ocupado} onChange={(e) => guardar({ rol: e.target.value as Rol })}>
            {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
          </select>
        </div>
        {conPaises(u.rol) ? (
          <div className="campo">
            <span className="lbl">Países que puede ver</span>
            <SelectorPaises nombre={u.nombre} valor={u.paises} deshabilitado={!u.activo || ocupado} onChange={(paises) => guardar({ paises })} />
          </div>
        ) : null}
      </div>

      {!u.correo ? (
        <form className="u-correo" onSubmit={async (e) => { e.preventDefault(); if (await accion(`/api/admin/usuarios/${u.id}`, "PATCH", { correo }, `Correo guardado: ${u.nombre} ya puede entrar con él.`)) setCorreo(""); }}>
          <div className="campo">
            <label className="lbl" htmlFor={`correo-${u.id}`}>Correo para ingresar</label>
            <input id={`correo-${u.id}`} className="input input-sm" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@tocaunavida.org" autoCapitalize="none" spellCheck={false} />
          </div>
          <button type="submit" className="btn btn-oscuro btn-sm" disabled={ocupado || !correo.trim()}>Guardar correo</button>
        </form>
      ) : null}
    </section>
  );
}
