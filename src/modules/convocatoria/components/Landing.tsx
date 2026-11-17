// Landing 2027: una sola plantilla para la principal (sin país) y para los 4 países, en sus estados abierta,
// muy pronto y cerrada (mantenimiento muestra la pantalla de sistema). Componente de servidor: la página sale
// estática (○) y no lee Mongo ni cookies. El estado se lee de CONVOCATORIA_CONFIG al construir.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { estadoConvocatoria, etapaDe, etapaMayuscula, finDelCierre, leerConfigEntorno } from "@/shared/config/convocatoria";
import { CODIGO_MEDICION, NOMBRE_PAIS, type PaisSlug } from "@/shared/config/paises";
import { CONTACTO } from "@/shared/config/sitio";
import Bandera from "@/shared/ui/Bandera";
import Icono from "@/shared/ui/Icono";
import ProveedorMovimiento from "@/shared/ui/ProveedorMovimiento";
import PantallaSistema from "@/shared/ui/PantallaSistema";
import { destinoInscripcion, rutaFormulario } from "../content/acciones";
import ConservarUtm from "./ConservarUtm";
import {
  ACERCA, ALIADOS_PENDIENTES, BENEFICIOS, MOSTRAR_ALIADOS, CIERRE_PRIMERA_ETAPA, COHORTE, IMPACTO, INCLUYE, MOSTRAR_PENDIENTES, ORDEN_PAISES, PAISES, REDES, preguntas,
  comoFunciona, diapositivas, fechaLarga, galeria, noIncluye, requisitos, rutas, testimoniosPara,
  type EstadoLanding, type Foto, type IconoLanding,
} from "../content/contenido";
import { AvisoApertura, Cifra, ComoFunciona, Galeria, Hero, Nav, Reloj, Requisitos, Revelar, Testimonios, Tramo, type Enlace } from "./Interactivos";
import "./landing.css";

/** Trazos de los iconos de la landing (24 × 24, línea de 1.6 px). */
const TRAZO: Record<IconoLanding, string> = {
  portatil: "M5.5 6h13a1 1 0 0 1 1 1v8.5h-15V7a1 1 0 0 1 1-1zM2.5 18.5h19",
  personas: "M9 11.7a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM2.8 19.5c.5-3.4 3-5.3 6.2-5.3s5.7 1.9 6.2 5.3M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.8 14.6c1.9.7 3.1 2.4 3.4 4.9",
  corazon: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z",
  microfono: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3",
  ubicacion: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
  birrete: "M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11v5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5",
  calendario: "M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V8A1.5 1.5 0 0 1 5 6.5zM3.5 10.5h17M8 4.5v4M16 4.5v4",
  reloj: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
};
const ICONO_BENEFICIO: Record<string, ReactNode> = {
  certificado: <><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" /></>,
  personas: <><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19.5c.5-3.4 3-5.3 6.2-5.3s5.7 1.9 6.2 5.3M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.8 14.6c1.9.7 3.1 2.4 3.4 4.9" /></>,
  corazon: <path d={TRAZO.corazon} />,
  charla: <><path d="M4 5.5h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4A1.5 1.5 0 0 1 2.5 13V7A1.5 1.5 0 0 1 4 5.5z" /><path d="M16.5 9.5H20a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-1v3l-4-3h-3" /></>,
};
const ICONO_RED: Record<string, ReactNode> = {
  Instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><path d="M16.8 7.2v.1" /></>,
  YouTube: <><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="M10.5 9.5l4 2.5-4 2.5z" /></>,
  LinkedIn: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 10.5v6M8 7.5v.1M11.5 16.5v-6M11.5 13a2.3 2.3 0 0 1 4.5 0v3.5" /></>,
};

/** Foto con versión de 800 px para celular y medidas reservadas (la página no salta al cargar). */
function Img({ f, className, sizes, carga = "lazy" }: { f: Foto; className?: string; sizes: string; carga?: "lazy" | "eager" }) {
  return <img className={className} src={f.src800} srcSet={`${f.src800} 800w, ${f.src} ${f.ancho}w`} sizes={sizes} alt={f.alt} width={f.ancho} height={f.alto} loading={carga} decoding="async" style={f.pos ? { objectPosition: f.pos } : undefined} />;
}

const DESCRIPCION = "Beca del 100 % para aprender desarrollo de software desde cero, con mentoría y acompañamiento. Jóvenes creaTIvos 2027 · Fundación ROFÉ.";

