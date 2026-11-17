// Página del formulario de un país (componente de servidor, estática). Carga SOLO la definición de ese país y se
// la pasa al formulario, que es único. Según CONVOCATORIA_CONFIG (leída al construir) muestra el formulario, "muy
// pronto", "cerradas" o mantenimiento. La API vuelve a revisar el estado en cada envío, así que un HTML viejo en
// caché no permite inscribirse fuera de plazo.
import type { Metadata } from "next";
import { estadoConvocatoria, etapaDe } from "@/shared/config/convocatoria";
import { entorno } from "@/shared/config/env";
import { CODIGO_MEDICION, NOMBRE_PAIS, PAISES, SEGMENTO_URL, type PaisSlug } from "@/shared/config/paises";
import Bandera from "@/shared/ui/Bandera";
import Icono from "@/shared/ui/Icono";
import PantallaSistema from "@/shared/ui/PantallaSistema";
import ProveedorMovimiento from "@/shared/ui/ProveedorMovimiento";
import { IU } from "../config/interfaz";
import { plantilla, txt } from "../config/textos";
import { cargarDefinicion } from "../paises/cargar";
import { Cerradas } from "./Formulario";
import FormularioCliente from "./FormularioCliente";
import EnlacePais from "./EnlacePais";
import "./formulario.css";

const anioDe = (convocatoria: string) => /(\d{4})/.exec(convocatoria)?.[1] ?? "";

export function metadataInscripcion(pais: PaisSlug | null): Metadata {
  const anio = anioDe(entorno().CONVOCATORIA_ID);
  return {
    title: pais ? `Inscripción · Jóvenes creaTIvos ${anio} · ${NOMBRE_PAIS[pais]}` : `Inscripción · Jóvenes creaTIvos ${anio}`,
    description: pais ? `Formulario de inscripción a Jóvenes creaTIvos en ${NOMBRE_PAIS[pais]}.` : "Formulario de inscripción a Jóvenes creaTIvos.",
    robots: { index: false, follow: false },
  };
}

/** Encabezado de las pantallas sin formulario (muy pronto, cerradas, paso 0). */
function Cabecera({ anio, pais, volver }: { anio: string; pais?: PaisSlug; volver: string }) {
  return (
    <header className="fh">
      <div className="wrap fw">
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <a href={volver} className="foco" style={{ display: "block", flex: "none" }} aria-label={IU.volver}><img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={58} height={52} style={{ display: "block", height: 52, width: "auto" }} /></a>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{plantilla(IU.titulo, { anio })}</span>
            {pais ? <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "hsl(231.9 20.2% 41.8%)" }}><span className="bd"><Bandera pais={pais} /></span>{NOMBRE_PAIS[pais]}</span> : null}
          </span>
        </div>
        <a className="btn btn-ter btn-sm" href={volver} aria-label={IU.volver}><Icono nombre="flecha-atras" tam={20} /><span className="vt">{IU.volver}</span></a>
      </div>
    </header>
  );
}

