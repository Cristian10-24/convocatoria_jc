"use client";
// Campo de contraseña con botón "Mostrar" / "Ocultar" (diseño 2027). El botón dice en voz alta qué hace.
import { useState } from "react";
import { TEXTOS_AUTH as T } from "../config/textos";

type Props = {
  id: string;
  etiqueta: string;
  valor: string;
  cambiar: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  describe?: string;
  deshabilitado?: boolean;
};

export default function CampoClave({ id, etiqueta, valor, cambiar, autoComplete, error, describe, deshabilitado }: Props) {
  const [visible, setVisible] = useState(false);
  const descripciones = [error ? `${id}-error` : "", describe ?? ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="campo">
      <label className="lbl" htmlFor={id}>{etiqueta}</label>
      <div className="clave-caja">
        <input
          id={id}
          name={id}
          className={error ? "input is-error" : "input"}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
          disabled={deshabilitado}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripciones}
        />
        <button type="button" className="btn btn-texto btn-sm" onClick={() => setVisible((v) => !v)} aria-pressed={visible}
          aria-label={visible ? T.ocultarEtiqueta : T.mostrarEtiqueta} aria-controls={id} disabled={deshabilitado}>
          {visible ? T.ocultar : T.mostrar}
        </button>
      </div>
      {error ? <span id={`${id}-error`} className="err">{error}</span> : null}
    </div>
  );
}
