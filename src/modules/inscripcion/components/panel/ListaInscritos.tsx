// Lista de inscritos: paginada en el servidor, con búsqueda, filtros en la URL y exportación con esos filtros.
import Link from "next/link";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import RefrescoAutomatico from "@/shared/ui/RefrescoAutomatico";
import { TEXTOS_PANEL as T, ZONAS } from "../../config/panel";
import { listarInscritos } from "../../panel/consultas";
import { aQuery, type AlcancePanel, type Filtros } from "../../panel/filtros";
import { nombreCiudad, nombreSede, nombreTipoDocumento, textoAlerta } from "../../panel/presentacion";
import FormFiltros from "./FormFiltros";
import s from "./Panel.module.css";

const formato = new Intl.NumberFormat("es");
// Cada fila en la hora de su país.
const fecha = (iso: string, zona: string) =>
  new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: zona }).format(new Date(iso));

type Props = { alcance: AlcancePanel; filtros: Filtros; puedeExportar: boolean };

export default async function ListaInscritos({ alcance, filtros, puedeExportar }: Props) {
  const { filas, total, pagina, paginas } = await listarInscritos(alcance, filtros);
  const varios = alcance.paises.length > 1;
  const exportar = (formato: "xlsx" | "csv") => {
    const q = aQuery({ ...filtros, pagina: 1 });
    return `/api/admin/exportar${q ? `${q}&` : "?"}formato=${formato}`;
  };

  return (
    <div className={s.raiz}>
      <RefrescoAutomatico />
      <div className={s.encabezado}>
        <div>
          <h1 className={s.titulo}>{T.inscritos}</h1>
          <p className={s.subtitulo}>{T.actualizado}</p>
        </div>
        {puedeExportar && total > 0 && (
          <div className={s.botones}>
            <a className={s.boton} href={exportar("xlsx")} download>
              {T.exportarExcel}
            </a>
            <a className={s.botonSecundario} href={exportar("csv")} download>
              {T.exportarCsv}
            </a>
          </div>
        )}
      </div>

      <FormFiltros filtros={filtros} paises={alcance.paises} accion="/admin/inscritos" completo />

      <div className={s.resumenLista}>
        <span>
          <b>{formato.format(total)}</b> {total === 1 ? "inscrito" : "inscritos"}
          {paginas > 1 && ` · página ${pagina} de ${paginas}`}
        </span>
      </div>

      {filas.length === 0 ? (
        <p className={s.vacio}>{T.sinDatos}</p>
      ) : (
        <div className={s.marcoTabla}>
          <table className={s.tabla}>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Documento</th>
                <th scope="col">{varios ? "País · sede" : "Sede"}</th>
                <th scope="col">Ciudad</th>
                <th scope="col">Edad</th>
                <th scope="col">Inscripción</th>
                <th scope="col">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/admin/inscritos/${f.id}`}>
                      {f.apellidos}, {f.nombres}
                    </Link>
                    <span className={s.secundario}>{f.radicado}</span>
                  </td>
                  <td className={s.mono}>
                    {f.documento}
                    <span className={s.secundario}>{nombreTipoDocumento(f.pais, f.tipoDocumento)}</span>
                  </td>
                  <td>{varios ? `${NOMBRE_PAIS[f.pais]} · ${nombreSede(f.pais, f.sede)}` : nombreSede(f.pais, f.sede)}</td>
                  <td>{nombreCiudad(f)}</td>
                  <td className={s.mono}>
                    {f.edad}
                    {f.menor && <span className={`${s.etiqueta} ${s.etiquetaMenor}`}> menor</span>}
                  </td>
                  <td className={s.mono}>{fecha(f.creadoEn, ZONAS[f.pais].iana)}</td>
                  <td>
                    {f.alertas.map((a) => (
                      <span key={a} className={s.etiqueta} title={textoAlerta(a)}>
                        {textoAlerta(a).split(" (")[0]}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav className={s.paginacion} aria-label="Páginas">
          <Link className={`${s.botonSecundario} ${pagina <= 1 ? s.deshabilitado : ""}`} href={`/admin/inscritos${aQuery(filtros, { pagina: pagina - 1 })}`} aria-disabled={pagina <= 1}>
            {T.anterior}
          </Link>
          <span>
            {pagina} / {paginas}
          </span>
          <Link className={`${s.botonSecundario} ${pagina >= paginas ? s.deshabilitado : ""}`} href={`/admin/inscritos${aQuery(filtros, { pagina: pagina + 1 })}`} aria-disabled={pagina >= paginas}>
            {T.siguiente}
          </Link>
        </nav>
      )}
    </div>
  );
}