export default async function PaginaInscripcion({ pais }: { pais: PaisSlug }) {
  const env = entorno();
  const anio = anioDe(env.CONVOCATORIA_ID);
  const rutaLanding = `/${SEGMENTO_URL[pais]}`;
  const { estado } = estadoConvocatoria(pais);
  const etapa = etapaDe(pais);

  if (estado === "mantenimiento") return <PantallaSistema tipo="mantenimiento" pais={NOMBRE_PAIS[pais]} inicio={rutaLanding} />;

  // Si la definición de este país no carga, solo este país muestra el aviso (ya quedó en el log).
  const def = await cargarDefinicion(pais);
  if (!def) return <PantallaSistema tipo="error" pais={NOMBRE_PAIS[pais]} inicio={rutaLanding} />;

  if (estado === "abierta" && def.config.habilitado) {
    return (
      <ProveedorMovimiento>
        <FormularioCliente def={def} anio={anio} claveTurnstile={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} rutaLanding={rutaLanding} paisMed={CODIGO_MEDICION[pais]} etapa={etapa} />
      </ProveedorMovimiento>
    );
  }

  return (
    <div className="jc fpg" data-pais={CODIGO_MEDICION[pais]}>
      <Cabecera anio={anio} pais={pais} volver={rutaLanding} />
      <main className="wrap fw fcol" style={{ justifyContent: "center" }}>
        {estado === "cerrada" ? (
          <Cerradas def={def} anio={anio} rutaLanding={rutaLanding} etapa={etapa} />
        ) : (
          <section className="fcard centro" style={{ alignItems: "flex-start", textAlign: "left" }} aria-labelledby="t-pronto">
            <span style={{ width: 64, height: 64, borderRadius: "50%", background: "hsl(218.8 68% 95.1%)", color: "hsl(221.2 71.2% 42.2%)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="reloj" tam={30} /></span>
            <h1 id="t-pronto" className="ft">{plantilla(IU.pronto.titulo, { pais: def.config.nombre, etapa })}</h1>
            <p className="fs" style={{ margin: 0 }}>{plantilla(txt(IU.pronto.cuerpo, def.config.trato), { pais: def.config.nombre })}</p>
            <a className="btn btn-sec btn-lg" href={rutaLanding}>{IU.volver}</a>
          </section>
        )}
      </main>
    </div>
  );
}

/**
 * Paso 0 (/inscripcion): elegir país. Solo enlaza a la página de cada país; no carga ninguna definición, así que
 * no depende de ningún país en particular. Un país que no está abierto se muestra con su estado y lleva a su landing.
 */
export function PaginaPaises() {
  const anio = anioDe(entorno().CONVOCATORIA_ID);
  const orden: PaisSlug[] = ["col", "ecu", "pan", "uy"];
  return (
    <div className="jc fpg" data-pais="sin_definir">
      <Cabecera anio={anio} volver="/" />
      <div className="wrap fw fprog">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontSize: 14 }}>
          <span style={{ fontWeight: 700 }}>{IU.paso0.progreso}</span><span style={{ color: "hsl(231.9 20.2% 41.8%)" }}>{IU.tiempo}</span>
        </div>
        <div className="fprog-b" role="progressbar" aria-label={IU.progresoAria} aria-valuemin={0} aria-valuemax={9} aria-valuenow={0}><div style={{ transform: "scaleX(0.03)" }} /></div>
      </div>
      <div className="wrap fw fcol">
        <main className="fcard entra">
          <h1 className="ft">{IU.paso0.titulo}</h1>
          <p className="fs">{IU.paso0.descripcion}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {orden.filter((p) => PAISES.includes(p)).map((p) => {
              const { estado } = estadoConvocatoria(p);
              const abierta = estado === "abierta";
              return (
                <EnlacePais key={p} href={abierta ? `/inscripcion/${SEGMENTO_URL[p]}` : `/${SEGMENTO_URL[p]}`} conOrigen={abierta} paisMed={CODIGO_MEDICION[p]}>
                  <span className="bd"><Bandera pais={p} /></span>
                  <span>{NOMBRE_PAIS[p]}{abierta ? null : <small>{IU.paso0.estado[estado]}</small>}</span>
                  <Icono nombre="flecha" clase="fl" />
                </EnlacePais>
              );
            })}
          </div>
          <p className="ayuda" style={{ marginTop: 16 }}>{IU.paso0.ayuda}</p>
        </main>
        <aside className="lado" aria-label={IU.tuInscripcion}>
          <div className="lado-i">
            <span><Icono nombre="birrete" /><span><strong>{IU.lateral.gratis}</strong> {IU.lateral.gratisTexto}</span></span>
            <span><Icono nombre="escudo" /><span>{IU.lateral.confidencial}</span></span>
          </div>
        </aside>
      </div>
    </div>
  );
}
