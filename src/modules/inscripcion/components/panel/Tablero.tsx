// Tablero (diseño 2027: Admin, AdminTableroMovil, AdminCoordTablero): cifras clave y gráficas de las inscripciones
// dentro del alcance del usuario. Los datos sensibles (género, poblaciones, ingresos) se muestran solo sumados: así
// los puede ver cualquier rol.
import { NOMBRE_PAIS } from "@/shared/config/paises";
import Icono from "@/shared/ui/Icono";
import RefrescoAutomatico from "@/shared/ui/RefrescoAutomatico";
import { TEXTOS_PANEL as T, ZONAS } from "../../config/panel";
import { CONFIG_PAISES } from "../../config/paises";
import { estadisticas, paisesConsultados } from "../../panel/consultas";
import { hayFiltros, type AlcancePanel, type Filtros } from "../../panel/filtros";
import { seriesTablero } from "../../panel/tablero";
import FiltrosTablero from "./FiltrosTablero";
import { GraficaDias, ListaBarras, Ranking, SedeVsOtra } from "./Graficas";
import MapaCalor from "./MapaCalor";
import "./tablero.css";

// "always": en español, Intl no separa los miles de 4 cifras por defecto (3006); el diseño pide 3.006.
const formato = new Intl.NumberFormat("es", { useGrouping: "always" });
const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)} % del total` : "—");
const CIUDAD_ZONA: Record<string, string> = { "America/Bogota": "Bogotá", "America/Panama": "Panamá", "America/Guayaquil": "Guayaquil", "America/Montevideo": "Montevideo" };

function variacion(semana: number, anterior: number): string {
  if (!anterior) return semana ? "sin datos de la semana anterior" : "—";
  const v = Math.round(((semana - anterior) / anterior) * 100);
  return `${v > 0 ? "+" : ""}${v} % vs. semana anterior`;
}

/** "Colombia, Panamá y Uruguay" */
const unir = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);

export default async function Tablero({ alcance, filtros }: { alcance: AlcancePanel; filtros: Filtros }) {
  const e = await estadisticas(alcance, filtros);
  const g = seriesTablero(e);
  const paises = paisesConsultados(alcance, filtros);
  const nombres = paises.map((p) => NOMBRE_PAIS[p]);
  const ambito = alcance.paises.length === 0 ? "Sin países asignados" : unir(nombres) || "—";
  const zona = CIUDAD_ZONA[e.zona] ?? (paises.length === 1 ? ZONAS[paises[0]!].iana : e.zona);
  const sedes = alcance.paises.flatMap((p) => CONFIG_PAISES[p].sedes.map((s) => ({ pais: p, id: s.id, nombre: s.nombre })));
  const ciudades = [...new Set(alcance.paises.flatMap((p) => CONFIG_PAISES[p].sedes.flatMap((s) => s.ciudades)))].sort((a, b) => a.localeCompare(b, "es"));
  const varios = new Set(e.porPais.map((p) => p.id)).size > 1;

  return (
    <>
      <RefrescoAutomatico />
      <div className="t-cab">
        <div>
          <h1>{T.tablero}</h1>
          <p>{ambito} · Se actualiza solo cada 30 segundos · hora de {zona}</p>
        </div>
      </div>

      <FiltrosTablero accion="/admin" paises={alcance.paises.map((p) => ({ id: p, nombre: NOMBRE_PAIS[p] }))} sedes={sedes} ciudades={ciudades}
        valores={{ pais: filtros.pais, sede: filtros.sede, ciudad: filtros.ciudad, desde: filtros.desde, hasta: filtros.hasta }} hayFiltros={hayFiltros(filtros)} />

      <div className="t-kpis">
        <div className="kpi oscuro">
          <b>{T.total}</b>
          <strong>{formato.format(e.total)}</strong>
          <small>{paises.length === 4 ? "Los 4 países" : ambito}</small>
        </div>
        <div className="kpi">
          <b>{T.hoy}</b>
          <strong>{formato.format(e.hoy)}</strong>
          <small>desde las 00:00</small>
        </div>
        <div className="kpi">
          <b>{T.semana}</b>
          <strong>{formato.format(e.semana)}</strong>
          <small>{variacion(e.semana, e.semanaAnterior)}</small>
        </div>
        <div className="kpi">
          <b>{T.menores}</b>
          <strong>{formato.format(e.menores)}</strong>
          <small>{pct(e.menores, e.total)}</small>
        </div>
        <div className="kpi">
          <b>{T.conAlertas}</b>
          <strong>{formato.format(e.conAlertas)}</strong>
          <small>{pct(e.conAlertas, e.total)}</small>
        </div>
      </div>

      {e.total === 0 ? (
        <div className="caja estado vacio">
          <Icono nombre="info" />
          <p className="t-vacio">{T.sinDatos}</p>
        </div>
      ) : (
        <>
          <GraficaDias datos={g.porDia} />

          <section className="t-seccion" aria-labelledby="s-donde">
            <h2 id="s-donde">Dónde están</h2>
            <div className="t-rejilla">
              {varios ? <ListaBarras titulo="Por país" datos={g.porPais} tono="azul" /> : null}
              <ListaBarras titulo="Por sede" datos={g.porSede} tono="naranja" />
              <SedeVsOtra datos={e.sedeVsOtra} />
              <ListaBarras titulo="Por ciudad de residencia" nota="las 10 con más inscritos" datos={g.porCiudad} tono="durazno" total={e.total} />
              <MapaCalor datos={g.porHora} />
            </div>
          </section>

          <section className="t-seccion" aria-labelledby="s-requisitos">
            <h2 id="s-requisitos">Requisitos y disponibilidad</h2>
            <div className="t-rejilla">
              <ListaBarras titulo="Alertas" nota="requisitos no cumplidos" datos={g.alertas} tono="alerta" total={e.total} />
              <ListaBarras titulo="Horas semanales disponibles" datos={g.horas} tono="naranja" />
              <ListaBarras titulo="Acceso a computador" datos={g.computadora} tono="naranja" />
              <ListaBarras titulo="Acceso a internet" datos={g.internet} tono="naranja" />
            </div>
          </section>

          <section className="t-seccion" aria-labelledby="s-perfil">
            <h2 id="s-perfil">Perfil</h2>
            <p className="t-nota-sensible">
              <Icono nombre="escudo" />
              Género, poblaciones e ingresos se muestran solo sumados. El detalle por persona es exclusivo de administración.
            </p>
            <div className="t-rejilla">
              <ListaBarras titulo="Edad" nota="al inscribirse" datos={g.edad} tono="azul" />
              <ListaBarras titulo="Grado o situación educativa" datos={g.grado} tono="naranja" />
              <ListaBarras titulo="Ocupación" nota="respuesta múltiple" datos={g.ocupacion} tono="durazno" total={e.total} />
              <ListaBarras titulo="Género" nota="sumado" datos={g.genero} tono="info" />
              <ListaBarras titulo="Poblaciones" nota="sumado · respuesta múltiple" datos={g.poblaciones} tono="info" total={e.total} />
              <ListaBarras titulo="Ingresos del hogar" nota="sumado" datos={g.ingresos} tono="info" />
              <ListaBarras titulo="Talla de camiseta" datos={g.talla} tono="azul" />
            </div>
          </section>

          <section className="t-seccion" aria-labelledby="s-difusion">
            <h2 id="s-difusion">Difusión</h2>
            <div className="t-rejilla">
              <ListaBarras titulo="¿Cómo se enteró?" datos={g.canal} tono="naranja" />
              <ListaBarras titulo="Origen del enlace" nota="utm_source" datos={g.utm} tono="azul" />
              <Ranking titulo="Ranking de embajadores" nota="nombre o código escrito por la persona" datos={g.embajadores} />
            </div>
          </section>
        </>
      )}
    </>
  );
}
