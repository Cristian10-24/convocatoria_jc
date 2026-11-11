// Landing de convocatoria de un país (server component). Todo el contenido sale de src/lib/convocatoria/contenido.ts
// y lo que hace cada botón, de src/lib/convocatoria/acciones.ts. Diseño: lenguaje visual de la portada de clausura +
// efectos de movimiento del panel de datos (Efectos.tsx) y piezas interactivas (Interactivos.tsx).
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { leerConfigEntorno, resolverAccion, segunEstado, type IdBoton, type PaisSlug } from "@/modules/convocatoria/content/acciones";
import { estadoConvocatoria, type EstadoConvocatoria } from "@/shared/config/convocatoria";
import {
  COHORTE, CONTACTO, CURSOS, INCLUYE, PAISES, comoFunciona, noIncluye, preguntas, requisitos, testimoniosPara, type Foto, type Pais,
} from "@/modules/convocatoria/content/contenido";
import Bandera from "./Bandera";
import BotonAccion from "./BotonAccion";
import { Aparecer, BarraProgreso, Contador, Escalonado, FotoRevelada, FotoTilt, ItemEscalonado, Particulas, TituloPalabras, Trazos } from "./Efectos";
import { ChecklistRequisitos, CuentaRegresiva, Galeria, PreguntasFrecuentes, RutaInteractiva } from "./Interactivos";
import EncabezadoPegajoso from "./EncabezadoPegajoso";
import MovimientoProveedor from "./MovimientoProveedor";
import VideoTestimonio from "./VideoTestimonio";
import s from "./Convocatoria.module.css";

// ---------- Íconos (decorativos) ----------
const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Ico = ({ d, t = 20 }: { d: string; t?: number }) => <svg width={t} height={t} viewBox="0 0 24 24" {...trazo} aria-hidden><path d={d} /></svg>;
const D = {
  flecha: "M5 12h14M13 6l6 6-6 6",
  abajo: "M6 9l6 6 6-6",
  check: "M5.5 12.5l4.2 4.2 8.8-9.2",
  x: "M6 6l12 12M18 6L6 18",
  laptop: "M4 6h16v10H4zM2 19h20",
  personas: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-3-5.2",
  corazon: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  micro: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  gorro: "M2 9l10-5 10 5-10 5-10-5zM6 11v5c3 2 9 2 12 0v-5",
  codigo: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  correo: "M4 6h16v12H4zM4 7l8 6 8-6",
};
const ICONOS_COMO = [D.laptop, D.personas, D.corazon, D.micro];

const TEXTO_ESTADO: Record<EstadoConvocatoria, { chip: string; franja: string }> = {
  proxima: { chip: "Inscripciones muy pronto", franja: "Las inscripciones abren muy pronto" },
  abierta: { chip: "Inscripciones abiertas", franja: "Inscripciones abiertas" },
  cerrada: { chip: "Inscripciones cerradas", franja: "Las inscripciones de esta convocatoria ya cerraron" },
};
// Partículas del cierre: paleta JC (naranja, sol, azul claro, durazno).
const PARTICULAS = ["#e9531f", "#ffc845", "#4fa3e3", "#ffe6da", "#ffffff"];

/** Imagen responsiva con versión de 800 px para celular. */
function Imagen({ foto, className, carga = "lazy", sizes }: { foto: Foto; className?: string; carga?: "lazy" | "eager"; sizes: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`${foto.src}.webp`}
      srcSet={`${foto.src}-800.webp 800w, ${foto.src}.webp ${foto.ancho}w`}
      sizes={sizes}
      width={foto.ancho}
      height={foto.alto}
      alt={foto.alt}
      loading={carga}
      fetchPriority={carga === "eager" ? "high" : undefined}
      decoding="async"
    />
  );
}

function Encabezado({ etiqueta, titulo, sub, id, claro }: { etiqueta?: string; titulo: ReactNode; sub?: ReactNode; id?: string; claro?: boolean }) {
  return (
    <Aparecer>
      {etiqueta && <div className={`${s.kicker} ${claro ? s.kickerClaro : ""}`}>{etiqueta}</div>}
      <h2 id={id} className={`${s.h2} ${claro ? s.h2Claro : ""}`}>{titulo}</h2>
      {sub && <p className={s.sub}>{sub}</p>}
    </Aparecer>
  );
}

const formatearFecha = (iso: string) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const lista = (xs: string[]) => xs.join(", ").replace(/, ([^,]*)$/, " y $1");
const mayus = (t: string) => `${t[0]!.toUpperCase()}${t.slice(1)}`;

