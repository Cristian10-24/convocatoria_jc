// Lista de inscritos (diseño 2027: AdminInscritos, AdminInscritosFiltrados): paginada en el servidor, con búsqueda,
// filtros en la URL y exportación con esos mismos filtros. El alcance por país se aplica en cada consulta.
import Link from "next/link";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import Icono from "@/shared/ui/Icono";
import RefrescoAutomatico from "@/shared/ui/RefrescoAutomatico";
import { ALERTAS } from "../../config/alertas";
import { TEXTO_FILTRO_ALERTA, TEXTOS_PANEL as T, TAM_PAGINA, ZONAS } from "../../config/panel";
import { CONFIG_PAISES } from "../../config/paises";
import { listarInscritos } from "../../panel/consultas";
import { aQuery, hayFiltros, type AlcancePanel, type Filtros } from "../../panel/filtros";
import { nombreCiudad, nombreSede, nombreTipoDocumento, textoAlerta } from "../../panel/presentacion";
import FiltrosInscritos from "./FiltrosInscritos";
import "./tablero.css";
import "./inscritos.css";

// "always": en español, Intl no separa los miles de 4 cifras por defecto.
const formato = new Intl.NumberFormat("es", { useGrouping: "always" });
// Cada fila en la hora de su país.
const fecha = (iso: string, zona: string) =>
  new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: zona }).format(new Date(iso));
const ORDEN_TEXTO = { recientes: "más recientes", antiguos: "más antiguos", apellido: "apellido (A–Z)" } as const;

type Props = { alcance: AlcancePanel; filtros: Filtros; puedeExportar: boolean };

export default async function ListaInscritos({ alcance, filtros, puedeExportar }: Props) {
  const { filas, total, pagina, paginas } = await listarInscritos(alcance, filtros);
  const exportar = (tipo: "xlsx" | "csv") => {
    const q = aQuery({ ...filtros, pagina: 1 });
    return `/api/admin/exportar${q ? `${q}&` : "?"}formato=${tipo}`;
  };
  const sedes = alcance.paises.flatMap((p) => CONFIG_PAISES[p].sedes.map((s) => ({ pais: p, id: s.id, nombre: s.nombre })));
  const ciudades = [...new Set(alcance.paises.flatMap((p) => CONFIG_PAISES[p].sedes.flatMap((s) => s.ciudades)))].sort((a, b) => a.localeCompare(b, "es"));
  const alertas = [
    { id: "con", nombre: TEXTO_FILTRO_ALERTA.con },
    { id: "sin", nombre: TEXTO_FILTRO_ALERTA.sin },
    ...Object.entries(ALERTAS).map(([id, nombre]) => ({ id, nombre: nombre.split(" (")[0]! })),
  ];
  const desde = total ? (pagina - 1) * TAM_PAGINA + 1 : 0;
  const hasta = Math.min(total, pagina * TAM_PAGINA);
  const filtrado = hayFiltros(filtros);

  return (
    <>
      <RefrescoAutomatico />
      <div className="t-cab">
        <div>
          <h1>{T.inscritos}</h1>
          <p>{T.actualizado}</p>
        </div>
        {puedeExportar && total > 0 ? (
          <div className="i-exportar">
            <a className="btn btn-primario" href={exportar("xlsx")} download>
              <Icono nombre="descargar" />
              {T.exportarExcel}
            </a>
            <a className="btn btn-borde" href={exportar("csv")} download>{T.exportarCsv}</a>
          </div>
        ) : null}
      </div>

      <FiltrosInscritos paises={alcance.paises.map((p) => ({ id: p, nombre: NOMBRE_PAIS[p] }))} sedes={sedes} ciudades={ciudades} alertas={alertas}
        valores={{ q: filtros.q, pais: filtros.pais, sede: filtros.sede, ciudad: filtros.ciudad, vive: filtros.vive, desde: filtros.desde, hasta: filtros.hasta, menor: filtros.menor, alerta: filtros.alerta, orden: filtros.orden }}
        hayFiltros={filtrado} />

      <div className="i-resumen" role="status">
        <span>
          <b>{formato.format(total)}</b> {total === 1 ? "inscrito" : "inscritos"}
          {filtrado ? " con estos filtros" : ""}
          {paginas > 1 ? ` · página ${pagina} de ${paginas} · ${TAM_PAGINA} por página` : ""}
        </span>
        <span>Orden: {ORDEN_TEXTO[filtros.orden]}</span>
      </div>

      {filas.length === 0 ? (
        <div className="caja estado vacio">
          <Icono nombre="documento" />
          <h2 className="h-caja">{filtrado ? "Ninguna inscripción coincide" : "Todavía no hay inscripciones"}</h2>
          <p className="t-vacio">{filtrado ? "Prueba con menos filtros o limpia la búsqueda." : "Cuando alguien se inscriba en tus países, aparecerá aquí."}</p>
          {filtrado ? <Link className="btn btn-borde btn-sm" href="/admin/inscritos">Limpiar filtros</Link> : null}
        </div>
      ) : (
        <div className="caja i-tabla">
          <div className="tbl-marco" tabIndex={0} role="region" aria-label="Lista de inscritos">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Documento</th>
                  <th scope="col">País · sede</th>
                  <th scope="col">Ciudad</th>
                  <th scope="col">Edad</th>
                  <th scope="col">Inscripción</th>
                  <th scope="col">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td className="i-nombre">
                      <Link className="enlace-fila" href={`/admin/inscritos/${f.id}`}>{f.apellidos}, {f.nombres}</Link>
                      <span className="sub-celda">{f.radicado}</span>
                    </td>
                    <td>
                      {f.documento}
                      <span className="sub-celda">{nombreTipoDocumento(f.pais, f.tipoDocumento)}</span>
                    </td>
                    <td>{NOMBRE_PAIS[f.pais]} · {f.sede ? nombreSede(f.pais, f.sede) : "sin sede"}</td>
                    <td>
                      <span className="i-ciudad">
                        {nombreCiudad(f)} <span className={f.enSede ? "chip mini t-sede" : "chip mini t-otra"}>{f.enSede ? "sede" : "otra ciudad"}</span>
                      </span>
                    </td>
                    <td className="i-num">
                      {f.edad} {f.menor ? <span className="chip mini c-info">menor</span> : null}
                    </td>
                    <td className="i-num">{fecha(f.creadoEn, ZONAS[f.pais].iana)}</td>
                    <td>
                      <span className="i-alertas">
                        {f.alertas.map((a) => (
                          <span key={a} className="i-alerta">{textoAlerta(a).split(" (")[0]}</span>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 0 ? (
        <nav className="i-paginas" aria-label="Páginas">
          <span>Mostrando {formato.format(desde)}–{formato.format(hasta)} de {formato.format(total)}</span>
          <span className="i-paginas-b">
            {pagina > 1 ? (
              <Link className="btn btn-borde btn-sm" href={`/admin/inscritos${aQuery(filtros, { pagina: pagina - 1 })}`}>{T.anterior}</Link>
            ) : (
              <span className="btn btn-sm" aria-disabled="true">{T.anterior}</span>
            )}
            {pagina < paginas ? (
              <Link className="btn btn-borde btn-sm" href={`/admin/inscritos${aQuery(filtros, { pagina: pagina + 1 })}`}>{T.siguiente}</Link>
            ) : (
              <span className="btn btn-sm" aria-disabled="true">{T.siguiente}</span>
            )}
          </span>
        </nav>
      ) : null}
    </>
  );
}
