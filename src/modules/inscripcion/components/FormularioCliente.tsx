"use client";

// Carga el formulario solo en el navegador: así puede leer el borrador de sessionStorage desde el primer render.
// Mientras carga (unos milisegundos tras el HTML estático) se ve un esqueleto del mismo tamaño.
import dynamic from "next/dynamic";
import { UI } from "../config/textos";
import s from "./Inscripcion.module.css";

const Formulario = dynamic(() => import("./FormularioInscripcion"), {
  ssr: false,
  loading: () => (
    <div className={s.esqueleto} role="status" aria-label={UI.cargando}>
      <i /><i /><i /><i />
    </div>
  ),
});

export default Formulario;
