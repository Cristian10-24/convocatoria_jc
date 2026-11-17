"use client";

// Paso "Ciudad": un solo campo, "¿En qué ciudad vives?". Un buscador filtra la lista de TODAS las ciudades del
// país en orden alfabético (las sedes van mezcladas, sin destacarlas: en el formulario no se habla de sedes). Si la
// ciudad no aparece, "Mi ciudad no está en la lista" abre un campo para escribirla.
// Datos: `ciudad` (nombre de la lista, o "otra" + `ciudadOtra`). La sede la deduce el servidor a partir de la ciudad.
// La lista no tiene scroll propio ni corta textos: crece con la página y los nombres largos pasan a otra línea.
import { useMemo, useState } from "react";
import { MensajeError } from "@/shared/ui/Campos";
import Icono from "@/shared/ui/Icono";
import { IU } from "../config/interfaz";
import { txt } from "../config/textos";
import type { DefinicionPais } from "../config/tipos";
import { preguntaDe } from "../mostrar";
import { CIUDAD_OTRA, ciudadesDelPais, type Borrador, type Errores } from "../schema";

const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Props = {
  def: DefinicionPais;
  datos: Borrador;
  errores: Errores;
  paisMed: string;
  cambiar: (campo: string, valor: string, mas?: Borrador) => void;
};

export default function PasoCiudad({ def, datos, errores, paisMed, cambiar }: Props) {
  const tr = def.config.trato;
  const ciudades = useMemo(() => ciudadesDelPais(def), [def]);
  const [busqueda, setBusqueda] = useState("");
  const elegida = datos.ciudad ?? "";
  const otra = elegida === CIUDAD_OTRA;
  // La ciudad elegida sigue a la vista aunque no coincida con lo que se escribe en el buscador.
  const visibles = busqueda ? ciudades.filter((c) => normal(c.ciudad).includes(normal(busqueda)) || c.ciudad === elegida) : ciudades;
  const sinResultados = !!busqueda && !ciudades.some((c) => normal(c.ciudad).includes(normal(busqueda)));
  const errorCiudad = errores.ciudad;

  const elegir = (ciudad: string) => cambiar("ciudad", ciudad, { ciudadOtra: "" });
  // Si buscó y no la encontró, lo que escribió pasa al campo de texto (no hay que escribirlo dos veces).
  const elegirOtra = () => cambiar("ciudad", CIUDAD_OTRA, { ciudadOtra: datos.ciudadOtra || (sinResultados ? busqueda.trim() : "") });

  return (
    <div className="campos ciudad-paso">
      <fieldset className="campo" data-campo="ciudad" aria-describedby={errorCiudad ? "f-ciudad-error" : undefined}>
        {/* El título del paso ya hace la pregunta: la leyenda queda para lectores de pantalla. */}
        <legend className="solo-lector">{txt(IU.ciudad.pregunta, tr)}</legend>
        <div className="ciu-buscar">
          <Icono nombre="buscar" />
          <input type="search" className="input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={txt(IU.ciudad.buscar, tr)}
            aria-label={txt(IU.ciudad.buscar, tr)} aria-controls="ciu-lista" autoComplete="off" enterKeyHint="search" />
        </div>
        <div id="ciu-lista" className="ciu-lista">
          {visibles.map((c) => (
            <label key={c.ciudad} className={["op", elegida === c.ciudad ? "is-sel" : "", errorCiudad ? "is-error" : ""].filter(Boolean).join(" ")} data-track="ciudad_seleccionada" data-otra="false" data-pais={paisMed}>
              <input className="solo-lector" type="radio" name="ciudad" value={c.ciudad} checked={elegida === c.ciudad} onChange={() => elegir(c.ciudad)} />
              <span className="ciu-marca" aria-hidden="true" />
              <span>{c.ciudad}</span>
            </label>
          ))}
          {sinResultados ? <p className="ayuda ciu-vacio" role="status">{txt(IU.ciudad.sinResultados, tr)}</p> : null}
        </div>
        <label className={["op", "ciu-otra", otra ? "is-sel" : "", errorCiudad ? "is-error" : ""].filter(Boolean).join(" ")} data-track="ciudad_seleccionada" data-otra="true" data-pais={paisMed}>
          <input className="solo-lector" type="radio" name="ciudad" value={CIUDAD_OTRA} checked={otra} onChange={elegirOtra} />
          <span className="ciu-marca" aria-hidden="true" />
          <span>{IU.ciudad.noEsta}</span>
        </label>
        {errorCiudad ? <MensajeError id="f-ciudad-error">{errorCiudad}</MensajeError> : null}
      </fieldset>

      {otra ? (
        <div className="campo" data-campo="ciudadOtra">
          <label className="lbl" htmlFor="f-ciudadOtra">{preguntaDe(def, "ciudadOtra").etiqueta}</label>
          <input id="f-ciudadOtra" name="ciudadOtra" className={errores.ciudadOtra ? "input is-error" : "input"} type="text" autoComplete="address-level2" maxLength={80}
            value={datos.ciudadOtra ?? ""} onChange={(e) => cambiar("ciudadOtra", e.target.value)} aria-invalid={errores.ciudadOtra ? true : undefined} aria-describedby={errores.ciudadOtra ? "f-ciudadOtra-error" : undefined} />
          {errores.ciudadOtra ? <MensajeError id="f-ciudadOtra-error">{errores.ciudadOtra}</MensajeError> : null}
        </div>
      ) : null}
    </div>
  );
}
