// Botón del sistema de diseño 2027. Una sola pieza para el sitio (`.jc`) y el panel (`.ad`): las variantes se
// llaman igual y aquí se traducen a la clase de cada ámbito. Con `href` se dibuja un enlace; sin él, un <button>.
// Los atributos data-track / data-ubicacion / data-pais del plan de medición se pasan tal cual.
import type { MouseEventHandler, ReactNode } from "react";
import Icono from "./Icono";

export type VarianteBoton = "primario" | "oscuro" | "borde" | "borde-blanco" | "texto" | "peligro";
export type TamBoton = "sm" | "md" | "lg";

/** Sitio: btn-pri / btn-sec / btn-ter / btn-ter-b / btn-txt. Panel: btn-primario / btn-oscuro / btn-borde / btn-texto. */
const CLASE: Record<"sitio" | "panel", Record<VarianteBoton, string>> = {
  sitio: { primario: "btn-pri", oscuro: "btn-sec", borde: "btn-ter", "borde-blanco": "btn-ter-b", texto: "btn-txt", peligro: "btn-ter" },
  panel: { primario: "btn-primario", oscuro: "btn-oscuro", borde: "btn-borde", "borde-blanco": "btn-borde", texto: "btn-texto", peligro: "btn-peligro" },
};

type Props = {
  variante?: VarianteBoton;
  tam?: TamBoton;
  /** "sitio" (por defecto) o "panel": cambia el juego de clases. */
  ambito?: "sitio" | "panel";
  /** Flecha a la derecha que se desplaza 5 px al pasar el mouse (solo CSS). */
  flecha?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Con `href` se dibuja un enlace. */
  href?: string;
  target?: "_blank";
  rel?: string;
  /** Solo para <button>. */
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "data-track"?: string;
  "data-ubicacion"?: string;
  "data-pais"?: string;
  "data-canal"?: string;
};

export function claseBoton({ variante = "primario", tam = "md", ambito = "sitio", className }: Pick<Props, "variante" | "tam" | "ambito" | "className">): string {
  return ["btn", CLASE[ambito][variante], tam === "lg" ? "btn-lg" : tam === "sm" ? "btn-sm" : "", className ?? ""].filter(Boolean).join(" ");
}

export default function Boton({ variante, tam, ambito, flecha, children, className, href, target, rel, type = "button", disabled, ...resto }: Props) {
  const clase = claseBoton({ variante, tam, ambito, className });
  const contenido = (
    <>
      {children}
      {flecha ? <Icono nombre="flecha" clase="fl" /> : null}
    </>
  );
  if (href !== undefined) {
    // Un enlace que abre pestaña nueva nunca le da a esa pestaña acceso a esta (rel noopener).
    const relSeguro = target === "_blank" ? [rel, "noopener"].filter(Boolean).join(" ") : rel;
    return <a {...resto} href={href} target={target} rel={relSeguro} className={clase}>{contenido}</a>;
  }
  // type="button" por defecto: un botón auxiliar dentro de un formulario no debe enviarlo.
  return <button {...resto} type={type} disabled={disabled} className={clase}>{contenido}</button>;
}
