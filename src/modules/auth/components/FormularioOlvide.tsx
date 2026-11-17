"use client";
// "Olvidé mi contraseña" (diseño 2027: AdminOlvide y AdminOlvideEnviado). La respuesta es la misma exista o no el
// correo: la pantalla siempre dice "si está registrado, te enviamos un enlace".
import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import Icono from "@/shared/ui/Icono";
import { MINUTOS_ENLACE, RUTA_LOGIN } from "../config/acceso";
import { TEXTOS_AUTH as T } from "../config/textos";
import { SolicitudEnlace } from "../schema";
import PantallaAcceso from "./PantallaAcceso";

const sinSuscripcion = () => () => {};

export default function FormularioOlvide() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    const r = SolicitudEnlace.safeParse({ correo });
    if (!r.success) {
      setError(r.error.issues[0]?.message ?? T.error);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/olvide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(r.data), credentials: "same-origin" });
      if (res.ok) {
        setEnviado(r.data.correo);
        return;
      }
      setAviso(res.status === 429 ? T.limite : T.error);
    } catch {
      setAviso(T.error);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <PantallaAcceso titulo={T.tituloEnviado}>
        <div role="status" className="aviso-info">
          <Icono nombre="sobre" />
          <span>{T.enviado.replace("{correo}", enviado)}</span>
        </div>
        <Link className="btn btn-oscuro btn-lg" href={RUTA_LOGIN}>{T.volver}</Link>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo={T.tituloOlvide} subtitulo={T.subtituloOlvide.replace("{min}", String(MINUTOS_ENLACE))}>
      {aviso ? (
        <div role="alert" className="aviso-err">
          <Icono nombre="alerta" />
          <span>{aviso}</span>
        </div>
      ) : null}
      <form className="acceso-f" onSubmit={enviar} method="post" noValidate>
        <div className="campo">
          <label className="lbl" htmlFor="correo">{T.correo}</label>
          <input id="correo" name="correo" className={error ? "input is-error" : "input"} type="email" inputMode="email" autoComplete="username"
            autoCapitalize="none" spellCheck={false} placeholder={T.ejemploCorreo} value={correo} onChange={(e) => setCorreo(e.target.value)}
            aria-invalid={error ? true : undefined} aria-describedby={error ? "correo-error" : undefined} />
          {error ? <span id="correo-error" className="err">{error}</span> : null}
        </div>
        <button className="btn btn-primario btn-lg" type="submit" disabled={enviando || !listo}>{enviando ? T.enviando : T.enviarEnlace}</button>
        <Link className="btn btn-texto" href={RUTA_LOGIN}>{T.volver}</Link>
      </form>
    </PantallaAcceso>
  );
}
