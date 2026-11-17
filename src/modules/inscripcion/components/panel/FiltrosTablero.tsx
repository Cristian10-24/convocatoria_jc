"use client";
// Filtros del tablero (diseño 2027): país en botones, sede, ciudad y fechas. Es un formulario GET (los filtros quedan
// en la URL); con JavaScript se aplica solo al cambiar un valor, sin botón. Solo ofrece los países del alcance.
import Link from "next/link";
import { useRef, type FormEvent } from "react";

type Props = {
  accion: string;
  paises: { id: string; nombre: string }[];
  sedes: { pais: string; id: string; nombre: string }[];
  ciudades: string[];
  valores: { pais?: string; sede?: string; ciudad?: string; desde?: string; hasta?: string };
  hayFiltros: boolean;
};

export default function FiltrosTablero({ accion, paises, sedes, ciudades, valores: v, hayFiltros }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const enviar = () => form.current?.requestSubmit();
  // El texto de la ciudad se aplica al salir del campo o con Enter; lo demás, al cambiar.
  const alCambiar = (e: FormEvent<HTMLFormElement>) => {
    const el = e.target as HTMLInputElement;
    if (el.name === "pais" && form.current) {
      const sede = form.current.elements.namedItem("sede") as HTMLSelectElement | null;
      if (sede) sede.value = "";
    }
    if (el.name !== "ciudad") enviar();
  };
  const sedesVisibles = v.pais ? sedes.filter((s) => s.pais === v.pais) : sedes;
  return (
    <form ref={form} className="caja t-filtros" action={accion} method="get" role="search" aria-label="Filtros del tablero" onChange={alCambiar}>
      {paises.length > 1 ? (
        <fieldset className="campo f-pais">
          <legend className="lbl">País</legend>
          <div className="seg-grupo">
            {[{ id: "", nombre: "Todos" }, ...paises].map((p) => (
              <label key={p.id || "todos"} className={(v.pais ?? "") === p.id ? "op seg is-sel" : "op seg"}>
                <input type="radio" name="pais" value={p.id} defaultChecked={(v.pais ?? "") === p.id} />
                {p.nombre}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="campo f-corto">
        <label className="lbl" htmlFor="t-sede">Sede</label>
        <select id="t-sede" name="sede" className="input input-sm" defaultValue={v.sede ?? ""}>
          <option value="">Todas</option>
          {sedesVisibles.map((s) => (
            <option key={`${s.pais}-${s.id}`} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>
      <div className="campo f-corto">
        <label className="lbl" htmlFor="t-ciu">Ciudad</label>
        <input id="t-ciu" name="ciudad" className="input input-sm" placeholder="Cualquiera" list="t-ciudades" defaultValue={v.ciudad ?? ""}
          maxLength={80} autoComplete="off" onBlur={(e) => e.target.value !== (v.ciudad ?? "") && enviar()} />
        <datalist id="t-ciudades">
          {ciudades.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="campo f-fecha">
        <label className="lbl" htmlFor="t-des">Desde</label>
        <input id="t-des" name="desde" className="input input-sm" type="date" defaultValue={v.desde ?? ""} />
      </div>
      <div className="campo f-fecha">
        <label className="lbl" htmlFor="t-has">Hasta</label>
        <input id="t-has" name="hasta" className="input input-sm" type="date" defaultValue={v.hasta ?? ""} />
      </div>
      {/* Sin JavaScript (o con Enter en la ciudad) se aplica con este botón; con JavaScript queda solo para lectores. */}
      <button type="submit" className="solo-lector">Aplicar filtros</button>
      {hayFiltros ? <Link className="btn btn-texto t-limpiar" href={accion}>Limpiar filtros</Link> : null}
    </form>
  );
}
