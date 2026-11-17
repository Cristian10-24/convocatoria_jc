"use client";
// Filtros de la lista de inscritos (diseño 2027: AdminInscritos). Formulario GET: los filtros quedan en la URL (se
// pueden compartir y Atrás funciona). Con JavaScript se aplican al cambiar; los textos, con Enter o al salir del campo.
import Link from "next/link";
import { useRef, type FormEvent } from "react";
import Icono from "@/shared/ui/Icono";

type Opcion = { id: string; nombre: string };
type Props = {
  paises: Opcion[];
  sedes: { pais: string; id: string; nombre: string }[];
  ciudades: string[];
  alertas: Opcion[];
  valores: Partial<Record<"q" | "pais" | "sede" | "ciudad" | "vive" | "desde" | "hasta" | "menor" | "alerta" | "orden", string>>;
  hayFiltros: boolean;
};

const ACCION = "/admin/inscritos";

export default function FiltrosInscritos({ paises, sedes, ciudades, alertas, valores: v, hayFiltros }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const enviar = () => form.current?.requestSubmit();
  const alCambiar = (e: FormEvent<HTMLFormElement>) => {
    const el = e.target as HTMLInputElement;
    if (el.name === "pais" && form.current) {
      const sede = form.current.elements.namedItem("sede") as HTMLSelectElement | null;
      if (sede) sede.value = "";
    }
    if (el.name !== "q" && el.name !== "ciudad") enviar();
  };
  const alSalir = (nombre: "q" | "ciudad") => (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== (v[nombre] ?? "")) e.target.form?.requestSubmit();
  };
  const sedesVisibles = v.pais ? sedes.filter((s) => s.pais === v.pais) : sedes;

  return (
    <form ref={form} className="caja i-filtros" action={ACCION} method="get" role="search" aria-label="Filtros de inscritos" onChange={alCambiar}>
      <div className="campo i-buscar">
        <label className="lbl" htmlFor="i-q">Buscar</label>
        <span className="i-buscar-caja">
          <Icono nombre="buscar" />
          <input id="i-q" name="q" type="search" className="input input-sm" placeholder="Nombre, documento, correo o número de inscripción" defaultValue={v.q ?? ""}
            maxLength={80} autoComplete="off" enterKeyHint="search" onBlur={alSalir("q")} />
        </span>
      </div>
      <div className="i-rejilla">
        {paises.length > 1 ? (
          <div className="campo">
            <label className="lbl" htmlFor="i-pais">País</label>
            <select id="i-pais" name="pais" className="input input-sm" defaultValue={v.pais ?? ""}>
              <option value="">Todos</option>
              {paises.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        ) : null}
        <div className="campo">
          <label className="lbl" htmlFor="i-sede">Sede</label>
          <select id="i-sede" name="sede" className="input input-sm" defaultValue={v.sede ?? ""}>
            <option value="">Todas</option>
            {sedesVisibles.map((s) => <option key={`${s.pais}-${s.id}`} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-ciu">Ciudad</label>
          <input id="i-ciu" name="ciudad" className="input input-sm" placeholder="Cualquiera" list="i-ciudades" defaultValue={v.ciudad ?? ""} maxLength={80} autoComplete="off" onBlur={alSalir("ciudad")} />
          <datalist id="i-ciudades">{ciudades.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-vive">Sede u otra ciudad</label>
          <select id="i-vive" name="vive" className="input input-sm" defaultValue={v.vive ?? ""}>
            <option value="">Todas</option>
            <option value="sede">Vive en ciudad sede</option>
            <option value="otra">Vive en otra ciudad</option>
          </select>
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-des">Desde</label>
          <input id="i-des" name="desde" type="date" className="input input-sm" defaultValue={v.desde ?? ""} />
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-has">Hasta</label>
          <input id="i-has" name="hasta" type="date" className="input input-sm" defaultValue={v.hasta ?? ""} />
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-menor">Menor de edad</label>
          <select id="i-menor" name="menor" className="input input-sm" defaultValue={v.menor ?? ""}>
            <option value="">Todas</option>
            <option value="si">Solo menores</option>
            <option value="no">Solo mayores</option>
          </select>
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-alerta">Alerta</label>
          <select id="i-alerta" name="alerta" className="input input-sm" defaultValue={v.alerta ?? ""}>
            <option value="">Todas</option>
            {alertas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label className="lbl" htmlFor="i-orden">Orden</label>
          <select id="i-orden" name="orden" className="input input-sm" defaultValue={v.orden ?? "recientes"}>
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="apellido">Apellido (A–Z)</option>
          </select>
        </div>
      </div>
      <button type="submit" className="solo-lector">Aplicar filtros</button>
      {hayFiltros ? <Link className="btn btn-texto i-limpiar" href={ACCION}>Limpiar filtros</Link> : null}
    </form>
  );
}
