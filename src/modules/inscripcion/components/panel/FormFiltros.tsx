// Filtros del tablero y de la lista. Formulario GET simple: los filtros quedan en la URL (se pueden compartir y
// el botón Atrás funciona) y no hace falta JavaScript. Solo ofrece los países que el usuario puede ver.
import Link from "next/link";
import { NOMBRE_PAIS, type PaisSlug } from "@/shared/config/paises";
import { ALERTAS } from "../../config/alertas";
import { TEXTO_FILTRO_ALERTA, TEXTOS_PANEL as T } from "../../config/panel";
import { CONFIG_PAISES } from "../../config/paises";
import { hayFiltros, type Filtros } from "../../panel/filtros";
import s from "./Panel.module.css";

type Props = { filtros: Filtros; paises: readonly PaisSlug[]; accion: string; completo?: boolean };

export default function FormFiltros({ filtros: f, paises, accion, completo = false }: Props) {
  const ciudades = [...new Set(paises.flatMap((p) => CONFIG_PAISES[p].sedes.flatMap((sd) => sd.ciudades)))].sort((a, b) => a.localeCompare(b, "es"));
  return (
    <form className={s.filtros} action={accion} method="get" role="search">
      {completo && (
        <div className={`${s.campo} ${s.campoAncho}`}>
          <label htmlFor="f-q">Buscar</label>
          <input id="f-q" name="q" type="search" defaultValue={f.q ?? ""} placeholder={T.buscar} maxLength={80} />
        </div>
      )}
      {paises.length > 1 && (
        <div className={s.campo}>
          <label htmlFor="f-pais">País</label>
          <select id="f-pais" name="pais" defaultValue={f.pais ?? ""}>
            <option value="">Todos</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {NOMBRE_PAIS[p]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={s.campo}>
        <label htmlFor="f-sede">Sede</label>
        <select id="f-sede" name="sede" defaultValue={f.sede ?? ""}>
          <option value="">Todas</option>
          {paises.map((p) => (
            <optgroup key={p} label={NOMBRE_PAIS[p]}>
              {CONFIG_PAISES[p].sedes.map((sd) => (
                <option key={`${p}-${sd.id}`} value={sd.id}>
                  {sd.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className={s.campo}>
        <label htmlFor="f-ciudad">Ciudad</label>
        <input id="f-ciudad" name="ciudad" list="f-ciudades" defaultValue={f.ciudad ?? ""} maxLength={80} autoComplete="off" />
        <datalist id="f-ciudades">
          {ciudades.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className={s.campo}>
        <label htmlFor="f-desde">Desde</label>
        <input id="f-desde" name="desde" type="date" defaultValue={f.desde ?? ""} />
      </div>
      <div className={s.campo}>
        <label htmlFor="f-hasta">Hasta</label>
        <input id="f-hasta" name="hasta" type="date" defaultValue={f.hasta ?? ""} />
      </div>
      {completo && (
        <>
          <div className={s.campo}>
            <label htmlFor="f-menor">Edad</label>
            <select id="f-menor" name="menor" defaultValue={f.menor ?? ""}>
              <option value="">Todas</option>
              <option value="si">Menores de edad</option>
              <option value="no">Mayores de edad</option>
            </select>
          </div>
          <div className={s.campo}>
            <label htmlFor="f-alerta">Alertas</label>
            <select id="f-alerta" name="alerta" defaultValue={f.alerta ?? ""}>
              <option value="">Todas</option>
              <option value="con">{TEXTO_FILTRO_ALERTA.con}</option>
              <option value="sin">{TEXTO_FILTRO_ALERTA.sin}</option>
              {Object.entries(ALERTAS).map(([codigo, texto]) => (
                <option key={codigo} value={codigo}>
                  {texto}
                </option>
              ))}
            </select>
          </div>
          <div className={s.campo}>
            <label htmlFor="f-orden">Orden</label>
            <select id="f-orden" name="orden" defaultValue={f.orden}>
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="apellido">Apellido (A–Z)</option>
            </select>
          </div>
        </>
      )}
      <div className={s.botones}>
        <button className={s.boton} type="submit">
          {T.filtrar}
        </button>
        {hayFiltros(f) && (
          <Link className={s.enlaceSuave} href={accion}>
            {T.limpiar}
          </Link>
        )}
      </div>
    </form>
  );
}
