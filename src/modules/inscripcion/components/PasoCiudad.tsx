"use client";

// Paso "Ciudad" del formulario, todo en la misma vista: arriba las ciudades sede como tarjetas; debajo, las ciudades
// cercanas del país (lista, o buscador con la lista abierta si son muchas) y "Otra ciudad" para escribirla. Si la
// persona no vive en una ciudad sede, ahí mismo se le pregunta a qué sede podría asistir.
// Es un solo grupo de radios (una sola respuesta) y no cambia las claves de datos:
// - Ubicación "lista" (Uruguay): `sede` = sede a la que asiste, `ciudad` = ciudad (o "otra" + `ciudadOtra`).
// - Ubicación "libre": `sede` = ciudad sede, u "otra" + `ciudadOtra` (la ciudad) + `sedeCercana`.
import { useMemo, useState } from "react";
import { MensajeError } from "@/shared/ui/Campos";
import Icono from "@/shared/ui/Icono";
import { IU } from "../config/interfaz";
import { plantilla, txt } from "../config/textos";
import type { DefinicionPais } from "../config/tipos";
import { preguntaDe } from "../mostrar";
import { CIUDAD_OTRA, ciudadSede, ciudadesCercanas, sedesReales, type Borrador, type Errores } from "../schema";

/** Con más ciudades que esto, la lista lleva un buscador. */
const MAX_SIN_BUSCADOR = 12;
const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Props = {
  def: DefinicionPais;
  datos: Borrador;
  errores: Errores;
  paisMed: string;
  cambiar: (campo: string, valor: string, mas?: Borrador) => void;
};

