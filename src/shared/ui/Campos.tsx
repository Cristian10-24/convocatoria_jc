// Campos del sistema de diseño 2027: etiqueta arriba, ayuda persistente y error enlazado con aria-describedby.
// Son piezas de presentación (sin estado): el formulario decide valores, errores y cuándo validar.
// Accesibilidad: label + for, aria-invalid solo cuando hay error, el error se anuncia con role="alert" y lleva icono
// además de color. Radios y casillas son <input> nativos dentro de su <label>, agrupados con <fieldset> + <legend>.
import type { InputHTMLAttributes, ReactNode } from "react";
import Icono from "./Icono";

const unir = (...ids: Array<string | false | undefined>) => ids.filter(Boolean).join(" ") || undefined;

export function MensajeError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className="err" role="alert">
      <Icono nombre="alerta" />
      {children}
    </span>
  );
}

type Base = { id: string; etiqueta: ReactNode; ayuda?: ReactNode; error?: string; opcional?: boolean };

/** Texto, correo o número (los números van como texto con inputmode: no pierden ceros ni muestran flechas). */
export function CampoTexto({ id, etiqueta, ayuda, error, opcional, className, ...input }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <div className="campo">
      <label className="lbl" htmlFor={id}>
        {etiqueta}
        {opcional ? <span className="opcional"> (opcional)</span> : null}
      </label>
      <input
        type="text"
        {...input}
        id={id}
        className={["input", error ? "is-error" : "", className ?? ""].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={unir(ayuda ? `${id}-ayuda` : false, error ? `${id}-error` : false)}
      />
      {ayuda ? <span id={`${id}-ayuda`} className="ayuda">{ayuda}</span> : null}
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </div>
  );
}

/** Teléfono con el indicativo del país fijo a la izquierda. */
export function CampoTelefono({ id, etiqueta, ayuda, error, opcional, prefijo, ...input }: Base & { prefijo: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type">) {
  return (
    <div className="campo">
      <label className="lbl" htmlFor={id}>
        {etiqueta}
        {opcional ? <span className="opcional"> (opcional)</span> : null}
      </label>
      <div className={error ? "tel is-error" : "tel"}>
        <span className="prefijo" aria-hidden="true">{prefijo}</span>
        <input
          inputMode="tel"
          {...input}
          type="tel"
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={unir(ayuda ? `${id}-ayuda` : false, error ? `${id}-error` : false)}
        />
      </div>
      {ayuda ? <span id={`${id}-ayuda`} className="ayuda">{ayuda}</span> : null}
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </div>
  );
}

export type OpcionCampo = { valor: string; etiqueta: ReactNode };

/**
 * Grupo de radios ("una") o casillas ("varias"). `forma`: lista (una por fila), rejilla (dos columnas si caben) o
 * segmentos (botones centrados, sin el círculo: Sí / No, tallas, estrato).
 */
export function GrupoOpciones({
  id, etiqueta, ayuda, error, opcional, opciones, tipo = "una", forma = "lista", valor, alCambiar,
}: Base & {
  opciones: OpcionCampo[];
  tipo?: "una" | "varias";
  forma?: "lista" | "rejilla" | "segmentos";
  /** Valor elegido ("una") o lista de valores ("varias"). */
  valor: string | string[];
  alCambiar?: (valor: string, marcado: boolean) => void;
}) {
  const marcados = Array.isArray(valor) ? valor : valor ? [valor] : [];
  const rejilla = forma === "segmentos" ? "ops-seg" : forma === "rejilla" ? "ops-grid" : "ops";
  return (
    <fieldset className="campo" aria-describedby={unir(ayuda ? `${id}-ayuda` : false, error ? `${id}-error` : false)}>
      <legend className="lbl">
        {etiqueta}
        {opcional ? <span className="opcional"> (opcional)</span> : null}
      </legend>
      {ayuda ? <span id={`${id}-ayuda`} className="ayuda" style={{ marginTop: -4 }}>{ayuda}</span> : null}
      <div className={rejilla}>
        {opciones.map((o) => {
          const sel = marcados.includes(o.valor);
          return (
            <label key={o.valor} className={["op", forma === "segmentos" ? "seg" : "", sel ? "is-sel" : "", error ? "is-error" : ""].filter(Boolean).join(" ")}>
              <input
                type={tipo === "varias" ? "checkbox" : "radio"}
                name={id}
                value={o.valor}
                // Sin `alCambiar` es una muestra estática (se puede dibujar en el servidor): no lleva manejadores.
                {...(alCambiar ? { checked: sel, onChange: (e) => alCambiar(o.valor, e.target.checked) } : { defaultChecked: sel })}
              />
              <span>{o.etiqueta}</span>
            </label>
          );
        })}
      </div>
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </fieldset>
  );
}

/** Casilla de aceptación (consentimientos). Nunca llega marcada por defecto: `marcada` lo decide quien la usa. */
export function CasillaAcepta({ id, marcada, error, children, alCambiar }: { id: string; marcada: boolean; error?: string; children: ReactNode; alCambiar?: (marcada: boolean) => void }) {
  return (
    <>
      <label className={["acepta", marcada ? "is-on" : "", error ? "is-error" : ""].filter(Boolean).join(" ")}>
        <input
          type="checkbox"
          id={id}
          name={id}
          {...(alCambiar ? { checked: marcada, onChange: (e) => alCambiar(e.target.checked) } : { defaultChecked: marcada })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </>
  );
}
