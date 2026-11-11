"use client";

// Pantalla final: inscripción recibida, con el número de inscripción (radicado) para guardar.
import { useState } from "react";
import type { RespuestaExito } from "../api";
import { plantilla, txt, UI } from "../config/textos";
import type { Trato } from "../config/tipos";
import s from "./Inscripcion.module.css";

type Props = { pais: string; anio: string; trato: Trato; exito: RespuestaExito; rutaLanding: string };

export default function Confirmacion({ pais, anio, trato, exito, rutaLanding }: Props) {
  const [copiado, setCopiado] = useState(false);
  const nombre = exito.nombres.split(" ")[0] ?? exito.nombres;
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(exito.radicado);
      setCopiado(true);
    } catch {
      /* sin portapapeles: el número sigue visible para anotarlo */
    }
  };
  return (
    <section className={s.final} aria-live="polite">
      <div className={s.sello} aria-hidden>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <h1>{UI.exito.titulo}</h1>
      <p>{plantilla(txt(UI.exito.cuerpo, trato), { nombre, anio, pais })}</p>
      <div className={s.radicado}>
        <span>{UI.exito.radicado}</span>
        <strong>{exito.radicado}</strong>
        <button type="button" className={s.copiar} onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar número"}</button>
      </div>
      <p>{txt(UI.exito.guardar, trato)}</p>
      <p>{txt(UI.exito.siguientes, trato)}</p>
      <a className={s.boton} href={rutaLanding}>{UI.exito.volver}</a>
    </section>
  );
}
