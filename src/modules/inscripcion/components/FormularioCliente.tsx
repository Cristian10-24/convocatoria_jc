"use client";

// Carga el formulario solo en el navegador: así puede leer el avance de sessionStorage desde el primer dibujo.
// Mientras carga (unos milisegundos tras el HTML estático) se ve un esqueleto del mismo tamaño.
import dynamic from "next/dynamic";
import { IU } from "../config/interfaz";

const Formulario = dynamic(() => import("./Formulario"), {
  ssr: false,
  loading: () => (
    <div className="jc fpg">
      <div className="fh"><div className="wrap fw" /></div>
      <div className="wrap fw fcol">
        <div className="fcard fesq" role="status" aria-label={IU.cargando}><i /><i /><i /><i /></div>
      </div>
    </div>
  ),
});

export default Formulario;
