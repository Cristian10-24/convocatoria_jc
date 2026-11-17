// Landing de Uruguay 2027 (diseño entregado en HTML, portado a Next). Fuente: landing-uy-2027/ (no se versiona).
// - Componente de servidor: la página sale estática (○). El estado, la etapa y la fecha de cierre salen de
//   CONVOCATORIA_CONFIG al construir (no del CONFIG de app.js).
// - CSS aislado en uy2027.css (todo cuelga de .uy27 y las clases llevan prefijo uy-).
// - Menú y pie son los del sitio; el comportamiento (tarjetas, cuenta regresiva, galería, requisitos, preguntas,
//   videos, partículas y el botón fijo de abajo) está en ComportamientoUy2027.
// - Volver a la landing anterior: LANDING_URUGUAY_2027 = false en content/contenido.ts.
import type { CSSProperties, ReactNode } from "react";
import { DESFASE_PAIS, estadoConvocatoria, etapaDe, etapaMayuscula, finDelCierre, leerConfigEntorno } from "@/shared/config/convocatoria";
import { CODIGO_MEDICION } from "@/shared/config/paises";
import Bandera from "@/shared/ui/Bandera";
import PantallaSistema from "@/shared/ui/PantallaSistema";
import { destinoInscripcion } from "../content/acciones";
import { CIERRE_PRIMERA_ETAPA, PAISES, fechaLarga } from "../content/contenido";
import { PieSitio } from "../components/Landing";
import { Nav } from "../components/Interactivos";
import ComportamientoUy2027 from "./ComportamientoUy2027";
import ConservarUtm from "../components/ConservarUtm";
import "../components/landing.css";
import "./uy2027.css";

const HORAS = 8;
const TITULO: Array<{ texto: string; naranja?: boolean }> = [
  { texto: "¡Convertite en" }, { texto: "desarrollador de software", naranja: true }, { texto: "desde cero y gratis!" },
];

/** Variable CSS en un style (TypeScript no las acepta en CSSProperties). */
const v = (nombre: string, valor: string) => ({ [nombre]: valor }) as CSSProperties;

/** Foto de la carpeta public/convocatoria/uy-2027, con versión de 800 px para celular. */
const F = (nombre: string) => `/convocatoria/uy-2027/${nombre}-800.webp`;
const S = (nombre: string) => `/convocatoria/uy-2027/${nombre}-800.webp 800w, /convocatoria/uy-2027/${nombre}.webp 1600w`;
const TAM: Record<string, string> = {
  hero: "(max-width: 960px) 100vw, 560px",
  "galeria-1": "(max-width: 600px) 100vw, 50vw",
  cierre: "(max-width: 1200px) 100vw, 1136px",
};

/** Trazos del fondo del inicio (mismo dibujo que app.js, calculado en el servidor). */
function trazos(cantidad: number): ReactNode {
  const paths = Array.from({ length: cantidad }, (_, k) => {
    const i = k * 2;
    const d = `M-${380 - i * 6} -${189 + i * 7}C-${380 - i * 6} -${189 + i * 7} -${312 - i * 6} ${216 - i * 7} ${152 - i * 6} ${343 - i * 7}C${616 - i * 6} ${470 - i * 7} ${684 - i * 6} ${875 - i * 7} ${684 - i * 6} ${875 - i * 7}`;
    return <path key={k} d={d} stroke="currentColor" strokeWidth={(0.7 + i * 0.05).toFixed(2)} strokeOpacity={(0.08 + i * 0.018).toFixed(3)} />;
  });
  return <svg viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">{paths}</svg>;
}

/** Título con cada palabra en su span (entran una tras otra). */
function tituloPorPalabras(partes: typeof TITULO): ReactNode {
  let n = 0;
  return partes.map((p, k) => (
    <span key={k} className={p.naranja ? "uy-naranja" : undefined}>
      {p.texto.split(/\s+/).map((palabra) => {
        const i = n++;
        return <span key={i}><span className="uy-palabra" style={v("--i", String(i))}>{palabra}</span> </span>;
      })}
    </span>
  ));
}

function Miniatura({ id, nombre }: { id: string; nombre: string }) {
  return (
    <div className="uy-videoMarco">
      <button type="button" className="uy-videoBoton" aria-label={`Mirá el testimonio de ${nombre}`} data-video-boton="">
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} />
        <span className="uy-play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></span>
      </button>
    </div>
  );
}