export function metadataPais(slug: PaisSlug): Metadata {
  const p = PAISES[slug];
  const titulo = `Convocatoria Jóvenes creaTIvos ${COHORTE.anio} · ${p.nombre}`;
  const descripcion = `${p.voz.convierte} en desarrollador de software desde cero y gratis. Beca del 100 % · ${COHORTE.meses} meses · ${p.sedes.join(", ")}.`;
  // Las landings se indexan (decisión 6 de PLAN.md). La URL absoluta sale de metadataBase (layout raíz).
  return {
    title: titulo,
    description: descripcion,
    robots: { index: true, follow: true },
    alternates: { canonical: p.ruta },
    openGraph: { title: titulo, description: descripcion, url: p.ruta, images: [{ url: `${p.fotos.hero.src}-800.webp`, width: 800 }], locale: "es", type: "website" },
  };
}

export default function ConvocatoriaPagina({ pais }: { pais: PaisSlug }) {
  const p: Pais = PAISES[pais];
  const v = p.voz;
  const entorno = leerConfigEntorno()[pais];
  // Estado efectivo (con la fecha de cierre); mientras no esté "abierta", los botones de postular quedan apagados.
  const { estado, cierra } = estadoConvocatoria(pais, { delPais: p.config });
  const accion = (id: IdBoton) => segunEstado(id, resolverAccion(id, p.config, entorno), estado);
  const boton = (id: IdBoton, texto: ReactNode, className: string | undefined, flecha = true) => (
    <BotonAccion pais={pais} boton={id} accion={accion(id)} className={className}>
      <span className={s.botonTexto}>{texto} {flecha && <Ico d={D.flecha} />}</span>
    </BotonAccion>
  );
  const [g0, ...galeria] = p.fotos.galeria;
  const fotoCierre = galeria[galeria.length - 1];
  const tema = { "--bandera-1": p.bandera[0], "--bandera-2": p.bandera[1], "--bandera-3": p.bandera[2] } as CSSProperties;

  return (
    <MovimientoProveedor>
    <div className={s.raiz} style={tema} data-pais={pais}>
      <BarraProgreso />

      {/* ---------- Héroe con trazos que fluyen ---------- */}
      <div className={s.heroFondo}>
        <Trazos className={s.trazos} />
        <Trazos className={`${s.trazos} ${s.trazosEspejo}`} cantidad={10} />
        <i className={`${s.deco} ${s.decoSol}`} aria-hidden />
        <i className={`${s.deco} ${s.decoCuadro}`} aria-hidden />
        <i className={`${s.deco} ${s.decoPunto}`} aria-hidden />

        <div className={s.contenedor}>
          {/* Sin enlaces a otros países ni al selector: cada landing es solo de su convocatoria. */}
          <header className={s.encabezado}>
            <div className={s.marca}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-jc.png" alt="Jóvenes creaTIvos" className={s.logo} width={60} height={52} />
              <span className={s.marcaTexto}>Convocatoria {COHORTE.anio}</span>
            </div>
            <span className={s.chipPais}><Bandera pais={pais} /> {p.nombre}</span>
          </header>

          <section className={s.hero}>
            <div className={s.heroTexto}>
              <Aparecer>
                <div className={s.etiqueta}><span className={s.pulso} aria-hidden /> {TEXTO_ESTADO[estado].chip} · {p.nombre}</div>
              </Aparecer>
              <TituloPalabras
                className={s.h1}
                partes={[{ texto: `¡${v.convierte} en` }, { texto: "desarrollador de software", resaltado: true }, { texto: "desde cero y gratis!" }]}
              />
              <Aparecer retraso={0.6}>
                <p className={s.lead}>
                  Jóvenes creaTIvos {p.en}: <strong>{COHORTE.meses} meses</strong> de formación en habilidades, emprendimiento y programación,
                  de {COHORTE.inicio} a {COHORTE.fin}. <strong>Beca del 100 %.</strong>
                </p>
              </Aparecer>
              {cierra && estado === "abierta" && (
                <Aparecer retraso={0.7}>
                  <CuentaRegresiva hastaIso={cierra} rotulo={`Inscripciones hasta el ${formatearFecha(cierra)}`} />
                </Aparecer>
              )}
              <Aparecer retraso={0.8}>
                <div id="cta-hero" className={s.ctas}>
                  {boton("postular-hero", `¡${v.postulate}!`, `${s.boton} ${s.botonMetal}`)}
                  {boton("ver-ruta", "Ver la ruta", s.botonSecundario, false)}
                </div>
              </Aparecer>
              <Escalonado as="ul" className={s.datos}>
                <ItemEscalonado as="li"><strong><Contador hasta={100} sufijo=" %" /></strong><span>becado</span></ItemEscalonado>
                <ItemEscalonado as="li"><strong><Contador hasta={COHORTE.meses} sufijo=" meses" /></strong><span>{COHORTE.horasSemana} h por semana</span></ItemEscalonado>
                <ItemEscalonado as="li"><strong><Contador hasta={CURSOS.length} sufijo=" cursos" /></strong><span>virtual + presencial</span></ItemEscalonado>
              </Escalonado>
            </div>

            <FotoTilt className={s.heroFoto}>
              <Imagen foto={p.fotos.hero} className={s.heroImg} carga="eager" sizes="(min-width: 960px) 560px, 100vw" />
              <span className={s.heroPie}>{p.fotos.hero.pie}</span>
              <span className={`${s.flotante} ${s.flotante1}`} aria-hidden><Ico d={D.codigo} t={18} /> PSeInt → React</span>
              <span className={`${s.flotante} ${s.flotante2}`} aria-hidden><Bandera pais={pais} tamano="m" /> {p.sedes.length > 2 ? `${p.sedes.slice(0, 2).join(", ")} y más` : lista(p.sedes)}</span>
            </FotoTilt>
          </section>
        </div>
      </div>

      <div className={s.contenedor}>
        {/* ---------- Ruta de formación ---------- */}
        <section id="ruta" className={s.seccion} aria-labelledby="ruta-titulo">
          <Encabezado id="ruta-titulo" etiqueta="Ruta de formación" titulo="Tres cursos, un mismo camino"
            sub={`${COHORTE.meses} meses en orden: primero las habilidades, después el emprendimiento y por último el desarrollo de software. ${pais === "uy" ? "Tocá" : "Toca"} un tramo de la línea para ir a ese curso.`} />
          <RutaInteractiva cursos={CURSOS} />
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <Aparecer as="section" className={s.como} desde="zoom">
          <div className={s.comoTexto}>
            <Encabezado id="como-titulo" etiqueta="¿Cómo funciona?" titulo={`${COHORTE.meses} meses que combinan lo virtual y lo presencial`} claro />
            <Escalonado as="ul" className={s.comoLista}>
              {comoFunciona(p).map((c, i) => (
                <ItemEscalonado as="li" key={c.titulo} className={s.comoItem}>
                  <span className={`${s.comoIcono} ${s[`icono${i % 3}`]}`}><Ico d={ICONOS_COMO[i]!} t={22} /></span>
                  <div><div className={s.comoTitulo}>{c.titulo}</div><div className={s.comoDesc}>{c.texto}</div></div>
                </ItemEscalonado>
              ))}
            </Escalonado>
          </div>
          {g0 && <FotoRevelada className={s.comoFoto} pie={g0.pie}><Imagen foto={g0} className={s.comoImg} sizes="(min-width: 960px) 460px, 100vw" /></FotoRevelada>}
        </Aparecer>

        {/* ---------- Galería ---------- */}
        <section className={s.seccion} aria-labelledby="galeria-titulo">
          <Encabezado id="galeria-titulo" etiqueta={`Galería · ${p.nombre}`} titulo="Así se vive el programa"
            sub={`Fotos reales de la cohorte 2026 en ${lista(p.sedes)}. ${pais === "uy" ? "Tocá" : "Toca"} una foto para verla en grande.`} />
          <Galeria fotos={galeria} />
        </section>

        {/* ---------- Requisitos + incluye ---------- */}
        <div className={s.dosColumnas}>
          <Aparecer as="section" desde="izq" className={`${s.seccion} ${s.tarjetaBlanca}`}>
            <div id="requisitos" className={s.kicker}>Requisitos</div>
            <h2 className={s.h2}>¿{mayus(v.cumples)} con esto?</h2>
            <ChecklistRequisitos
              items={requisitos(p)}
              textos={{
                pista: `${v.marca} lo que ya ${v.cumples}:`,
                progreso: "{n} de {t} requisitos",
                listo: `¡${mayus(v.cumples)} con todo! Ya ${v.puedes} postularte.`,
              }}
            >
              <div className={s.sedes}>
                <Ico d={D.pin} t={18} />
                <span>Encuentros presenciales en <strong>{lista(p.sedes)}</strong></span>
              </div>
              {boton("postular-requisitos", "Sí, quiero postularme", s.boton)}
            </ChecklistRequisitos>
          </Aparecer>

          <Aparecer as="section" desde="der" className={`${s.seccion} ${s.tarjetaBlanca}`}>
            <div className={s.kicker}>Beneficios</div>
            <h2 className={s.h2}>Qué incluye y qué no</h2>
            <h3 className={s.h3}>Incluye</h3>
            <Escalonado as="ul" className={s.checks}>
              {INCLUYE.map((r) => <ItemEscalonado as="li" key={r}><span className={s.checkSi}><Ico d={D.check} t={16} /></span>{r}</ItemEscalonado>)}
            </Escalonado>
            <h3 className={s.h3}>No incluye</h3>
            <Escalonado as="ul" className={s.checks}>
              {noIncluye(p).map((r) => <ItemEscalonado as="li" key={r}><span className={s.checkNo}><Ico d={D.x} t={14} /></span>{r}</ItemEscalonado>)}
            </Escalonado>
          </Aparecer>
        </div>

        {/* ---------- Testimonios ---------- */}
        <section className={s.seccion} aria-labelledby="testimonios-titulo">
          <Encabezado id="testimonios-titulo" etiqueta="Testimonios" titulo={`Lo cuentan quienes ya pasaron por ${v.aqui}`}
            sub={pais === "pan" ? "Egresados de Colombia, Ecuador y Uruguay." : undefined} />
          <Escalonado className={s.videos}>
            {testimoniosPara(pais).slice(0, 4).map((t) => <ItemEscalonado key={t.youtubeId}><VideoTestimonio t={t} verbo={v.mira} /></ItemEscalonado>)}
          </Escalonado>
          <details className={s.masVideos}>
            <summary>Ver más testimonios <Ico d={D.abajo} /></summary>
            <div className={s.videos}>
              {testimoniosPara(pais).slice(4).map((t) => <VideoTestimonio key={t.youtubeId} t={t} verbo={v.mira} />)}
            </div>
          </details>
        </section>

        {/* ---------- Preguntas frecuentes ---------- */}
        <section id="preguntas" className={s.seccion} aria-labelledby="faq-titulo">
          <Encabezado id="faq-titulo" etiqueta="Preguntas frecuentes" titulo="Lo que más nos preguntan" />
          <Aparecer><PreguntasFrecuentes items={preguntas(p)} /></Aparecer>
        </section>

        {/* ---------- Cierre con partículas ---------- */}
        <Aparecer as="section" desde="zoom" className={s.cierre}>
          {fotoCierre && <Imagen foto={fotoCierre} className={s.cierreImg} sizes="(min-width: 960px) 1100px, 100vw" />}
          <div className={s.cierreVelo} aria-hidden />
          <Particulas className={s.particulas} colores={PARTICULAS} />
          <div className={s.cierreCapa}>
            <div className={s.cierreEstado}>{TEXTO_ESTADO[estado].franja}</div>
            <h2 className={s.cierreTitulo}>¿{mayus(v.quieres)} ser parte de la generación {COHORTE.anio}?</h2>
            {boton("postular-cierre", `¡${v.postulate} ${v.aqui}!`, `${s.boton} ${s.botonGrande} ${s.botonMetal}`)}
          </div>
        </Aparecer>

        <footer className={s.pie}>
          <div><strong>Fundación ROFÉ · Toca una Vida</strong> — Jóvenes creaTIvos</div>
          <div className={s.pieFila}>
            <a href={`mailto:${CONTACTO.correo}`}><Ico d={D.correo} t={16} /> {CONTACTO.correo}</a>
            <BotonAccion pais={pais} boton="contacto" accion={accion("contacto")} className={s.pieEnlace}>{v.escribenos}</BotonAccion>
            <a href={process.env.NEXT_PUBLIC_PRIVACY_URL || CONTACTO.sitio} target="_blank" rel="noopener noreferrer">Política de privacidad</a>
            <a href={CONTACTO.sitio} target="_blank" rel="noopener noreferrer">tocaunavida.org</a>
          </div>
        </footer>
      </div>

      {/* ---------- "Postúlate" que sigue el scroll y se vuelve encabezado fijo (id de botón: postular-barra) ---------- */}
      <EncabezadoPegajoso
        marca={
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-jc.png" alt="" className={s.pegajosoLogo} width={40} height={35} />
            <span className={s.pegajosoTexto}><strong>Jóvenes creaTIvos {COHORTE.anio}</strong><span><Bandera pais={pais} /> {p.nombre} · {TEXTO_ESTADO[estado].chip}</span></span>
          </>
        }
        boton={boton("postular-barra", `¡${v.postulate}!`, `${s.boton} ${s.botonBarra} ${s.botonMetal}`)}
      />
    </div>
    </MovimientoProveedor>
  );
}