export default function PasoCiudad({ def, datos, errores, paisMed, cambiar }: Props) {
  const lista = def.reglas.ubicacion === "lista";
  const tr = def.config.trato;
  const sedes = sedesReales(def);
  const cercanas = useMemo(() => ciudadesCercanas(def), [def]);
  const nombres = useMemo(() => new Set(cercanas.map((c) => c.ciudad)), [cercanas]);

  // Qué está elegido, a partir de los datos (así funciona igual con un avance guardado).
  const sedeElegida = lista ? sedes.find((s) => datos.sede === s.id && datos.ciudad === ciudadSede(def, s)) : sedes.find((s) => datos.sede === s.id);
  const ciudadCercana = lista ? (datos.ciudad && nombres.has(datos.ciudad) ? datos.ciudad : undefined) : datos.sede === CIUDAD_OTRA && datos.ciudadOtra && nombres.has(datos.ciudadOtra) ? datos.ciudadOtra : undefined;
  const marcoOtra = lista ? datos.ciudad === CIUDAD_OTRA : datos.sede === CIUDAD_OTRA && !ciudadCercana;
  // "Otra ciudad" se queda abierta mientras se escribe, aunque el texto coincida con una ciudad de la lista.
  const [modoOtra, setModoOtra] = useState(marcoOtra);
  const otra = modoOtra || marcoOtra;
  const elegido = sedeElegida ? `sede:${sedeElegida.id}` : otra ? "otra" : ciudadCercana ? `cerca:${ciudadCercana}` : "";

  const [busqueda, setBusqueda] = useState("");
  const conBuscador = cercanas.length > MAX_SIN_BUSCADOR;
  const visibles = conBuscador && busqueda ? cercanas.filter((c) => normal(c.ciudad).includes(normal(busqueda))) : cercanas;

  const elegirSede = (id: string) => {
    setModoOtra(false);
    const s = sedes.find((x) => x.id === id)!;
    if (lista) cambiar("sede", id, { ciudad: ciudadSede(def, s), ciudadOtra: "" });
    else cambiar("sede", id, { ciudadOtra: "", sedeCercana: "" });
  };
  const elegirCercana = (ciudad: string, sede: string) => {
    setModoOtra(false);
    // La sede a la que asiste esa ciudad queda elegida; la persona puede cambiarla en la pregunta de abajo.
    if (lista) cambiar("ciudad", ciudad, { sede, ciudadOtra: "" });
    else cambiar("sede", CIUDAD_OTRA, { ciudadOtra: ciudad, sedeCercana: sede });
  };
  const elegirOtra = () => {
    setModoOtra(true);
    if (lista) cambiar("ciudad", CIUDAD_OTRA, { sede: "", ciudadOtra: "" });
    else cambiar("sede", CIUDAD_OTRA, { ciudadOtra: "", sedeCercana: "" });
  };

  // Pregunta de la sede: solo si no vive en una ciudad sede y hay más de una sede para elegir.
  const preguntaSede = !sedeElegida && (otra || !!ciudadCercana) && sedes.length > 1;
  const campoSede = lista ? "sede" : "sedeCercana";
  const sedeAsiste = lista ? datos.sede : datos.sedeCercana;
  const errorEleccion = errores.ciudad ?? (elegido ? undefined : errores.sede);
  const errorSede = lista ? (elegido ? errores.sede : undefined) : errores.sedeCercana;
  const etiqueta = preguntaDe(def, "sede").etiqueta;
  const tituloCercanas = plantilla(IU.ciudad.cercanas, { pais: def.config.nombre });

  const radio = (valor: string, alElegir: () => void) => (
    <input className="solo-lector" type="radio" name="ciudad-paso" value={valor} checked={elegido === valor} onChange={alElegir} />
  );

  return (
    <div className="campos ciudad-paso">
      <fieldset className="campo" data-campo={lista ? "ciudad" : "sede"} aria-describedby={errorEleccion ? "f-ciudad-error" : undefined}>
        <legend className="solo-lector">{etiqueta}</legend>
        <span className="lbl" aria-hidden="true">{IU.ciudad.sedes}</span>
        <div className="ciu-sedes">
          {sedes.map((s) => {
            const valor = `sede:${s.id}`;
            return (
              <label key={s.id} className={["ciu", elegido === valor ? "is-sel" : "", errorEleccion ? "is-error" : ""].filter(Boolean).join(" ")} data-track="ciudad_seleccionada" data-otra="false" data-pais={paisMed}>
                {radio(valor, () => elegirSede(s.id))}
                {ciudadSede(def, s)}
              </label>
            );
          })}
        </div>
        <span className="lbl ciu-sub" aria-hidden="true">{tituloCercanas}</span>
        {conBuscador ? (
          <div className="ciu-buscar">
            <Icono nombre="buscar" />
            <input type="search" className="input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={txt(IU.ciudad.buscar, tr)} aria-label={txt(IU.ciudad.buscar, tr)} aria-controls="ciu-lista" autoComplete="off" enterKeyHint="search" />
          </div>
        ) : null}
        <div id="ciu-lista" className={conBuscador ? "ciu-lista con-buscador" : "ciu-lista"}>
          {visibles.map((c) => {
            const valor = `cerca:${c.ciudad}`;
            return (
              <label key={c.ciudad} className={["op", elegido === valor ? "is-sel" : "", errorEleccion ? "is-error" : ""].filter(Boolean).join(" ")} data-track="ciudad_seleccionada" data-otra="true" data-pais={paisMed}>
                {radio(valor, () => elegirCercana(c.ciudad, c.sede))}
                <span className="ciu-marca" aria-hidden="true" />
                <span>{c.ciudad}</span>
              </label>
            );
          })}
          {conBuscador && !visibles.length ? <p className="ayuda ciu-vacio" role="status">{txt(IU.ciudad.sinResultados, tr)}</p> : null}
        </div>
        {/* "Otra ciudad" queda siempre a la vista (fuera de la lista con scroll), con borde punteado. */}
        <label className={["op", "ciu-otra", elegido === "otra" ? "is-sel" : "", errorEleccion ? "is-error" : ""].filter(Boolean).join(" ")} data-track="ciudad_seleccionada" data-otra="true" data-pais={paisMed}>
          {radio("otra", elegirOtra)}
          <span className="ciu-marca" aria-hidden="true" />
          <span>{lista ? plantilla(IU.otraCiudadDe, { pais: def.config.nombre }) : IU.otraCiudad}</span>
        </label>
        {errorEleccion ? <MensajeError id="f-ciudad-error">{errorEleccion}</MensajeError> : null}
      </fieldset>

      {otra ? (
        <div className="campo" data-campo="ciudadOtra">
          <label className="lbl" htmlFor="f-ciudadOtra">{preguntaDe(def, "ciudadOtra").etiqueta}</label>
          <input id="f-ciudadOtra" name="ciudadOtra" className={errores.ciudadOtra ? "input is-error" : "input"} type="text" autoComplete="address-level2" maxLength={80}
            value={datos.ciudadOtra ?? ""} onChange={(e) => cambiar("ciudadOtra", e.target.value)} aria-invalid={errores.ciudadOtra ? true : undefined} aria-describedby={errores.ciudadOtra ? "f-ciudadOtra-error" : undefined} />
          {errores.ciudadOtra ? <MensajeError id="f-ciudadOtra-error">{errores.ciudadOtra}</MensajeError> : null}
        </div>
      ) : null}

      {preguntaSede ? (
        <fieldset className="campo" data-campo={campoSede} aria-describedby={errorSede ? "f-sede-asiste-error" : undefined}>
          <legend className="lbl">{preguntaDe(def, "sedeCercana").etiqueta}</legend>
          <span className="ayuda" style={{ marginTop: -4 }}>{preguntaDe(def, "sedeCercana").ayuda}</span>
          <div className="ops-seg">
            {sedes.map((s) => (
              <label key={s.id} className={["op", "seg", sedeAsiste === s.id ? "is-sel" : "", errorSede ? "is-error" : ""].filter(Boolean).join(" ")}>
                <input type="radio" name={campoSede} value={s.id} checked={sedeAsiste === s.id} onChange={() => cambiar(campoSede, s.id)} />
                <span>{s.nombre}</span>
              </label>
            ))}
          </div>
          {errorSede ? <MensajeError id="f-sede-asiste-error">{errorSede}</MensajeError> : null}
        </fieldset>
      ) : null}
    </div>
  );
}
