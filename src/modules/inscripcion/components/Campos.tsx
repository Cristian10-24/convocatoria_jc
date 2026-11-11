"use client";

// Piezas de formulario accesibles: etiqueta, ayuda y error enlazados (aria-describedby), grupos de opciones con
// fieldset/legend y objetivos táctiles grandes. No saben nada de la convocatoria: reciben textos ya resueltos.
import { useId, type ReactNode } from "react";
import s from "./Inscripcion.module.css";

type Base = { id: string; etiqueta: string; ayuda?: string; error?: string };

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

function Mensajes({ idAyuda, idError, ayuda, error }: { idAyuda: string; idError: string; ayuda?: string; error?: string }) {
  return (
    <>
      {ayuda && <div id={idAyuda} className={s.ayuda}>{ayuda}</div>}
      {error && <div id={idError} className={s.error} role="alert">{error}</div>}
    </>
  );
}

function describedBy(idAyuda: string, idError: string, ayuda?: string, error?: string) {
  return [ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined;
}

export function CampoTexto({
  id, etiqueta, ayuda, error, valor, onCambio, tipo = "text", modo, autoCompletar, placeholder, prefijo, max, extra, maxLength = 120,
}: Base & {
  valor: string; onCambio: (v: string) => void; tipo?: "text" | "email" | "tel" | "date"; modo?: "text" | "numeric" | "decimal" | "email" | "tel";
  autoCompletar?: string; placeholder?: string; prefijo?: string; max?: string; extra?: ReactNode; maxLength?: number;
}) {
  const u = useId();
  const [idAyuda, idError] = [`${u}-ayuda`, `${u}-error`];
  const entrada = (
    <input
      id={id}
      name={id}
      className={s.entrada}
      type={tipo}
      inputMode={modo}
      autoComplete={autoCompletar ?? "off"}
      placeholder={placeholder}
      value={valor}
      max={max}
      maxLength={tipo === "date" ? undefined : maxLength}
      onChange={(e) => onCambio(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(idAyuda, idError, ayuda, error)}
    />
  );
  return (
    <div className={`${s.campo} ${error ? s.campoError : ""}`} data-campo={id}>
      <label htmlFor={id} className={s.etiqueta}>{etiqueta}</label>
      {prefijo ? <div className={s.conPrefijo}><span className={s.prefijo} aria-hidden>{prefijo}</span>{entrada}</div> : entrada}
      {extra}
      <Mensajes idAyuda={idAyuda} idError={idError} ayuda={ayuda} error={error} />
    </div>
  );
}

export function CampoSelector({
  id, etiqueta, ayuda, error, valor, onCambio, opciones, vacio,
}: Base & { valor: string; onCambio: (v: string) => void; opciones: { id: string; etiqueta: string }[]; vacio: string }) {
  const u = useId();
  const [idAyuda, idError] = [`${u}-ayuda`, `${u}-error`];
  return (
    <div className={`${s.campo} ${error ? s.campoError : ""}`} data-campo={id}>
      <label htmlFor={id} className={s.etiqueta}>{etiqueta}</label>
      <select
        id={id}
        name={id}
        className={s.selector}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(idAyuda, idError, ayuda, error)}
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
      </select>
      <Mensajes idAyuda={idAyuda} idError={idError} ayuda={ayuda} error={error} />
    </div>
  );
}

/** Opción única. `enFila` = botones cortos lado a lado (Sí/No, tallas). */
export function CampoOpciones({
  id, etiqueta, ayuda, error, valor, onCambio, opciones, enFila,
}: Base & { valor: string; onCambio: (v: string) => void; opciones: { id: string; etiqueta: string }[]; enFila?: boolean }) {
  const u = useId();
  const [idAyuda, idError] = [`${u}-ayuda`, `${u}-error`];
  return (
    <fieldset
      className={`${s.campo} ${error ? s.campoError : ""}`}
      data-campo={id}
      aria-describedby={describedBy(idAyuda, idError, ayuda, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend className={s.etiqueta}>{etiqueta}</legend>
      {ayuda && <div id={idAyuda} className={s.ayuda}>{ayuda}</div>}
      <div className={enFila ? s.opcionesFila : s.opciones} role="radiogroup">
        {opciones.map((o, i) => (
          <label key={o.id} className={s.opcion}>
            <input type="radio" name={id} id={i === 0 ? id : undefined} value={o.id} checked={valor === o.id} onChange={() => onCambio(o.id)} />
            <span className={s.marcador} aria-hidden><Check /></span>
            <span>{o.etiqueta}</span>
          </label>
        ))}
      </div>
      {error && <div id={idError} className={s.error} role="alert">{error}</div>}
    </fieldset>
  );
}

/** Varias opciones. `excluyente` = la opción que, al marcarse, desmarca las demás ("Ninguna de las anteriores"). */
export function CampoMultiple({
  id, etiqueta, ayuda, error, valor, onCambio, opciones, excluyente,
}: Base & { valor: string[]; onCambio: (v: string[]) => void; opciones: { id: string; etiqueta: string }[]; excluyente?: string }) {
  const u = useId();
  const [idAyuda, idError] = [`${u}-ayuda`, `${u}-error`];
  const alternar = (op: string, marcado: boolean) => {
    if (!marcado) return onCambio(valor.filter((v) => v !== op));
    if (op === excluyente) return onCambio([op]);
    onCambio([...valor.filter((v) => v !== excluyente), op]);
  };
  return (
    <fieldset className={`${s.campo} ${error ? s.campoError : ""}`} data-campo={id} aria-describedby={describedBy(idAyuda, idError, ayuda, error)}>
      <legend className={s.etiqueta}>{etiqueta}</legend>
      {ayuda && <div id={idAyuda} className={s.ayuda}>{ayuda}</div>}
      <div className={s.opciones}>
        {opciones.map((o, i) => (
          <label key={o.id} className={s.opcion}>
            <input type="checkbox" name={id} id={i === 0 ? id : undefined} value={o.id} checked={valor.includes(o.id)} onChange={(e) => alternar(o.id, e.target.checked)} />
            <span className={`${s.marcador} ${s.marcadorCuadrado}`} aria-hidden><Check /></span>
            <span>{o.etiqueta}</span>
          </label>
        ))}
      </div>
      {error && <div id={idError} className={s.error} role="alert">{error}</div>}
    </fieldset>
  );
}

/** Casilla de aceptación (autorizaciones), con el texto legal encima. */
export function CampoAceptar({
  id, etiqueta, error, valor, onCambio, children,
}: Omit<Base, "ayuda"> & { valor: boolean; onCambio: (v: boolean) => void; children?: ReactNode }) {
  const u = useId();
  const idError = `${u}-error`;
  return (
    <div className={`${s.campo} ${error ? s.campoError : ""}`} data-campo={id}>
      {children}
      <label className={s.acepto}>
        <input id={id} type="checkbox" checked={valor} onChange={(e) => onCambio(e.target.checked)} aria-invalid={error ? true : undefined} aria-describedby={error ? idError : undefined} />
        <span>{etiqueta}</span>
      </label>
      {error && <div id={idError} className={s.error} role="alert">{error}</div>}
    </div>
  );
}