export default function LandingUy2027() {
  const entorno = leerConfigEntorno();
  const config = estadoConvocatoria("uy", { entorno });
  if (config.estado === "mantenimiento") return <PantallaSistema tipo="mantenimiento" pais="Uruguay" inicio={PAISES.uy.ruta} />;
  const abierta = config.estado === "abierta";
  const cierra = entorno.uy?.cierra ?? CIERRE_PRIMERA_ETAPA;
  const etapaM = etapaMayuscula(etapaDe("uy", entorno));
  const fechaCierre = fechaLarga(cierra);
  const textos = abierta ? { chip: `${etapaM} abiertas`, franja: `${etapaM} abiertas` }
    : config.estado === "cerrada" ? { chip: `${etapaM} cerradas`, franja: `Las ${etapaM.toLowerCase()} de esta convocatoria ya cerraron` }
    : { chip: `${etapaM} muy pronto`, franja: `Las ${etapaM.toLowerCase()} abren muy pronto` };
  const conCuenta = abierta && !!cierra;
  const paisMed = CODIGO_MEDICION.uy;
  // Menú del sitio: "Inscribirme" al formulario si está abierta; si no, a los requisitos de la misma página.
  const ctaNav = abierta ? { ...destinoInscripcion("uy", "nav", entorno.uy), texto: "Inscribirme", track: "cta_inscribirme" } : { href: "#requisitos", texto: "Ver requisitos", track: "cta_requisitos" };

  /** Botón de postular: abierta → al formulario de Uruguay (misma pestaña); si no, se ve pero no lleva a ningún lado. */
  const postular = (clase: string, ubicacion: string, children: ReactNode) => {
    const ubic = ubicacion.replace("postular-", "");
    if (abierta) {
      const d = destinoInscripcion("uy", ubic, entorno.uy);
      return <a className={clase} href={d.href} {...(d.nuevaPestana ? { target: "_blank", rel: "noopener" } : {})} data-track="cta_inscribirme" data-ubicacion={ubic} data-pais={paisMed}>{children}</a>;
    }
    return <a className={clase} role="link" aria-disabled="true" data-pendiente="" title={textos.chip}>{children}</a>;
  };

  return (
    <div className="jc jcm uy27-pagina">
      {/* Sin JavaScript no hay animación de entrada: todo queda visible. */}
      <noscript><style>{".uy27 .uy-revelar,.uy27 .uy-escalonado>*,.uy27 .uy-h1 .uy-palabra,.uy27 .uy-tramo,.uy27 .uy-comoPie{opacity:1!important;transform:none!important}.uy27 .uy-comoMarco{clip-path:none!important}"}</style></noscript>
      <ConservarUtm />
      <Nav subtitulo="Uruguay" cta={ctaNav} paisMed={paisMed} />
      <div className="uy27" data-uy27="">
      {/* Íconos reutilizables (se usan con <svg><use href="#i-..."/></svg>) */}
      <svg width="0" height="0" style={{ "position": "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="i-flecha" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
          <symbol id="i-abajo" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
          <symbol id="i-check" viewBox="0 0 24 24"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></symbol>
          <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
          <symbol id="i-laptop" viewBox="0 0 24 24"><path d="M4 6h16v10H4zM2 19h20"/></symbol>
          <symbol id="i-personas" viewBox="0 0 24 24"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-3-5.2"/></symbol>
          <symbol id="i-corazon" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></symbol>
          <symbol id="i-micro" viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/></symbol>
          <symbol id="i-correo" viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 7l8 6 8-6"/></symbol>
          <symbol id="i-lupa" viewBox="0 0 24 24"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6"/></symbol>
          <symbol id="i-izq" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
          <symbol id="i-der" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>

        </defs>
      </svg>



      {/* ================= INICIO ================= */}
      <div id="inicio" className="uy-heroFondo">
        <div className="uy-trazos" aria-hidden="true" >{trazos(14)}</div>
        <div className="uy-trazos uy-trazosEspejo" aria-hidden="true" >{trazos(10)}</div>
        <i className="uy-deco uy-decoSol" aria-hidden="true"></i>
        <i className="uy-deco uy-decoCuadro" aria-hidden="true"></i>
        <i className="uy-deco uy-decoPunto" aria-hidden="true"></i>

        <div className="uy-contenedor">


          <section className="uy-hero">
            <div className="uy-heroTexto">
              <div className="uy-etiqueta uy-revelar"><span className="uy-pulso" aria-hidden="true"></span> <span>{textos.chip}</span> · Uruguay</div>

              <h1 className="uy-h1">{tituloPorPalabras(TITULO)}</h1>

              <p className="uy-lead uy-revelar" style={v("--retraso", ".6s")}>
                Jóvenes creaTIvos en Uruguay: <strong>8 meses</strong> de formación en habilidades esenciales, emprendimiento y programación,
                de marzo a octubre de 2027. <strong>Beca del 100 %.</strong>
              </p>

              {conCuenta ? (
                <div className="uy-cuenta uy-revelar" style={v("--retraso", ".7s")} role="timer" data-cuenta="" aria-label={`${etapaM} hasta el ${fechaCierre}`}>
                <span className="uy-cuentaRotulo">{etapaM} hasta el {fechaCierre}</span>
                <div className="uy-cuentaCajas">
                  <div className="uy-cuentaCaja"><strong data-cuenta-parte="dias">--</strong><span>días</span></div>
                  <div className="uy-cuentaCaja"><strong data-cuenta-parte="horas">--</strong><span>horas</span></div>
                  <div className="uy-cuentaCaja"><strong data-cuenta-parte="min">--</strong><span>min</span></div>
                  <div className="uy-cuentaCaja"><strong data-cuenta-parte="seg">--</strong><span>seg</span></div>
                </div>
              </div>
              ) : null}

              <div id="cta-hero" className="uy-ctas uy-revelar" style={v("--retraso", ".8s")}>
                {postular("uy-boton uy-botonHero uy-botonMetal", "postular-hero", <><span className="uy-botonTexto">¡Postulate! <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-flecha"/></svg></span></>)}
              </div>

              <ul className="uy-datos uy-escalonado">
                <li><strong><span data-contador="8">8</span> meses</strong><span>de marzo a octubre</span></li>
                <li><strong>{HORAS} h</strong><span>por semana</span></li>
                <li><strong>Modalidad</strong><span>virtual + presencial</span></li>
              </ul>
            </div>

            <figure className="uy-heroFoto" data-tilt="">
              <div className="uy-foto" data-espacio="hero" data-medida="1600 × 1200 px (4:3)">
                <img src={F("hero")} srcSet={S("hero")} sizes={TAM["hero"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Grupo de Jóvenes creaTIvos celebrando en la primera sesión presencial en Colonia" width="1600" height="1200" fetchPriority="high" decoding="async" />
              </div>
              <span className="uy-heroPie">Primera sesión presencial · Colonia</span>
            </figure>
          </section>
        </div>
      </div>

      <main className="uy-contenedor">

        {/* ================= RUTA DE FORMACIÓN ================= */}
        <section id="acerca" className="uy-seccion" aria-labelledby="ruta-titulo">
          <div className="uy-revelar">
            <div className="uy-kicker">Ruta de formación</div>
            <h2 id="ruta-titulo" className="uy-h2">Tres cursos, un mismo camino</h2>
            <p className="uy-sub">8 meses en orden: primero las habilidades esenciales, después el emprendimiento y por último el desarrollo de software. Pasá el mouse o tocá una tarjeta para darle la vuelta.</p>
          </div>

          <ol className="uy-fechas uy-revelar" aria-label="Fechas clave">
            <li className="uy-fechaDestacada"><span className="uy-fechaEtapa">1.ª etapa de preinscripciones</span><strong className="uy-fechaValor">Hasta el 18 de diciembre de 2026</strong></li>
            <li><span className="uy-fechaEtapa">Cierre y graduación</span><strong className="uy-fechaValor">Octubre de 2027</strong></li>
          </ol>

          <div className="uy-ruta" data-ruta="">
            <div className="uy-intereses">
              <p className="uy-interesesPista">¿Qué te gustaría lograr? Elegí lo que más te llame:</p>
              <div className="uy-interesesLista" role="group" aria-label="Intereses">
                <button type="button" className="uy-interes" data-curso="1" aria-pressed="false">Hablar en público sin nervios</button>
                <button type="button" className="uy-interes" data-curso="1" aria-pressed="false">Liderar un equipo</button>
                <button type="button" className="uy-interes" data-curso="2" aria-pressed="false">Tener mi propio negocio</button>
                <button type="button" className="uy-interes" data-curso="2" aria-pressed="false">Sacar adelante una idea</button>
                <button type="button" className="uy-interes" data-curso="3" aria-pressed="false">Crear páginas web</button>
                <button type="button" className="uy-interes" data-curso="3" aria-pressed="false">Programar mis propias apps</button>
              </div>
            </div>

            {/* Línea de tiempo: el ancho de cada tramo es proporcional a las semanas (flex-grow). */}
            <div className="uy-linea">
              <button type="button" className="uy-tramo uy-tramo1" data-curso="1" style={{ "flexGrow": "3" }} aria-label="Habilidades esenciales: 3 semanas de 29"><span>3 sem.</span></button>
              <button type="button" className="uy-tramo uy-tramo2" data-curso="2" style={{ "flexGrow": "3" }} aria-label="Emprendimiento: 3 semanas de 29"><span>3 sem.</span></button>
              <button type="button" className="uy-tramo uy-tramo3" data-curso="3" style={{ "flexGrow": "23" }} aria-label="Desarrollo de software: 23 semanas de 29"><span>23 sem.</span></button>
            </div>

            <ol className="uy-cursos">
              <li id="curso-1" className="uy-curso uy-curso1 uy-revelar" data-curso="1">
                <button type="button" className="uy-cursoGiro" aria-pressed="false" data-temas="Liderazgo, Trabajo en equipo, Comunicación efectiva, Resolución de conflictos" aria-label="Habilidades esenciales, 3 semanas. Tocá para ver qué aprendés">
                  <span className="uy-cursoCara uy-cursoFrente" aria-hidden="true">
                    <span className="uy-cursoCabeza"><span className="uy-cursoNum">1</span><span className="uy-cursoSemanas">3 semanas</span></span>
                    <span className="uy-cursoTitulo">Habilidades esenciales</span>
                    <span className="uy-cursoLema">Confianza para liderar y comunicar</span>
                    <span className="uy-cursoVoltear">Tocá para ver qué aprendés ↻</span>
                  </span>
                  <span className="uy-cursoCara uy-cursoReverso" aria-hidden="true">
                    <span className="uy-cursoReversoTitulo">Habilidades esenciales</span>
                    <span className="uy-temas"><span className="uy-tema">Liderazgo</span><span className="uy-tema">Trabajo en equipo</span><span className="uy-tema">Comunicación efectiva</span><span className="uy-tema">Resolución de conflictos</span></span>
                  </span>
                </button>
              </li>
              <li id="curso-2" className="uy-curso uy-curso2 uy-revelar" style={v("--retraso", ".12s")} data-curso="2">
                <button type="button" className="uy-cursoGiro" aria-pressed="false" data-temas="Ideación, Modelo CANVAS, Validación" aria-label="Emprendimiento, 3 semanas. Tocá para ver qué aprendés">
                  <span className="uy-cursoCara uy-cursoFrente" aria-hidden="true">
                    <span className="uy-cursoCabeza"><span className="uy-cursoNum">2</span><span className="uy-cursoSemanas">3 semanas</span></span>
                    <span className="uy-cursoTitulo">Emprendimiento</span>
                    <span className="uy-cursoLema">De una idea a un proyecto</span>
                    <span className="uy-cursoVoltear">Tocá para ver qué aprendés ↻</span>
                  </span>
                  <span className="uy-cursoCara uy-cursoReverso" aria-hidden="true">
                    <span className="uy-cursoReversoTitulo">Emprendimiento</span>
                    <span className="uy-temas"><span className="uy-tema">Ideación</span><span className="uy-tema">Modelo CANVAS</span><span className="uy-tema">Validación</span></span>
                  </span>
                </button>
              </li>
              <li id="curso-3" className="uy-curso uy-curso3 uy-revelar" style={v("--retraso", ".24s")} data-curso="3">
                <button type="button" className="uy-cursoGiro" aria-pressed="false" data-temas="PSeInt, HTML, CSS, JavaScript, Git, React" aria-label="Desarrollo de software, 23 semanas. Tocá para ver qué aprendés">
                  <span className="uy-cursoCara uy-cursoFrente" aria-hidden="true">
                    <span className="uy-cursoCabeza"><span className="uy-cursoNum">3</span><span className="uy-cursoSemanas">23 semanas</span></span>
                    <span className="uy-cursoTitulo">Desarrollo de software</span>
                    <span className="uy-cursoLema">Páginas y apps de verdad</span>
                    <span className="uy-cursoVoltear">Tocá para ver qué aprendés ↻</span>
                  </span>
                  <span className="uy-cursoCara uy-cursoReverso" aria-hidden="true">
                    <span className="uy-cursoReversoTitulo">Desarrollo de software</span>
                    <span className="uy-temas"><span className="uy-tema">PSeInt</span><span className="uy-tema">HTML</span><span className="uy-tema">CSS</span><span className="uy-tema">JavaScript</span><span className="uy-tema">Git</span><span className="uy-tema">React</span></span>
                  </span>
                </button>
              </li>
            </ol>
          </div>

          {/* Mentores (antes "monitores") */}
          <div className="uy-mentores">
            <div className="uy-revelar">
              <h3 className="uy-mentoresTitulo">Mentores que te acompañan en cada etapa</h3>
              <p className="uy-mentoresSub">En las sesiones virtuales y en los encuentros presenciales tenés mentores que resuelven dudas y te guían paso a paso.</p>
            </div>
            <div className="uy-mentoresFotos uy-escalonado">
              <figure className="uy-mentorFoto">
                <div className="uy-foto" data-espacio="mentor-1" data-medida="1600 × 900 px (horizontal)">
                  <img src={F("mentor-1")} srcSet={S("mentor-1")} sizes={TAM["mentor-1"] ?? "(max-width: 760px) 100vw, 50vw"} style={{ "objectPosition": "0% 55%" }} alt="Mentor explicando a estudiantes en la sala de computadoras en Paysandú" width="1600" height="900" loading="lazy" decoding="async" />
                </div>
                <figcaption className="uy-mentorPie">Mentor en clase · Paysandú</figcaption>
              </figure>
              <figure className="uy-mentorFoto">
                <div className="uy-foto" data-espacio="mentor-2" data-medida="1600 × 900 px (horizontal)">
                  <img src={F("mentor-2")} srcSet={S("mentor-2")} sizes={TAM["mentor-2"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Mentor tomándose una selfie con el grupo en Colonia" width="1600" height="900" loading="lazy" decoding="async" />
                </div>
                <figcaption className="uy-mentorPie">Con el mentor · Colonia</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ================= CÓMO FUNCIONA ================= */}
        <section className="uy-como uy-revelar uy-desde-zoom" aria-labelledby="como-titulo">
          <div className="uy-comoTexto">
            <div className="uy-revelar">
              <div className="uy-kicker uy-kickerClaro">¿Cómo funciona?</div>
              <h2 id="como-titulo" className="uy-h2 uy-h2Claro">8 meses que combinan lo virtual y lo presencial</h2>
            </div>
            <div className="uy-reparto uy-revelar" style={v("--retraso", ".2s")} role="img" aria-label="70 % virtual y 30 % presencial">
              <div className="uy-repartoBarra" aria-hidden="true">
                <i className="uy-repartoVirtual" style={{ "width": "70%" }}><span data-contador="70">70</span>&nbsp;%</i>
                <i className="uy-repartoPresencial" style={{ "width": "30%" }}><span data-contador="30">30</span>&nbsp;%</i>
              </div>
              <div className="uy-repartoLeyenda" aria-hidden="true"><span>Virtual</span><span>Presencial</span></div>
            </div>
            <ul className="uy-comoLista uy-escalonado">
              <li className="uy-comoItem">
                <span className="uy-comoIcono uy-icono0"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-laptop"/></svg></span>
                <div><div className="uy-comoTitulo">70 % virtual</div><div className="uy-comoDesc">Rutas de formación en línea, parecidas a las de plataformas como Platzi, con sesiones en Zoom para reforzar lo que vas aprendiendo.</div></div>
              </li>
              <li className="uy-comoItem">
                <span className="uy-comoIcono uy-icono1"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-personas"/></svg></span>
                <div><div className="uy-comoTitulo">30 % presencial</div><div className="uy-comoDesc">Un encuentro práctico cada mes en tu ciudad y visitas a empresas de tecnología.</div></div>
              </li>
              <li className="uy-comoItem">
                <span className="uy-comoIcono uy-icono2"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-corazon"/></svg></span>
                <div><div className="uy-comoTitulo">Apoyo y acompañamiento</div><div className="uy-comoDesc">Tenés apoyo cercano del equipo para cuidar tu bienestar durante todo el programa.</div></div>
              </li>
              <li className="uy-comoItem">
                <span className="uy-comoIcono uy-icono0"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-micro"/></svg></span>
                <div><div className="uy-comoTitulo">Charlas de fortalecimiento</div><div className="uy-comoDesc">Espacios para fortalecer tus habilidades personales y profesionales.</div></div>
              </li>
            </ul>
          </div>
          <div className="uy-comoFoto" data-al-ver="">
            <div className="uy-comoMarco">
              <div className="uy-comoKen">
                <div className="uy-foto" data-espacio="como" data-medida="1600 × 1200 px (horizontal o cuadrada)">
                  <img src={F("como")} srcSet={S("como")} sizes={TAM["como"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Grupo de Jóvenes creaTIvos posando juntos en un encuentro presencial en Colonia" width="1600" height="1200" loading="lazy" decoding="async" />
                </div>
              </div>
              <span className="uy-comoVelo" aria-hidden="true"></span>
            </div>
            <span className="uy-comoFranja" aria-hidden="true"></span>
            <span className="uy-comoPie"><i className="uy-comoPunto" aria-hidden="true"></i> Encuentro presencial · Colonia</span>
            <span className="uy-comoAro" aria-hidden="true"></span>
          </div>
        </section>

        {/* ================= GALERÍA ================= */}
        <section className="uy-seccion" aria-labelledby="galeria-titulo">
          <div className="uy-revelar">
            <div className="uy-kicker">Galería · Uruguay</div>
            <h2 id="galeria-titulo" className="uy-h2">Así se vive el programa</h2>
            <p className="uy-sub">Fotos reales de la cohorte 2026 en Colonia y Paysandú. Tocá una foto para verla en grande.</p>
          </div>
          <div className="uy-galeria uy-escalonado" data-galeria="">
            <button type="button" className="uy-galeriaItem uy-galeriaGrande" data-pie="Inauguración 2026 · Colonia">
              <span className="uy-foto" data-espacio="galeria-1" data-medida="1600 × 1000 px (16:10)"><img src={F("galeria-1")} srcSet={S("galeria-1")} sizes={TAM["galeria-1"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Grupo grande de Jóvenes creaTIvos con gorras naranjas frente a la pantalla de la inauguración en Colonia" width="1600" height="1000" loading="lazy" decoding="async" /></span>
              <span className="uy-galeriaPie">Inauguración 2026 · Colonia</span>
              <span className="uy-galeriaLupa" aria-hidden="true"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-lupa"/></svg></span>
            </button>
            <button type="button" className="uy-galeriaItem" data-pie="Visita a Sofka · Paysandú">
              <span className="uy-foto" data-espacio="galeria-2" data-medida="1200 × 1200 px (cuadrada)"><img src={F("galeria-2")} srcSet={S("galeria-2")} sizes={TAM["galeria-2"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Estudiantes en la visita a Sofka en Paysandú" width="1200" height="1200" loading="lazy" decoding="async" /></span>
              <span className="uy-galeriaPie">Visita a Sofka · Paysandú</span>
              <span className="uy-galeriaLupa" aria-hidden="true"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-lupa"/></svg></span>
            </button>
            <button type="button" className="uy-galeriaItem" data-pie="Trabajo en equipo · Colonia">
              <span className="uy-foto" data-espacio="galeria-3" data-medida="1200 × 1200 px (cuadrada)"><img src={F("galeria-3")} srcSet={S("galeria-3")} sizes={TAM["galeria-3"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Estudiantes trabajando juntos en una mesa durante una sesión en Colonia" width="1200" height="1200" loading="lazy" decoding="async" /></span>
              <span className="uy-galeriaPie">Trabajo en equipo · Colonia</span>
              <span className="uy-galeriaLupa" aria-hidden="true"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-lupa"/></svg></span>
            </button>
            <button type="button" className="uy-galeriaItem" data-pie="Clase práctica · Paysandú">
              <span className="uy-foto" data-espacio="galeria-4" data-medida="1200 × 1200 px (cuadrada)"><img src={F("galeria-4")} srcSet={S("galeria-4")} sizes={TAM["galeria-4"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Estudiantes programando en Paysandú" width="1200" height="1200" loading="lazy" decoding="async" /></span>
              <span className="uy-galeriaPie">Clase práctica · Paysandú</span>
              <span className="uy-galeriaLupa" aria-hidden="true"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-lupa"/></svg></span>
            </button>
            <button type="button" className="uy-galeriaItem" data-pie="Trabajo con el mentor · Colonia">
              <span className="uy-foto" data-espacio="galeria-5" data-medida="1200 × 1200 px (cuadrada)"><img src={F("galeria-5")} srcSet={S("galeria-5")} sizes={TAM["galeria-5"] ?? "(max-width: 760px) 100vw, 50vw"} alt="Mentor acompañando a estudiantes que trabajan en sus computadoras en Colonia" width="1200" height="1200" loading="lazy" decoding="async" /></span>
              <span className="uy-galeriaPie">Trabajo con el mentor · Colonia</span>
              <span className="uy-galeriaLupa" aria-hidden="true"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-lupa"/></svg></span>
            </button>
          </div>
        </section>

        {/* ================= REQUISITOS + BENEFICIOS ================= */}
        <div className="uy-dosColumnas">
          <section className="uy-seccion uy-tarjetaBlanca uy-revelar uy-desde-izq" aria-labelledby="req-titulo">
            <div id="requisitos" className="uy-kicker">Requisitos</div>
            <h2 id="req-titulo" className="uy-h2">¿Cumplís con esto?</h2>
            {/* Sin requisito de residencia: el programa llega a más ciudades (acordado con Ana). */}
            <div className="uy-checklist" data-checklist="">
              <p className="uy-checklistPista">Marcá lo que ya cumplís:</p>
              <ul className="uy-checks">
                <li><label className="uy-checkFila"><input type="checkbox" /><span className="uy-checkCaja" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg></span><span>Estar en 5.° o 6.° de liceo, o haber egresado del bachillerato hace máximo 3 años.</span></label></li>
                <li><label className="uy-checkFila"><input type="checkbox" /><span className="uy-checkCaja" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg></span><span>Tener acceso a una computadora y a internet.</span></label></li>
                <li><label className="uy-checkFila"><input type="checkbox" /><span className="uy-checkCaja" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg></span><span>Tener {HORAS} horas a la semana para dedicarle al programa.</span></label></li>
              </ul>
              <div className="uy-medidor" aria-live="polite">
                <div className="uy-medidorBarra"><i></i></div>
                <span data-medidor-texto="">0 de 3 requisitos</span>
              </div>
              <div data-cta-checklist="">
                {postular("uy-boton", "postular-requisitos", <><span className="uy-botonTexto">Sí, quiero postularme <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-flecha"/></svg></span></>)}
              </div>
              <div className="uy-confeti" aria-hidden="true"></div>
            </div>
          </section>

          <section className="uy-seccion uy-tarjetaBlanca uy-revelar uy-desde-der" aria-labelledby="ben-titulo">
            <div className="uy-kicker">Beneficios</div>
            <h2 id="ben-titulo" className="uy-h2">Qué incluye y qué no</h2>
            <h3 className="uy-h3">Incluye</h3>
            <ul className="uy-checks uy-escalonado">
              <li><span className="uy-checkSi"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-check"/></svg></span>Beca del 100 % para la formación completa: sin costo de matrícula ni de inscripción.</li>
              <li><span className="uy-checkSi"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-check"/></svg></span>Visitas pedagógicas a empresas del sector TI.</li>
              <li><span className="uy-checkSi"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-check"/></svg></span>Certificado de participación.</li>
              <li><span className="uy-checkSi"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-check"/></svg></span>Acceso a la comunidad Jóvenes creaTIvos, donde se comparten oportunidades laborales.</li>
            </ul>
            <h3 className="uy-h3">No incluye</h3>
            <ul className="uy-checks uy-escalonado">
              <li><span className="uy-checkNo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-x"/></svg></span>Computadoras ni otros equipos.</li>
              <li><span className="uy-checkNo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-x"/></svg></span>Ayudas económicas.</li>
              <li><span className="uy-checkNo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-x"/></svg></span>Acceso a internet.</li>
            </ul>
          </section>
        </div>

        {/* ================= TESTIMONIOS ================= */}
        {/* Videos de egresados 2025 ya publicados por la Fundación. data-video="" = id de YouTube. No se carga YouTube hasta que se toca. */}
        <section id="testimonios" className="uy-seccion" aria-labelledby="testimonios-titulo">
          <div className="uy-revelar">
            <div className="uy-kicker">Testimonios</div>
            <h2 id="testimonios-titulo" className="uy-h2">Lo cuentan quienes ya pasaron por acá</h2>
          </div>
          <div className="uy-videos uy-escalonado">
            <figure className="uy-video" data-video="VQnYTwORz5I" data-nombre="Danara Guerrero"><Miniatura id="VQnYTwORz5I" nombre="Danara Guerrero" /><figcaption><strong>Danara Guerrero</strong><span>Joven creaTIva 2025 · Uruguay</span></figcaption></figure>
            <figure className="uy-video" data-video="2nqR9nhCkdg" data-nombre="Antonella Caballero"><Miniatura id="2nqR9nhCkdg" nombre="Antonella Caballero" /><figcaption><strong>Antonella Caballero</strong><span>Joven creaTIva 2025 · Barranquilla</span></figcaption></figure>
            <figure className="uy-video" data-video="4LLBIA_JnTI" data-nombre="Andrés Navarrete"><Miniatura id="4LLBIA_JnTI" nombre="Andrés Navarrete" /><figcaption><strong>Andrés Navarrete</strong><span>Joven creaTIvo 2025 · Bogotá</span></figcaption></figure>
            <figure className="uy-video" data-video="roXbrp300RM" data-nombre="Eilyn Obregón"><Miniatura id="roXbrp300RM" nombre="Eilyn Obregón" /><figcaption><strong>Eilyn Obregón</strong><span>Joven creaTIva 2025 · Cali</span></figcaption></figure>
          </div>
          <details className="uy-masVideos">
            <summary>Ver más testimonios <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-abajo"/></svg></summary>
            <div className="uy-videos">
              <figure className="uy-video" data-video="a0h-nldX7eo" data-nombre="Linda Julio"><Miniatura id="a0h-nldX7eo" nombre="Linda Julio" /><figcaption><strong>Linda Julio</strong><span>Joven creaTIva 2025 · Cartagena</span></figcaption></figure>
              <figure className="uy-video" data-video="e36AcPeU_xs" data-nombre="Dairyn Palacios"><Miniatura id="e36AcPeU_xs" nombre="Dairyn Palacios" /><figcaption><strong>Dairyn Palacios</strong><span>Joven creaTIva 2025 · Medellín</span></figcaption></figure>
              <figure className="uy-video" data-video="haTs9oOExGM" data-nombre="Damaris Jiménez"><Miniatura id="haTs9oOExGM" nombre="Damaris Jiménez" /><figcaption><strong>Damaris Jiménez</strong><span>Joven creaTIva 2025 · Guayaquil</span></figcaption></figure>
              <figure className="uy-video" data-video="6w0KpOtU2nw" data-nombre="César Ortuño"><Miniatura id="6w0KpOtU2nw" nombre="César Ortuño" /><figcaption><strong>César Ortuño</strong><span>Joven creaTIvo 2025 · Quito</span></figcaption></figure>
            </div>
          </details>
        </section>

        {/* ================= PREGUNTAS FRECUENTES ================= */}
        <section id="preguntas" className="uy-seccion" aria-labelledby="faq-titulo">
          <div className="uy-revelar">
            <div className="uy-kicker">Preguntas frecuentes</div>
            <h2 id="faq-titulo" className="uy-h2">Lo que más nos preguntan</h2>
          </div>
          <div className="uy-faqLista uy-revelar" data-faq="">
            <div className="uy-faq uy-faqAbierta">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="true" aria-controls="faq-0" id="faq-b-0">¿Cuánto cuesta?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-0" role="region" aria-labelledby="faq-b-0"><div><p>Nada. Es una beca del 100 %: no hay costo de matrícula ni de inscripción.</p></div></div>
            </div>
            <div className="uy-faq">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="false" aria-controls="faq-1" id="faq-b-1">¿Tengo que saber programar?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-1" role="region" aria-labelledby="faq-b-1"><div><p>No. El programa empieza desde cero: primero habilidades esenciales, después emprendimiento y por último desarrollo de software.</p></div></div>
            </div>
            <div className="uy-faq">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="false" aria-controls="faq-2" id="faq-b-2">¿Cuánto dura y cuándo empieza?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-2" role="region" aria-labelledby="faq-b-2"><div><p>8 meses: de marzo a octubre de 2027. Necesitás unas {HORAS} horas a la semana.</p></div></div>
            </div>
            <div className="uy-faq">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="false" aria-controls="faq-3" id="faq-b-3">¿Es virtual o presencial?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-3" role="region" aria-labelledby="faq-b-3"><div><p>Mayoritariamente virtual (70 %), con un encuentro presencial al mes (30 %) y visitas a empresas.</p></div></div>
            </div>
            <div className="uy-faq">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="false" aria-controls="faq-4" id="faq-b-4">¿Me prestan una computadora?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-4" role="region" aria-labelledby="faq-b-4"><div><p>No. El programa no incluye equipos ni ayudas económicas: necesitás tener una computadora e internet por tu cuenta.</p></div></div>
            </div>
            <div className="uy-faq">
              <h3 className="uy-faqTitulo"><button type="button" aria-expanded="false" aria-controls="faq-5" id="faq-b-5">¿Qué recibo al terminar?<span className="uy-faqMas" aria-hidden="true">+</span></button></h3>
              <div className="uy-faqCuerpo" id="faq-5" role="region" aria-labelledby="faq-b-5"><div><p>Un certificado de participación y la entrada a la comunidad Jóvenes creaTIvos, donde se comparten oportunidades laborales.</p></div></div>
            </div>
          </div>
        </section>

        {/* ================= CIERRE ================= */}
        <section className="uy-cierre uy-revelar uy-desde-zoom" aria-labelledby="cierre-titulo">
          <div className="uy-foto uy-cierreFoto" data-espacio="cierre" data-medida="1920 × 1080 px (horizontal)">
            <img src={F("cierre")} srcSet={S("cierre")} sizes={TAM["cierre"] ?? "(max-width: 760px) 100vw, 50vw"} alt="" width="1920" height="1080" loading="lazy" decoding="async" />
          </div>
          <div className="uy-cierreVelo" aria-hidden="true"></div>
          <canvas className="uy-particulas" aria-hidden="true" data-particulas=""></canvas>
          <div className="uy-cierreCapa">
            <div className="uy-cierreEstado">{textos.franja}</div>
            <h2 id="cierre-titulo" className="uy-cierreTitulo">¿Querés ser parte de la generación 2027?</h2>
            {postular("uy-boton uy-botonGrande uy-botonMetal", "postular-cierre", <><span className="uy-botonTexto">¡Postulate acá! <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-flecha"/></svg></span></>)}
          </div>
        </section>


      </main>

      {/* ================= "POSTULATE" FIJO ABAJO ================= */}
      {/* Aparece cuando el botón del inicio sale de pantalla y queda visible hasta el final. */}
      <div className="uy-pegajoso uy-pegajosoOculto" aria-hidden="true" inert data-pegajoso="">
        <div className="uy-pegajosoInterior">
          <div className="uy-pegajosoMarca">
            <img src="/logo-jc-redondo.webp" alt="" className="uy-pegajosoLogo" width={40} height={35} />
            <span className="uy-pegajosoTexto"><strong>Jóvenes creaTIvos 2027</strong><span><span className="uy-bandera"><Bandera pais="uy" /></span> Uruguay · <span>{textos.chip}</span></span></span>
          </div>
          <div className="uy-pegajosoBoton">
            {postular("uy-boton uy-botonBarra uy-botonMetal", "postular-barra", <><span className="uy-botonTexto">¡Postulate! <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-flecha"/></svg></span></>)}
          </div>
        </div>
      </div>

      {/* ================= VISOR DE LA GALERÍA ================= */}
      <div className="uy-visor" role="dialog" aria-modal="true" aria-label="Foto ampliada" hidden data-visor="">
        <figure className="uy-visorFigura"><img alt="" draggable={false} /><figcaption></figcaption></figure>
        <button type="button" className="uy-visorBoton uy-visorCerrar" aria-label="Cerrar"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-x"/></svg></button>
        <button type="button" className="uy-visorBoton uy-visorAnt" aria-label="Foto anterior"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-izq"/></svg></button>
        <button type="button" className="uy-visorBoton uy-visorSig" aria-label="Foto siguiente"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><use href="#i-der"/></svg></button>
      </div>


        <ComportamientoUy2027 finMs={conCuenta ? finDelCierre(cierra, DESFASE_PAIS.uy) : null} />
      </div>
      <PieSitio pais="uy" cta={<a className="btn btn-pri" href={ctaNav.href} data-track={ctaNav.track} data-ubicacion="footer" data-pais={paisMed}>{ctaNav.texto}</a>} />
    </div>
  );
}
