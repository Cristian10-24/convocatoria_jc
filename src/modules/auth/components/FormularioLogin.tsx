"use client";
// Formulario de ingreso al panel. Valida con el mismo esquema que el servidor y bloquea el doble envío.
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { TEXTOS_AUTH as T } from "../config/textos";
import { Credenciales } from "../schema";
import s from "./Auth.module.css";

const sinSuscripcion = () => () => {};

type Errores = Partial<Record<"usuario" | "clave", string>>;

export default function FormularioLogin() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Hasta que React toma el control, el botón está desactivado: así el navegador nunca envía el formulario por su
  // cuenta (por GET pondría la contraseña en la URL y en el historial).
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setMensaje(null);
    const r = Credenciales.safeParse({ usuario, clave });
    if (!r.success) {
      const nuevos: Errores = {};
      for (const i of r.error.issues) {
        const campo = i.path[0];
        if ((campo === "usuario" || campo === "clave") && !nuevos[campo]) nuevos[campo] = i.message;
      }
      setErrores(nuevos);
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(r.data),
        credentials: "same-origin",
      });
      const cuerpo = (await res.json().catch(() => ({}))) as { destino?: string; mensaje?: string };
      if (res.ok && cuerpo.destino) {
        // Recarga completa: la página del panel se arma en el servidor con la cookie nueva.
        window.location.assign(cuerpo.destino);
        return;
      }
      setMensaje(cuerpo.mensaje ?? T.error);
      setClave("");
    } catch {
      setMensaje(T.error);
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} method="post" noValidate>
      <div className={s.campo}>
        <label htmlFor="usuario">{T.usuario}</label>
        <input
          id="usuario"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          aria-invalid={errores.usuario ? true : undefined}
          aria-describedby={errores.usuario ? "usuario-error" : undefined}
        />
        {errores.usuario && <span id="usuario-error" className={s.errorCampo}>{errores.usuario}</span>}
      </div>
      <div className={s.campo}>
        <label htmlFor="clave">{T.clave}</label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          aria-invalid={errores.clave ? true : undefined}
          aria-describedby={errores.clave ? "clave-error" : undefined}
        />
        {errores.clave && <span id="clave-error" className={s.errorCampo}>{errores.clave}</span>}
      </div>
      {mensaje && (
        <p className={s.alerta} role="alert">
          {mensaje}
        </p>
      )}
      <button className={s.boton} type="submit" disabled={enviando || !listo}>
        {enviando ? T.entrando : T.entrar}
      </button>
    </form>
  );
}
