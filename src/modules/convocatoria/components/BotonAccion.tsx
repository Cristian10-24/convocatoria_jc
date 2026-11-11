"use client";

// Botón de la convocatoria. NO decide a dónde va: recibe la `accion` ya resuelta en el servidor
// (src/lib/convocatoria/acciones.ts) y solo la ejecuta. Siempre emite el evento de ventana
// "convocatoria:accion" con { pais, boton, accion } para que el back o la analítica lo escuchen.
import type { ReactNode } from "react";
import { conUtm, type Accion, type IdBoton, type PaisSlug } from "@/modules/convocatoria/content/acciones";

export type DetalleAccion = { pais: PaisSlug; boton: IdBoton; accion: Accion };
export const EVENTO_ACCION = "convocatoria:accion";

type Props = { pais: PaisSlug; boton: IdBoton; accion: Accion; className?: string; children: ReactNode; textoPendiente?: string };

function emitir(detalle: DetalleAccion) {
  window.dispatchEvent(new CustomEvent<DetalleAccion>(EVENTO_ACCION, { detail: detalle }));
}

export default function BotonAccion({ pais, boton, accion, className, children, textoPendiente }: Props) {
  const datos = { "data-convocatoria-pais": pais, "data-convocatoria-boton": boton, "data-convocatoria-accion": accion.tipo };
  const avisar = () => emitir({ pais, boton, accion });

  switch (accion.tipo) {
    case "enlace": {
      const nueva = accion.nuevaPestana ?? true;
      return (
        <a
          {...datos}
          className={className}
          href={accion.url}
          target={nueva ? "_blank" : undefined}
          rel={nueva ? "noopener noreferrer" : undefined}
          onClick={(e) => {
            avisar();
            if (accion.conUtm && window.location.search) e.currentTarget.href = conUtm(accion.url, window.location.search);
          }}
        >
          {children}
        </a>
      );
    }
    case "ruta":
      return <a {...datos} className={className} href={accion.ruta} onClick={avisar}>{children}</a>;
    case "ancla":
      return <a {...datos} className={className} href={`#${accion.id}`} onClick={avisar}>{children}</a>;
    case "evento":
      return (
        <button {...datos} type="button" className={className} onClick={avisar} data-convocatoria-evento={accion.nombre}>
          {children}
        </button>
      );
    case "pendiente":
      // Visible pero sin destino: no navega, se anuncia como deshabilitado y explica por qué.
      return (
        <button {...datos} type="button" className={className} aria-disabled="true" data-pendiente="" onClick={avisar}>
          {accion.texto ?? textoPendiente ?? children}
        </button>
      );
  }
}
