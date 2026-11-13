// Tablero: cifras clave y gráficas de las inscripciones dentro del alcance del usuario.
// Los datos sensibles (género, poblaciones, ingresos) se muestran solo agregados: así los puede ver cualquier rol.
import { NOMBRE_PAIS } from "@/shared/config/paises";
import RefrescoAutomatico from "@/shared/ui/RefrescoAutomatico";
import { TEXTOS_PANEL as T } from "../../config/panel";
import { estadisticas, paisesConsultados } from "../../panel/consultas";
import type { AlcancePanel, Filtros } from "../../panel/filtros";
import { seriesTablero } from "../../panel/tablero";
import FormFiltros from "./FormFiltros";
import { GraficaBarras, GraficaDias } from "./Graficas";
import MapaCalor from "./MapaCalor";
import s from "./Panel.module.css";

const formato = new Intl.NumberFormat("es");
const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)} % del total` : "—");

export default async function Tablero({ alcance, filtros }: { alcance: AlcancePanel; filtros: Filtros }) {
  const e = await estadisticas(alcance, filtros);
  const g = seriesTablero(e);
  const paises = paisesConsultados(alcance, filtros);
  const ambito = alcance.paises.length === 0 ? "Sin países asignados" : paises.map((p) => NOMBRE_PAIS[p]).join(", ") || "—";

  return (
    <div className={s.raiz}>
      <RefrescoAutomatico />
      <div className={s.encabezado}>
        <div>
          <h1 className={s.titulo}>{T.tablero}</h1>
          <p className={s.subtitulo}>
            {ambito} · {T.actualizado}
          </p>
        </div>
      </div>

      <FormFiltros filtros={filtros} paises={alcance.paises} accion="/admin" />

      <div className={s.kpis}>
        <div className={`${s.kpi} ${s.kpiPrincipal}`}>
          <span>{T.total}</span>
          <strong>{formato.format(e.total)}</strong>
        </div>
        <div className={s.kpi}>
          <span>{T.hoy}</span>
          <strong>{formato.format(e.hoy)}</strong>
        </div>
        <div className={s.kpi}>
          <span>{T.semana}</span>
          <strong>{formato.format(e.semana)}</strong>
        </div>
        <div className={s.kpi}>
          <span>{T.menores}</span>
          <strong>{formato.format(e.menores)}</strong>
          <small>{pct(e.menores, e.total)}</small>
        </div>
        <div className={s.kpi}>
          <span>{T.conAlertas}</span>
          <strong>{formato.format(e.conAlertas)}</strong>
          <small>{pct(e.conAlertas, e.total)}</small>
        </div>
      </div>

      {e.total === 0 ? (
        <p className={s.vacio}>{T.sinDatos}</p>
      ) : (
        <>
          <div className={s.rejilla}>
            <GraficaDias datos={g.porDia} zona={e.zona} />
            {g.porPais.length > 1 && <GraficaBarras titulo="Por país" datos={g.porPais} />}
            <GraficaBarras titulo="Por sede" datos={g.porSede} />
            <GraficaBarras titulo="Por ciudad de residencia" datos={g.porCiudad} nota="las 20 con más inscritos" max={20} />
            <MapaCalor datos={g.porHora} />
          </div>

          <h2 className={s.seccion}>Requisitos y disponibilidad</h2>
          <div className={s.rejilla}>
            <GraficaBarras titulo="Alertas (requisitos no cumplidos)" datos={g.alertas} />
            <GraficaBarras titulo="Horas semanales disponibles" datos={g.horas} />
            <GraficaBarras titulo="Acceso a computadora" datos={g.computadora} />
            <GraficaBarras titulo="Acceso a internet" datos={g.internet} />
          </div>

          <h2 className={s.seccion}>Perfil</h2>
          <div className={s.rejilla}>
            <GraficaBarras titulo="Edad" datos={g.edad} max={20} />
            <GraficaBarras titulo="Grado o situación educativa" datos={g.grado} />
            <GraficaBarras titulo="Ocupación" datos={g.ocupacion} nota="respuesta múltiple" />
            <GraficaBarras titulo="Género" datos={g.genero} />
            <GraficaBarras titulo="Poblaciones" datos={g.poblaciones} nota="respuesta múltiple" />
            <GraficaBarras titulo="Ingresos del hogar" datos={g.ingresos} />
            <GraficaBarras titulo="Talla de camiseta" datos={g.talla} />
          </div>

          <h2 className={s.seccion}>Difusión</h2>
          <div className={s.rejilla}>
            <GraficaBarras titulo="¿Cómo se enteró?" datos={g.canal} />
            <GraficaBarras titulo="Origen del enlace (utm_source)" datos={g.utm} />
            <GraficaBarras titulo="Ranking de embajadores" datos={g.embajadores} nota="nombre escrito por la persona" />
          </div>
        </>
      )}
    </div>
  );
}
