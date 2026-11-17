"use client";
// Ingreso al panel (diseño 2027: AdminLogin, AdminLoginError, AdminBloqueo). Valida con el mismo esquema que el
// servidor y bloquea el doble envío. Tras varios fallos avisa cuántos intentos quedan; si el servidor bloquea, muestra
// la cuenta regresiva y deshabilita el formulario hasta que termine (el servidor lo vuelve a comprobar igual).
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Icono from "@/shared/ui/Icono";
import { AVISAR_DESDE, MINUTOS_BLOQUEO, RUTA_OLVIDE } from "../config/acceso";
import { TEXTOS_AUTH as T } from "../config/textos";
import { Credenciales } from "../schema";
import CampoClave from "./CampoClave";
import PantallaAcceso from "./PantallaAcceso";

const sinSuscripcion = () => () => {};
type Errores = Partial<Record<"usuario" | "clave", string>>;

const mmss = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

function mensajeFallo(quedan: number | undefined): string {
  if (quedan === undefined || quedan > AVISAR_DESDE) return T.credenciales;
  const min = String(MINUTOS_BLOQUEO);
  return quedan === 1 ? T.quedaUno.replace("{min}", min) : T.quedan.replace("{n}", String(quedan)).replace("{min}", min);
}

export default function FormularioLogin() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  /** Momento (ms) en que termina el bloqueo, o null. */
  const [bloqueoHasta, setBloqueoHasta] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [minutosAviso, setMinutosAviso] = useState(0);
  // Hasta que React toma el control, el botón está desactivado: así el navegador nunca envía el formulario por su
  // cuenta (por GET pondría la contraseña en la URL y en el historial).
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  const restante = bloqueoHasta ? Math.max(0, Math.ceil((bloqueoHasta - ahora) / 1000)) : 0;
  const bloqueado = restante > 0;

  useEffect(() => {
    if (!bloqueoHasta) return;
    const t = window.setInterval(() => {
      const t2 = Date.now();
      setAhora(t2);
      if (t2 >= bloqueoHasta) {
        setBloqueoHasta(null);
        setMensaje(null);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [bloqueoHasta]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando || bloqueado) return;
    setMensaje(null);
    setFallo(false);
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
      const cuerpo = (await res.json().catch(() => ({}))) as { destino?: string; error?: string; quedan?: number; reintentarEnSeg?: number };
      if (res.ok && cuerpo.destino) {
        // Recarga completa: la página del panel se arma en el servidor con la cookie nueva.
        window.location.assign(cuerpo.destino);
        return;
      }
      setClave("");
      if (cuerpo.error === "bloqueado" && cuerpo.reintentarEnSeg) {
        const t = Date.now();
        setAhora(t);
        setBloqueoHasta(t + cuerpo.reintentarEnSeg * 1000);
        setMinutosAviso(Math.ceil(cuerpo.reintentarEnSeg / 60));
      } else if (cuerpo.error === "credenciales") {
        setFallo(true);
        setMensaje(mensajeFallo(cuerpo.quedan));
      } else {
        setMensaje(T.error);
      }
    } catch {
      setMensaje(T.error);
    }
    setEnviando(false);
  }

  return (
    <PantallaAcceso titulo={bloqueado ? T.tituloBloqueo : T.tituloLogin} subtitulo={bloqueado ? T.subtituloBloqueo : T.subtituloLogin}>
      {bloqueado ? (
        <div role="alert" className="aviso-err">
          <Icono nombre="reloj" />
          <span>
            {T.bloqueo.split("{tiempo}")[0]}
            {/* El reloj cambia cada segundo: se oculta a lectores de pantalla, que oyen los minutos una sola vez. */}
            <span className="reloj" aria-hidden="true">{mmss(restante)}</span>
            <span className="solo-lector">{minutosAviso}</span>
            {T.bloqueo.split("{tiempo}")[1]}
          </span>
        </div>
      ) : mensaje ? (
        <div role="alert" className="aviso-err">
          <Icono nombre="alerta" />
          <span>{mensaje}</span>
        </div>
      ) : null}
      <form className="acceso-f" onSubmit={enviar} method="post" noValidate>
        <div className="campo">
          <label className="lbl" htmlFor="usuario">{T.usuario}</label>
          <input
            id="usuario"
            name="usuario"
            className={errores.usuario || fallo ? "input is-error" : "input"}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={T.ejemploCorreo}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            disabled={bloqueado}
            aria-invalid={errores.usuario || fallo ? true : undefined}
            aria-describedby={errores.usuario ? "usuario-error" : undefined}
          />
          {errores.usuario ? <span id="usuario-error" className="err">{errores.usuario}</span> : null}
        </div>
        <CampoClave id="clave" etiqueta={T.clave} valor={clave} cambiar={setClave} autoComplete="current-password"
          error={errores.clave} deshabilitado={bloqueado} />
        <button className="btn btn-primario btn-lg" type="submit" disabled={enviando || !listo || bloqueado}>
          {enviando ? T.entrando : T.entrar}
        </button>
        <Link className="btn btn-texto" href={RUTA_OLVIDE}>{T.olvide}</Link>
      </form>
    </PantallaAcceso>
  );
}
