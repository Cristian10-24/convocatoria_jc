"use client";
// Contraseña nueva (diseño 2027: AdminCambio). Dos usos:
//  - "cambio": primer ingreso o contraseña temporal, con sesión.
//  - "enlace": desde el correo de "Olvidé mi contraseña". El token viene después de "#" (no viaja al servidor al abrir
//    la página); se lee aquí y se borra de la barra de direcciones.
// Los requisitos se marcan mientras se escribe; el servidor los vuelve a revisar.
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Icono from "@/shared/ui/Icono";
import { RUTA_LOGIN, RUTA_OLVIDE } from "../config/acceso";
import { MENSAJES_AUTH as M, TEXTOS_AUTH as T } from "../config/textos";
import { CambioClave, REQUISITOS_CLAVE } from "../schema";
import CampoClave from "./CampoClave";
import PantallaAcceso from "./PantallaAcceso";

const sinSuscripcion = () => () => {};
type Errores = Partial<Record<"nueva" | "repetir", string>>;

/** El token del enlace, leído una vez del "#t=" de la dirección (y borrado de ella). */
function tokenDelEnlace(): string | null {
  const t = new URLSearchParams(window.location.hash.slice(1)).get("t");
  if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  return t;
}

export default function FormularioClaveNueva({ modo }: { modo: "cambio" | "enlace" }) {
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [vencido, setVencido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  useEffect(() => {
    if (modo !== "enlace") return;
    const t = tokenDelEnlace();
    // Se lee del navegador una sola vez, después de montar (la página es estática).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setToken(t);
    else setVencido(true);
  }, [modo]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setAviso(null);
    const r = CambioClave.safeParse({ nueva, repetir });
    if (!r.success) {
      const nuevos: Errores = {};
      for (const i of r.error.issues) {
        const campo = i.path[0];
        if ((campo === "nueva" || campo === "repetir") && !nuevos[campo]) nuevos[campo] = i.message;
      }
      setErrores(nuevos);
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const url = modo === "enlace" ? "/api/auth/restablecer" : "/api/auth/clave";
      const cuerpo = modo === "enlace" ? { token, ...r.data } : r.data;
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo), credentials: "same-origin" });
      const datos = (await res.json().catch(() => ({}))) as { destino?: string; errores?: Errores };
      if (res.ok && datos.destino) {
        window.location.assign(datos.destino);
        return;
      }
      if (res.status === 410) setVencido(true);
      else if (res.status === 401) window.location.assign(RUTA_LOGIN);
      else if (datos.errores) setErrores(datos.errores);
      else setAviso(T.error);
    } catch {
      setAviso(T.error);
    }
    setEnviando(false);
  }

  if (vencido) {
    return (
      <PantallaAcceso titulo={T.tituloEnlace}>
        <div role="alert" className="aviso-err">
          <Icono nombre="alerta" />
          <span>{T.enlaceVencido}</span>
        </div>
        <Link className="btn btn-oscuro btn-lg" href={RUTA_OLVIDE}>{T.pedirOtro}</Link>
      </PantallaAcceso>
    );
  }

  const requisitos = [
    ...REQUISITOS_CLAVE.map((q) => ({ id: q.id, texto: q.texto, ok: q.cumple(nueva) })),
    ...(modo === "cambio" ? [{ id: "distinta", texto: M.reqDistinta, ok: nueva.length > 0 && errores.nueva !== M.igualAnterior }] : []),
  ];

  return (
    <PantallaAcceso titulo={modo === "cambio" ? T.tituloCambio : T.tituloEnlace} subtitulo={modo === "cambio" ? T.subtituloCambio : T.subtituloEnlace}>
      {modo === "cambio" ? (
        <div className="aviso-info">
          <Icono nombre="info" />
          <span>{T.avisoCambio}</span>
        </div>
      ) : null}
      {aviso ? (
        <div role="alert" className="aviso-err">
          <Icono nombre="alerta" />
          <span>{aviso}</span>
        </div>
      ) : null}
      <form className="acceso-f" onSubmit={enviar} method="post" noValidate>
        <CampoClave id="nueva" etiqueta={T.nueva} valor={nueva} cambiar={setNueva} autoComplete="new-password" error={errores.nueva} describe="requisitos" />
        <ul id="requisitos" className="requisitos" aria-label={T.requisitos}>
          {requisitos.map((q) => (
            <li key={q.id} className={q.ok ? "ok" : undefined}>
              <Icono nombre={q.ok ? "visto" : "info"} />
              {q.texto}
              <span className="solo-lector">{q.ok ? " (cumple)" : " (falta)"}</span>
            </li>
          ))}
        </ul>
        <CampoClave id="repetir" etiqueta={T.repetir} valor={repetir} cambiar={setRepetir} autoComplete="new-password" error={errores.repetir} />
        <button className="btn btn-primario btn-lg" type="submit" disabled={enviando || !listo || (modo === "enlace" && !token)}>
          {enviando ? T.guardando : modo === "cambio" ? T.guardar : T.guardarEnlace}
        </button>
      </form>
    </PantallaAcceso>
  );
}