export function metadataLanding(pais: PaisSlug | null): Metadata {
  const titulo = pais ? `Convocatoria Jóvenes creaTIvos 2027 · ${NOMBRE_PAIS[pais]}` : "Convocatoria Jóvenes creaTIvos 2027";
  const ruta = pais ? PAISES[pais].ruta : "/";
  const portada = pais ? `/convocatoria/${PAISES[pais].pre}/hero-800.webp` : "/convocatoria/ecu/hero-800.webp";
  return {
    title: titulo, description: DESCRIPCION, alternates: { canonical: ruta }, robots: { index: true, follow: true },
    openGraph: { title: titulo, description: DESCRIPCION, url: ruta, images: [{ url: portada, width: 800 }], locale: "es", type: "website" },
  };
}

export default function Landing({ pais: slug }: { pais: PaisSlug | null }) {
  const pais = slug ? PAISES[slug] : null;
  const entorno = slug ? leerConfigEntorno()[slug] : undefined;
  const config = slug ? estadoConvocatoria(slug) : { estado: "abierta" as const, cierra: undefined };

  if (pais && config.estado === "mantenimiento") {
    return <PantallaSistema tipo="mantenimiento" pais={pais.nombre} inicio={pais.ruta} />;
  }
  // La principal no depende de ningún país: siempre invita a inscribirse (el paso 0 muestra qué país está abierto).
  const estado: EstadoLanding = config.estado === "abierta" ? "abierta" : config.estado === "cerrada" ? "cerrada" : "pronto";
  const abierta = estado === "abierta";
  const voz = pais?.voz ?? PAISES.col.voz;
  const paisMed = slug ? CODIGO_MEDICION[slug] : "sin_definir";
  const configEntorno = leerConfigEntorno();
  // Fecha de cierre: la configurada; sin ella, solo Uruguay tiene una por defecto. Los demás no muestran fecha.
  const cierreDe = (p: PaisSlug) => configEntorno[p]?.cierra ?? (p === "uy" ? CIERRE_PRIMERA_ETAPA : undefined);
  const cierra = slug ? cierreDe(slug) : undefined;
  const etapa = slug ? etapaDe(slug, configEntorno) : "inscripciones";
  // Landing principal: solo nombra los países abiertos de verdad (con su etapa y su fecha).
  const abiertos = slug ? [] : ORDEN_PAISES.filter((p) => estadoConvocatoria(p, { entorno: configEntorno }).estado === "abierta");
  const etapasAbiertas = [...new Set(abiertos.map((p) => etapaDe(p, configEntorno)))];
  const etapaPrincipal = etapasAbiertas.length === 1 ? etapasAbiertas[0]! : "inscripciones";
  const listaNombres = (ps: PaisSlug[]) => ps.map((p) => PAISES[p].nombre).join(", ").replace(/, ([^,]*)$/, " y $1");
  const textoAbiertas = abiertos.length ? `${etapaMayuscula(etapaPrincipal)} abiertas en ${listaNombres(abiertos)}.` : "Inscripciones 2027 muy pronto.";
  const fechaPrincipal = abiertos.map((p) => ({ p, cierra: cierreDe(p) })).find((x) => x.cierra);

  /** Botón principal según el estado: inscribirse, dejar el correo o ir a las redes. */
  const cta = (ubicacion: string): Enlace & { texto: string; track: string } =>
    abierta ? { ...destinoInscripcion(slug, ubicacion, entorno), texto: "Inscribirme", track: "cta_inscribirme" }
    : estado === "pronto" ? { href: "#aviso", texto: `${voz.avisame} cuando abran`, track: "cta_avisame" }
    : { href: "#redes", texto: "Ver redes", track: "cta_redes" };
  const attrs = (e: Enlace) => (e.nuevaPestana ? { href: e.href, target: "_blank", rel: "noopener" } : { href: e.href });
  const enlaceCta = (ubicacion: string, clase: string, flecha = false) => {
    const c = cta(ubicacion);
    return <a className={clase} {...attrs(c)} data-track={c.track} data-ubicacion={ubicacion} data-pais={paisMed}>{c.texto}{flecha ? <Icono nombre="flecha" clase="fl" /> : null}</a>;
  };

  const slides = diapositivas(pais, estado, etapa, textoAbiertas);
  const pieHero = estado === "pronto" && slug ? <AvisoApertura pais={slug} paisMed={paisMed} avisame={voz.avisame} />
    : estado === "cerrada" ? <div><a className="btn btn-ter-b btn-lg" href="#redes" data-track="cta_redes" data-ubicacion="hero" data-pais={paisMed}>Entérate en redes de la próxima etapa</a></div>
    : undefined;
  const lasRutas = rutas(voz);
  const [ruta1, ruta2, ruta3] = [lasRutas[0]!, lasRutas[1]!, lasRutas[2]!];
  const total = lasRutas.reduce((s, r) => s + r.semanas, 0);
  const pct = (n: number) => `${((n / total) * 100).toFixed(2)}%`;
  const ctaReq = cta("requisitos");

  return (
    <ProveedorMovimiento>
      {/* Sin JavaScript no hay animación de entrada: todo queda visible. */}
      <noscript><style>{".jcm .rv{opacity:1!important;transform:none!important}"}</style></noscript>
      <ConservarUtm />
      <div className="jc jcm">
        <Nav subtitulo={pais?.nombre} cta={cta("nav")} paisMed={paisMed} />

        <main>
          <Hero diapositivas={slides} ctas={abierta ? slides.map((_, k) => destinoInscripcion(slug, `hero_slide_${k + 1}`, entorno)) : undefined} pie={pieHero} paisMed={paisMed} />

          {!pais ? (
            <section id="paises" className="pp" aria-labelledby="t-paises">
              <div className="wrap g">
                <Revelar como="h2" id="t-paises" className="h3 pp-t">Inscríbete <span className="ac">desde tu país</span></Revelar>
                <Revelar className="pp-l" d={1}>
                  {ORDEN_PAISES.map((k) => {
                    // País abierto: directo a su formulario (con el origen); si no, a su landing (muy pronto o cerrada).
                    const abiertoK = estadoConvocatoria(k, { entorno: configEntorno }).estado === "abierta";
                    const href = abiertoK ? `${rutaFormulario(k)}?origen=landing_principal&ubicacion=franja_paises` : PAISES[k].ruta;
                    return (
                      <a key={k} className="pb foco" href={href} data-track={abiertoK ? "cta_inscribirme" : "cta_pais"} data-ubicacion="franja_paises" data-pais={CODIGO_MEDICION[k]}>
                        <span className="bd"><Bandera pais={k} /></span>{PAISES[k].nombre}
                        <small>{abiertoK ? "Inscribirme" : "Ver convocatoria"}<Icono nombre="flecha" /></small>
                      </a>
                    );
                  })}
                </Revelar>
              </div>
            </section>
          ) : null}

          {pais && slug && abierta && cierra ? (
            <div className="cierre">
              <div className="wrap cierre-in">
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="bd"><Bandera pais={slug} /></span>
                  <span>Las {etapa} en {pais.nombre} cierran el <strong>{fechaLarga(cierra)}</strong></span>
                </span>
                <Reloj finMs={finDelCierre(cierra)} etiqueta={`Tiempo para el cierre de las ${etapa}`} />
              </div>
            </div>
          ) : null}

          <section id="impacto" className="sec">
            <div className="wrap">
              <Revelar className="g sh"><h2 className="h2">Impacto <span className="ac">regional</span></h2><p className="lead">{IMPACTO.texto}</p></Revelar>
              <div className="g imp">
                <Revelar como="img" className="imp-f" src={IMPACTO.foto.src800} srcSet={`${IMPACTO.foto.src800} 800w, ${IMPACTO.foto.src} ${IMPACTO.foto.ancho}w`} sizes="(max-width: 1000px) 100vw, 824px" alt={IMPACTO.foto.alt} width={IMPACTO.foto.ancho} height={IMPACTO.foto.alto} loading="lazy" />
                <Revelar className="imp-n osc" d={2}>
                  <div><Cifra hasta={IMPACTO.jovenes} prefijo="+" /><p>Jóvenes creaTIvos</p></div>
                  <div><Cifra hasta={IMPACTO.paises} minimo={1} /><p>países: Colombia, Ecuador, Uruguay y Panamá</p></div>
                </Revelar>
              </div>
            </div>
          </section>

          <section id="rutas" className="sec gris">
            <div className="wrap">
              <Revelar className="g sh"><h2 className="h2">Rutas de <span className="ac">aprendizaje</span></h2><p className="lead">Programa diseñado para empezar desde cero, con mentoría y acompañamiento continuo.</p></Revelar>

              <Revelar role="img" aria-label={`Línea de tiempo: ${lasRutas.map((r) => `${r.titulo}, ${r.semanas} semanas`).join("; ")}`}>
                <div className="lt-b">
                  <Tramo g={0} style={{ flex: 3, background: "hsl(33.2 86.2% 74.5%)" }} />
                  <Tramo g={1} style={{ flex: 3, background: "hsl(31.8 92.7% 56.9%)" }} />
                  <Tramo g={2} style={{ flex: 23, background: "hsl(231.9 77.1% 20.6%)" }} />
                </div>
                <div className="lt-e"><span style={{ flex: 3 }}>3 sem.</span><span style={{ flex: 3 }}>3 sem.</span><span style={{ flex: 23 }}>23 semanas</span></div>
              </Revelar>

              {[ruta1, ruta2].map((r, k) => (
                <Revelar key={r.titulo} como="article" className="g ruta" style={k === 0 ? { marginTop: 24 } : undefined}>
                  <div className="ruta-t" aria-hidden="true"><Tramo style={{ left: k === 0 ? 0 : pct(ruta1.semanas), width: pct(r.semanas), background: k === 0 ? "hsl(33.2 86.2% 74.5%)" : "hsl(31.8 92.7% 56.9%)" }} /></div>
                  <div className="ruta-s"><p className="sem"><b>{r.semanas}</b>semanas</p><p className="sem-n">{r.nota}</p></div>
                  <div className="ruta-c">
                    <h3 className="h3">{r.titulo}</h3>
                    <p className="txt">{r.texto}</p>
                    <ul className="temas">{r.temas.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                  <Img f={r.foto} className="ruta-f" sizes="(max-width: 760px) 100vw, 320px" />
                </Revelar>
              ))}

              <Revelar como="article" className="g ruta-g osc">
                <Img f={ruta3.foto} sizes="(max-width: 1000px) 100vw, 520px" />
                <div>
                  <p className="sem"><b>{ruta3.semanas}</b>semanas</p>
                  <div className="ruta-t" aria-hidden="true"><Tramo style={{ left: pct(ruta1.semanas + ruta2.semanas), width: pct(ruta3.semanas), background: "hsl(31.8 92.7% 56.9%)" }} /></div>
                  <p className="sem-n">{ruta3.nota}</p>
                  <h3 className="h3">{ruta3.titulo}</h3>
                  <p className="txt">{ruta3.texto}</p>
                  <ul className="temas">{ruta3.temas.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </Revelar>

              <Revelar style={{ marginTop: 56 }}>{enlaceCta("rutas", "btn btn-pri btn-lg", true)}</Revelar>
            </div>
          </section>

          <section id="como-funciona" className="sec cf osc">
            <ComoFunciona
              titulo={<>8 meses que combinan <span className="ac">lo virtual y lo presencial</span></>}
              items={comoFunciona(pais).map((c) => ({ titulo: c.titulo, texto: c.texto, icono: TRAZO[c.icono], foto: c.foto }))}
            >
              <Revelar className="cf-h">
                {pais ? (
                  // País: su etapa y su fecha solo si la tiene; si no ha abierto, "Muy pronto" y el aviso.
                  <div>
                    <span>{etapaMayuscula(etapa)}</span>
                    <b>{cierra && estado !== "pronto" ? `Hasta el ${fechaLarga(cierra)}` : estado === "pronto" ? "Muy pronto" : estado === "cerrada" ? "Cerradas" : "Abiertas"}</b>
                    {estado === "pronto" ? <a className="cf-aviso" href="#aviso" data-track="cta_avisame" data-ubicacion="fechas_clave" data-pais={paisMed}>{voz.avisame} cuando abran</a> : null}
                  </div>
                ) : fechaPrincipal ? (
                  <div><span>{etapaMayuscula(etapaDe(fechaPrincipal.p, configEntorno))} en {PAISES[fechaPrincipal.p].nombre}</span><b>Hasta el {fechaLarga(fechaPrincipal.cierra!)}</b></div>
                ) : (
                  <div><span>Inscripciones 2027</span><b>Muy pronto</b></div>
                )}
                <div><span>Inicio del programa</span><b>{COHORTE.inicio}</b></div>
                <div><span>Cierre y graduación</span><b>{COHORTE.fin}</b></div>
              </Revelar>
            </ComoFunciona>
          </section>

          {!pais ? (
            <section id="beneficios" className="sec">
              <div className="wrap">
                <Revelar className="g sh"><h2 className="h2">Beneficios de ser <span className="ac">Joven creaTIvo</span></h2><p className="lead">{BENEFICIOS.texto}</p></Revelar>
                <div className="g">
                  <Revelar className="bt bt-beca osc">
                    <span className="cifra">100 %</span>
                    <h3 className="h3">{BENEFICIOS.beca.titulo}</h3>
                    <p className="txt">{BENEFICIOS.beca.texto}</p>
                  </Revelar>
                  <Revelar className="bt bt-vis" d={1}>
                    <Img f={BENEFICIOS.visitas.foto} sizes="(max-width: 760px) 100vw, 300px" />
                    <div><h3>{BENEFICIOS.visitas.titulo}</h3><p className="txt">{BENEFICIOS.visitas.texto}</p></div>
                  </Revelar>
                  {BENEFICIOS.otros.map((b, k) => (
                    <Revelar key={b.titulo} className={`bt ${b.clase}`} d={k + 2}>
                      <svg className="i" viewBox="0 0 24 24" aria-hidden="true">{ICONO_BENEFICIO[b.icono]}</svg>
                      <h3>{b.titulo}</h3><p className="txt">{b.texto}</p>
                    </Revelar>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section id="requisitos" className="sec gris">
            <div className="wrap">
              <Revelar className="g sh"><h2 className="h2">{voz.necesitas}<span className="ac">para aplicar?</span></h2><p className="lead">Buscamos personas curiosas y apasionadas por la tecnología, con disposición para aprender y crecer.</p></Revelar>
              <div className="g" style={{ alignItems: "start" }}>
                <Requisitos
                  items={requisitos(pais).map((r) => ({ clave: r.clave, texto: r.texto, icono: TRAZO[r.icono], pendiente: MOSTRAR_PENDIENTES ? r.pendiente : undefined }))}
                  cta={{ ...ctaReq, texto: abierta ? voz.quiero : ctaReq.texto }} paisMed={paisMed}
                  textos={{ marca: voz.marca, cumples: voz.cumples, todo: voz.todo }}
                />
                <div className="rq-as">
                  {!pais ? (
                    <Revelar className="caja" d={1}>
                      <h3 className="h3" style={{ fontSize: 24 }}>El detalle cambia <span className="ac">según tu país</span></h3>
                      <div>
                        {ORDEN_PAISES.map((k) => (
                          <a key={k} className="pl foco" href={PAISES[k].ruta} data-track="cta_pais" data-ubicacion="requisitos" data-pais={CODIGO_MEDICION[k]}>
                            <span className="bd"><Bandera pais={k} /></span>
                            <span><b>{PAISES[k].nombre}</b><span className="d">{PAISES[k].gradoCorto}</span></span>
                            <Icono nombre="flecha" />
                          </a>
                        ))}
                      </div>
                    </Revelar>
                  ) : (
                    <>
                      <Revelar className="caja" d={1}>
                        <h3 className="h3" style={{ fontSize: 24 }}>Qué <span className="ac">incluye</span></h3>
                        <ul className="inc">{INCLUYE.map((t) => <li key={t}><span className="si"><Icono nombre="visto" /></span>{t}</li>)}</ul>
                      </Revelar>
                      <Revelar className="caja" d={2}>
                        <h3 className="h3" style={{ fontSize: 24 }}>Qué no incluye</h3>
                        <ul className="inc">{noIncluye(pais).map((t) => <li key={t}><span className="no"><Icono nombre="equis" /></span>{t}</li>)}</ul>
                      </Revelar>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="galeria" className="sec">
            <div className="wrap">
              <Revelar className="g sh">
                <h2 className="h2">{pais ? "Así se vive en " : "Así se vive "}<span className="ac">{pais ? pais.nombre : "el programa"}</span></h2>
                <p className="lead">Fotos reales de la cohorte 2026. {voz.pasa} las fotos con las flechas o {voz.elige} una miniatura.</p>
              </Revelar>
              <Galeria fotos={galeria(pais)} paisMed={paisMed} />
            </div>
          </section>

          <section id="acerca" className="sec gris">
            <div className="wrap g" style={{ alignItems: "start" }}>
              <Revelar className="ac-a">
                <h2 className="h2">Acerca <span className="ac">del programa</span></h2>
                {ACERCA.parrafos.map((t) => <p key={t} className="ac-p">{t}</p>)}
              </Revelar>
              <Revelar como="ol" className="ac-m" d={2} aria-label="Los cinco módulos">{ACERCA.modulos.map((t) => <li key={t}>{t}</li>)}</Revelar>
              <Revelar como="img" className="ac-f" src={ACERCA.foto.src800} srcSet={`${ACERCA.foto.src800} 800w, ${ACERCA.foto.src} ${ACERCA.foto.ancho}w`} sizes="(max-width: 1344px) 100vw, 1248px" alt={ACERCA.foto.alt} width={ACERCA.foto.ancho} height={ACERCA.foto.alto} loading="lazy" />
            </div>
          </section>

          <section id="testimonios" className="sec">
            <Testimonios lista={testimoniosPara(pais).map((t) => ({ nombre: t.nombre, ciudad: t.ciudad, youtubeId: t.youtubeId }))} pendientes={MOSTRAR_PENDIENTES} />
          </section>

          {MOSTRAR_ALIADOS ? (
            <section id="aliados" style={{ padding: "0 0 120px" }}>
              <Revelar className="wrap">
                <div style={{ borderTop: "1px solid hsl(231.9 22.4% 90.4%)", paddingTop: 64 }}>
                  <h2 className="h3">Aliados</h2>
                  <div className="ali">{ALIADOS_PENDIENTES.map((a, k) => <span key={k}>{a}</span>)}</div>
                </div>
              </Revelar>
            </section>
          ) : null}

          <section id="preguntas" className="sec gris faq">
            <div className="wrap g" style={{ alignItems: "start" }}>
              <Revelar como="h2" className="h2" style={{ gridColumn: "1 / 6" }}>Preguntas <span className="ac">frecuentes</span></Revelar>
              <Revelar className="faq-l" d={1}>
                {preguntas(pais).map((f) => (
                  <details key={f.q}><summary>{f.q}<Icono nombre="mas" /></summary><p className="txt">{f.a}</p></details>
                ))}
              </Revelar>
            </div>
          </section>
        </main>

        <div className="fijo-m">{enlaceCta("sticky_movil", "btn btn-pri")}</div>

        <PieSitio pais={slug} cta={enlaceCta("footer", "btn btn-pri")} />
      </div>
    </ProveedorMovimiento>
  );
}

/** Pie del sitio (redes, legales, acceso al panel). Lo comparten todas las landings, también la de Uruguay 2027. */
export function PieSitio({ pais, cta }: { pais: PaisSlug | null; cta?: ReactNode }) {
  return (
  <footer className="pie osc">
    <div className="wrap">
      <div className="g pie-g" style={{ alignItems: "start" }}>
        <div style={{ gridColumn: "1 / 6", display: "flex", flexDirection: "column", gap: 28, alignItems: "flex-start" }}>
          {cta}
        </div>
        <nav className="pie-c" aria-label="Pie de página" style={{ gridColumn: "7 / 9" }}><b>Programa</b><a href="#inicio">Inicio</a><a href="#acerca">Acerca de</a><a href="#testimonios">Testimonios</a><a href="#preguntas">Preguntas frecuentes</a></nav>
        <nav className="pie-c" aria-label="Legal" style={{ gridColumn: "9 / 11" }}><b>Legal</b><a href="/terminos">Términos</a><a href={pais ? `/privacidad?pais=${PAISES[pais].ruta.slice(1)}` : "/privacidad"}>Política de privacidad</a><a href={`mailto:${CONTACTO.correo}`}>Contacto</a></nav>
        <div id="redes" className="pie-c" style={{ gridColumn: "11 / 13" }}><b>Redes</b>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {REDES.map((r) => (
              <a key={r.nombre} className="rb rb-o" href={r.url ?? "#redes"} aria-label={r.url ? `${r.nombre} de la Fundación ROFÉ (se abre en una pestaña nueva)` : `${r.nombre} (enlace pendiente)`} {...(r.url ? { target: "_blank", rel: "noopener" } : {})}>
                <svg className="i" viewBox="0 0 24 24" aria-hidden="true">{ICONO_RED[r.nombre]}</svg>
              </a>
            ))}
          </div>
          {MOSTRAR_PENDIENTES && REDES.some((r) => !r.url) ? <span className="falta" style={{ alignSelf: "flex-start", marginTop: 10, fontSize: 13 }}>[ENLACES DE REDES]</span> : null}
        </div>
      </div>
      <div className="pie-b"><span>Copyright © {new Date().getFullYear()} Fundación ROFÉ · Toca una Vida · Todos los derechos reservados</span><a href="/admin/login">Acceso administradores</a></div>
    </div>
  </footer>
  );
}
