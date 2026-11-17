"use client";

// Piezas interactivas de la landing 2027. Siguen la guía de animación del diseño: solo transform y opacity, una
// sola curva, `m.` dentro de LazyMotion (nunca `motion.`) y useReducedMotion en todo. Los dos carruseles con
// gesto táctil (hero y testimonios) y la galería usan Embla. Reciben datos ya resueltos: no importan contenido.
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, animate, m, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Icono from "@/shared/ui/Icono";
import { DURACION, HERO_AVANCE_MS, curva, opcionesVista } from "@/shared/ui/movimiento";

export type Enlace = { href: string; nuevaPestana?: boolean };
export type FotoVista = { src: string; src800: string; ancho: number; alto: number; alt: string; pos?: string };

const destino = (e: Enlace) => (e.nuevaPestana ? { href: e.href, target: "_blank", rel: "noopener" } : { href: e.href });
const srcSet = (f: FotoVista) => `${f.src800} 800w, ${f.src} ${f.ancho}w`;

/** Sube 28 px y aparece (600 ms). Con movimiento reducido solo aparece, sin desplazarse ni durar. */
function variantesEntrada(reducir: boolean | null, retraso = 0): Variants {
  return reducir
    ? { oculto: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0 } } }
    : { oculto: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: DURACION.entrada, ease: curva, delay: retraso } } };
}

// ---------- Entrada al hacer scroll ----------
type EtiquetaRevelar = "div" | "section" | "article" | "h2" | "ol" | "img";

/** Bloque que entra una sola vez al asomar en pantalla. `d` escalona (70 ms por unidad), como `--d` en el lienzo. */
export function Revelar({ como = "div", d = 0, className, children, ...resto }: {
  como?: EtiquetaRevelar; d?: number; className?: string; children?: ReactNode; style?: CSSProperties;
  id?: string; role?: string; src?: string; srcSet?: string; sizes?: string; alt?: string; width?: number; height?: number; loading?: "lazy";
  "aria-label"?: string; "aria-roledescription"?: string;
}) {
  const reducir = useReducedMotion();
  // Todas las etiquetas comparten las props de animación: se tratan como m.div para no complicar los tipos.
  const M = m[como] as typeof m.div;
  return (
    <M {...resto} className={className ? `rv ${className}` : "rv"} variants={variantesEntrada(reducir, d * 0.07)} initial="oculto" whileInView="visible" viewport={opcionesVista}>
      {children}
    </M>
  );
}

/** Tramo de una barra que se dibuja de izquierda a derecha (scaleX) al entrar en pantalla. `g`: orden del tramo. */
export function Tramo({ g = 0, como = "span", className, style, children, role, "aria-label": ariaLabel }: {
  g?: number; como?: "span" | "div"; className?: string; style?: CSSProperties; children?: ReactNode; role?: string; "aria-label"?: string;
}) {
  const reducir = useReducedMotion();
  const M = m[como] as typeof m.div;
  return (
    <M
      className={className} role={role} aria-label={ariaLabel} style={{ ...style, transformOrigin: "left" }}
      initial={{ scaleX: reducir ? 1 : 0 }} whileInView={{ scaleX: 1 }} viewport={opcionesVista}
      transition={{ duration: reducir ? 0 : DURACION.tramo, ease: curva, delay: reducir ? 0 : 0.2 + g * 0.16 }}
    >
      {children}
    </M>
  );
}

// ---------- Navegación ----------
export function Nav({ subtitulo, cta, paisMed }: { subtitulo?: string; cta: Enlace & { texto: string; track: string }; paisMed: string }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <a href="#inicio" className="marca foco" aria-label="Jóvenes creaTIvos, inicio">
          <img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={63} height={56} />
          <span>Convocatoria 2027{subtitulo ? <><br />{subtitulo}</> : null}</span>
        </a>
        <nav className="nav-l" aria-label="Principal">
          <a className="nl act foco" href="#inicio" aria-current="page">Inicio</a>
          <a className="nl foco" href="#acerca">Acerca de</a>
          <a className="nl foco" href="#testimonios">Testimonios</a>
          <a className="btn btn-pri" {...destino(cta)} data-track={cta.track} data-ubicacion="nav" data-pais={paisMed} style={{ marginLeft: 12 }}>{cta.texto}</a>
          <button className="burger foco" type="button" aria-label={abierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={abierto} aria-controls="menu-movil" onClick={() => setAbierto(!abierto)} style={{ marginLeft: 8 }}>
            <Icono nombre={abierto ? "equis" : "menu"} />
          </button>
        </nav>
      </div>
      {abierto ? (
        <nav id="menu-movil" className="menu-m" aria-label="Menú">
          <a href="#inicio" onClick={cerrar}>Inicio</a>
          <a href="#acerca" onClick={cerrar}>Acerca de</a>
          <a href="#testimonios" onClick={cerrar}>Testimonios</a>
        </nav>
      ) : null}
    </header>
  );
}

// ---------- Hero ----------
export type DiapositivaVista = { foto: FotoVista; a: string; b: string; c: string; sub: string };

/**
 * Carrusel del hero. Embla lleva el avance (cada 6,5 s), el gesto de deslizar y las pausas con el mouse encima o
 * con foco de teclado; Framer Motion funde las fotos (900 ms) con zoom lento (1 → 1,08 en 9 s) y hace entrar el
 * texto. Con movimiento reducido no avanza solo ni hace zoom. El botón de pausa cubre a quien usa celular.
 * `ctas`: un destino por diapositiva (la ubicación del clic cambia). `pie`: lo que va en vez del botón.
 */
export function Hero({ diapositivas, ctas, pie, paisMed }: { diapositivas: DiapositivaVista[]; ctas?: Enlace[]; pie?: ReactNode; paisMed: string }) {
  const reducir = useReducedMotion();
  const [autoplay] = useState(() => Autoplay({ delay: HERO_AVANCE_MS, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }));
  const [raiz, api] = useEmblaCarousel({ loop: true }, [autoplay]);
  const [i, setI] = useState(0);
  const [cambio, setCambio] = useState(false); // ya hubo un cambio de diapositiva: desde ahí el texto entra animado
  const [enMarcha, setEnMarcha] = useState(false);
  const [pausado, setPausado] = useState(false);
  const detenido = useRef(false);

  useEffect(() => {
    detenido.current = pausado || !!reducir;
    const reproductor = api?.plugins().autoplay;
    if (!api || !reproductor) return;
    if (detenido.current) reproductor.stop();
    else reproductor.play();
  }, [api, pausado, reducir]);

  useEffect(() => {
    if (!api) return;
    const alElegir = () => { setI(api.selectedScrollSnap()); setCambio(true); };
    // El plugin reanuda solo al salir el mouse o el foco: si la persona pausó (o pide menos movimiento), se queda quieto.
    const alReanudar = () => { if (detenido.current) api.plugins().autoplay?.stop(); else setEnMarcha(true); };
    const alParar = () => setEnMarcha(false);
    api.on("select", alElegir).on("autoplay:play", alReanudar).on("autoplay:stop", alParar);
    return () => { api.off("select", alElegir).off("autoplay:play", alReanudar).off("autoplay:stop", alParar); };
  }, [api]);

  // Las demás fotos se descargan después de la primera, para que el cambio no muestre el fondo vacío.
  useEffect(() => {
    const t = setTimeout(() => diapositivas.slice(1).forEach((d) => { const img = new Image(); img.srcset = srcSet(d.foto); img.sizes = "100vw"; img.src = d.foto.src; }), 2500);
    return () => clearTimeout(t);
  }, [diapositivas]);

  const actual = diapositivas[i] ?? diapositivas[0]!;
  const texto = variantesEntrada(reducir);
  const grupo: Variants = { visible: { transition: { staggerChildren: reducir ? 0 : 0.08 } } };
  const cta = ctas?.[i] ?? ctas?.[0];

  return (
    <section id="inicio" className="hero osc" ref={raiz} aria-roledescription="carrusel" aria-label="Convocatoria 2027">
      <div className="hero-pista" aria-hidden="true">{diapositivas.map((d) => <div key={d.foto.src} />)}</div>
      <div className="hero-fotos" aria-hidden="true">
        <AnimatePresence initial={false}>
          <m.div key={i} className="sl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducir ? 0 : DURACION.heroFundido, ease: curva }}>
            <m.img
              src={actual.foto.src} srcSet={srcSet(actual.foto)} sizes="100vw" alt="" width={actual.foto.ancho} height={actual.foto.alto}
              loading={i === 0 ? "eager" : undefined} fetchPriority={i === 0 ? "high" : undefined} decoding="async" draggable={false}
              style={{ objectPosition: actual.foto.pos }}
              initial={{ scale: 1 }} animate={{ scale: reducir ? 1 : 1.08 }} transition={{ duration: DURACION.heroZoom, ease: curva }}
            />
          </m.div>
        </AnimatePresence>
      </div>
      <div className="hero-velo" />
      <div className="wrap hero-c">
        {/* Mientras avanza solo no se anuncia cada cambio (sería ruido para el lector de pantalla). */}
        <div className="tx" aria-live={enMarcha ? "off" : "polite"}>
          {diapositivas.map((d, k) => {
            const Titulo = (k === 0 ? m.h1 : m.h2) as typeof m.h1;
            return (
              <m.div key={d.foto.src} className={k === i ? "on" : undefined} aria-hidden={k !== i} variants={grupo} initial={false} animate={k === i ? "visible" : "oculto"}>
                <Titulo className="t1" variants={texto}>{d.a}<span className="ac-o">{d.b}</span>{d.c}</Titulo>
                <m.p className="t2" variants={texto}>{d.sub}</m.p>
              </m.div>
            );
          })}
        </div>
        {cta ? (
          <m.div key={i} variants={variantesEntrada(reducir, 0.16)} initial={cambio ? "oculto" : false} animate="visible">
            <a className="btn btn-pri btn-lg" {...destino(cta)} data-track="cta_inscribirme" data-ubicacion={`hero_slide_${i + 1}`} data-pais={paisMed}>
              Inscribirme<Icono nombre="flecha" clase="fl" />
            </a>
          </m.div>
        ) : pie}
      </div>
      {diapositivas.length > 1 && !reducir ? (
        <button className="rb rb-o foco hero-pausa" type="button" aria-pressed={pausado} aria-label={pausado ? "Reanudar el carrusel" : "Pausar el carrusel"} onClick={() => setPausado(!pausado)}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">{pausado ? <path d="M9 6.5l8.5 5.5L9 17.5z" /> : <path d="M9 6.5v11M15 6.5v11" />}</svg>
        </button>
      ) : null}
    </section>
  );
}

// ---------- Avísame cuando abran ----------
/** Correo para avisar de la apertura (estado "muy pronto"). La trampa antibots y el límite por IP los revisa la API. */
export function AvisoApertura({ pais, paisMed, avisame }: { pais: string; paisMed: string; avisame: string }) {
  const [estado, setEstado] = useState<"listo" | "enviando" | "ok">("listo");
  const [error, setError] = useState("");

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === "enviando") return;
    const datos = new FormData(e.currentTarget);
    const correo = String(datos.get("correo") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(correo)) { setError("Revisa el correo: parece que le falta algo (por ejemplo, @gmail.com)."); return; }
    setEstado("enviando"); setError("");
    try {
      const r = await fetch("/api/avisos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pais, correo, sitio_web: String(datos.get("sitio_web") ?? "") }),
      });
      if (r.ok) { setEstado("ok"); return; }
      setError(r.status === 429 ? "Recibimos demasiados intentos desde tu conexión. Espera unos minutos e intenta otra vez." : "No pudimos guardar tu correo. Intenta de nuevo en unos minutos.");
    } catch {
      setError("No pudimos guardar tu correo. Parece un problema de conexión: intenta de nuevo en unos minutos.");
    }
    setEstado("listo");
  }

  if (estado === "ok") {
    return (
      <div id="aviso" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p role="status" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, fontWeight: 600 }}><Icono nombre="visto" />Listo. Te escribimos apenas abran las inscripciones.</p>
      </div>
    );
  }
  return (
    <form id="aviso" onSubmit={enviar} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label htmlFor="aviso-correo" style={{ fontSize: 17, fontWeight: 600 }}>{avisame} cuando abran</label>
      <div className="aviso-f">
        <input id="aviso-correo" name="correo" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="tucorreo@ejemplo.com" aria-invalid={error ? true : undefined} aria-describedby={error ? "aviso-error aviso-nota" : "aviso-nota"} />
        {/* Trampa para bots: fuera de la vista, del teclado y de los lectores de pantalla. */}
        <input name="sitio_web" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="solo-lector" />
        <button className="btn btn-pri btn-lg" type="submit" disabled={estado === "enviando"} data-track="cta_avisame" data-ubicacion="hero" data-pais={paisMed}>{avisame}</button>
      </div>
      {error ? <p id="aviso-error" role="alert" style={{ fontSize: 15, fontWeight: 600 }}>{error}</p> : null}
      <p id="aviso-nota" className="aviso-nota">Solo usamos tu correo para avisarte de la apertura. <a href="/privacidad">Política de privacidad</a></p>
    </form>
  );
}

// ---------- Reloj de cierre ----------
/** Cuenta regresiva hasta el cierre. La página es estática: el tiempo se calcula en el navegador, después de cargar. */
export function Reloj({ finMs, etiqueta }: { finMs: number; etiqueta: string }) {
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const marcar = () => setAhora(Date.now());
    marcar();
    const t = setInterval(marcar, 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = ahora === null ? null : Math.max(0, finMs - ahora);
  const dos = (n: number) => String(n).padStart(2, "0");
  const d = ms === null ? "–" : String(Math.floor(ms / 864e5));
  const h = ms === null ? "–" : dos(Math.floor((ms % 864e5) / 36e5));
  const min = ms === null ? "–" : dos(Math.floor((ms % 36e5) / 6e4));
  return (
    <span className="reloj" role="timer" aria-label={etiqueta}>
      <span><b>{d}</b> días</span><span><b>{h}</b> h</span><span><b>{min}</b> min</span>
    </span>
  );
}

// ---------- Cifras de impacto ----------
/** Contador que sube al entrar en pantalla (1,4 s, salida suave). Sin JavaScript o con movimiento reducido muestra el valor final. */
export function Cifra({ hasta, prefijo = "", minimo = 0 }: { hasta: number; prefijo?: string; minimo?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useInView(ref, opcionesVista);
  const reducir = useReducedMotion();
  const [n, setN] = useState(hasta);
  useEffect(() => {
    if (!enVista || reducir) return;
    const control = animate(0, hasta, { duration: DURACION.cifras, ease: "easeOut", onUpdate: (v) => setN(Math.max(minimo, Math.round(v))) });
    return () => control.stop();
  }, [enVista, reducir, hasta, minimo]);
  const texto = n >= 1000 ? `${String(n).slice(0, -3)}.${String(n).slice(-3)}` : String(n);
  return <span ref={ref} className="cifra ac-o">{prefijo}{texto}</span>;
}

// ---------- Cómo funciona ----------
export type ItemComoVista = { titulo: string; texto: string; icono: string; foto: FotoVista };

export function ComoFunciona({ titulo, items, children }: { titulo: ReactNode; items: ItemComoVista[]; children?: ReactNode }) {
  const [activo, setActivo] = useState(0);
  const reducir = useReducedMotion();
  return (
    <div className="wrap g" style={{ rowGap: 40 }}>
      <div className="cf-a">
        <Revelar como="h2" className="h2">{titulo}</Revelar>
        <Revelar d={1}>
          <Tramo como="div" className="cf-b" role="group" aria-label="Modalidad">
            <button className={activo === 1 ? "v foco off" : "v foco"} type="button" onClick={() => setActivo(0)} onMouseEnter={() => setActivo(0)}>80 %</button>
            <button className={activo === 0 ? "p foco off" : "p foco"} type="button" onClick={() => setActivo(1)} onMouseEnter={() => setActivo(1)}>20 %</button>
          </Tramo>
          <div className="cf-e"><span>Virtual</span><span>Presencial</span></div>
        </Revelar>
        <Revelar className="cf-l" d={2}>
          {items.map((c, k) => (
            <button key={c.titulo} className={k === activo ? "cf-i foco on" : "cf-i foco"} type="button" aria-pressed={k === activo} onClick={() => setActivo(k)} onMouseEnter={() => setActivo(k)} onFocus={() => setActivo(k)}>
              <span className="ic"><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d={c.icono} /></svg></span>
              <span><b>{c.titulo}</b><span className="d">{c.texto}</span></span>
            </button>
          ))}
        </Revelar>
      </div>
      <Revelar className="cf-f" d={2}>
        {items.map((c, k) => (
          <m.img key={c.titulo} src={c.foto.src800} srcSet={srcSet(c.foto)} sizes="(max-width: 1000px) 100vw, 420px" alt={k === activo ? c.foto.alt : ""} loading="lazy" decoding="async"
            initial={false} animate={{ opacity: k === activo ? 1 : 0 }} transition={{ duration: reducir ? 0 : 0.6, ease: curva }} />
        ))}
      </Revelar>
      {children}
    </div>
  );
}

// ---------- Requisitos ----------
export type RequisitoVista = { clave: string; texto: string; icono: string; pendiente?: string };

export function Requisitos({ items, cta, paisMed, textos }: {
  items: RequisitoVista[]; cta: Enlace & { texto: string; track: string }; paisMed: string;
  textos: { marca: string; cumples: string; todo: string };
}) {
  const [marcados, setMarcados] = useState<Record<number, boolean>>({});
  const reducir = useReducedMotion();
  const n = items.filter((_, k) => marcados[k]).length;
  return (
    <Revelar className="rq-card">
      <p style={{ fontSize: 18, fontWeight: 700 }}>{textos.marca} lo que ya {textos.cumples}</p>
      <div className="rq-l">
        {items.map((r, k) => {
          const on = !!marcados[k];
          return (
            <label key={r.clave} className={on ? "rq on" : "rq"}>
              <input type="checkbox" checked={on} onChange={(e) => setMarcados({ ...marcados, [k]: e.target.checked })} data-track="requisito_marcado" data-requisito={r.clave} data-pais={paisMed} />
              <span className="ic"><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d={r.icono} /></svg></span>
              <span><b>{r.clave}</b><span className="d">{r.pendiente ? <><span className="falta">{r.pendiente}</span> </> : null}{r.texto}</span></span>
              <span className="ck" aria-hidden="true">
                <m.svg className="i" viewBox="0 0 24 24" initial={false} animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.5 }} transition={{ duration: reducir ? 0 : DURACION.visto, ease: curva }}><path d="M5 12.5l4.5 4.5L19 7.5" /></m.svg>
              </span>
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="rq-p" role="progressbar" aria-label={`Requisitos que ${textos.cumples}`} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={n}>
          <m.div initial={false} animate={{ scaleX: n / items.length }} transition={{ duration: reducir ? 0 : DURACION.barra, ease: curva }} />
        </div>
        <p role="status" style={{ fontSize: 15, fontWeight: 600 }}>{n === items.length ? textos.todo : `${n} de ${items.length} requisitos`}</p>
      </div>
      <a className="btn btn-pri btn-lg" {...destino(cta)} data-track={cta.track} data-ubicacion="requisitos" data-pais={paisMed}>{cta.texto}<Icono nombre="flecha" clase="fl" /></a>
    </Revelar>
  );
}

// ---------- Galería ----------
export type FotoGaleriaVista = { foto: FotoVista; pie: string };

/** Galería con Embla y fundido: flechas, miniaturas o deslizando con el dedo. No avanza sola. */
export function Galeria({ fotos, paisMed }: { fotos: FotoGaleriaVista[]; paisMed: string }) {
  const reducir = useReducedMotion();
  const [fundido] = useState(() => Fade());
  const [visor, api] = useEmblaCarousel({ loop: true, duration: reducir ? 0 : 25, containScroll: false }, [fundido]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!api) return;
    const alElegir = () => setI(api.selectedScrollSnap());
    api.on("select", alElegir);
    return () => { api.off("select", alElegir); };
  }, [api]);
  const total = fotos.length;
  return (
    <Revelar className="g" style={{ alignItems: "start" }} aria-roledescription="carrusel" aria-label="Galería de fotos">
      <figure className="gv" ref={visor}>
        <div className="gv-pista">
          {fotos.map((f, k) => (
            <div key={f.foto.src} aria-hidden={k !== i}>
              <img src={f.foto.src800} srcSet={srcSet(f.foto)} sizes="(max-width: 1000px) 100vw, 936px" alt={f.foto.alt} loading="lazy" decoding="async" draggable={false} style={{ objectPosition: f.foto.pos }} />
            </div>
          ))}
        </div>
        <figcaption aria-live="polite">{fotos[i]?.pie}</figcaption>
        <div className="gv-c">
          <span className="gv-n">{i + 1} / {total}</span>
          <button className="rb foco" type="button" aria-label="Foto anterior" onClick={() => api?.scrollPrev()} data-track="galeria_foto" data-pais={paisMed}><Icono nombre="anterior" /></button>
          <button className="rb foco" type="button" aria-label="Foto siguiente" onClick={() => api?.scrollNext()} data-track="galeria_foto" data-pais={paisMed}><Icono nombre="siguiente" /></button>
        </div>
      </figure>
      <div className="gt-l">
        {fotos.map((f, k) => (
          <button key={f.foto.src} className={k === i ? "th foco on" : "th foco"} type="button" aria-label={`Ver foto ${k + 1} de ${total}: ${f.pie}`} aria-pressed={k === i} onClick={() => api?.scrollTo(k)}>
            <img src={f.foto.src800} alt="" loading="lazy" decoding="async" width={200} height={200} style={{ objectPosition: f.foto.pos }} />
          </button>
        ))}
      </div>
    </Revelar>
  );
}

// ---------- Testimonios ----------
export type TestimonioVista = { nombre: string; detalle: string; youtubeId?: string; cita?: string };

function MedioTestimonio({ t, pendientes }: { t: TestimonioVista; pendientes: boolean }) {
  const [activo, setActivo] = useState(false);
  if (!t.youtubeId) {
    return (
      <div className="tc-m">
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 40, height: 40 }}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5.5 3.5-5.5 3.5z" /></svg>
        {pendientes ? <span className="falta">[FOTO/VIDEO: {t.nombre.split(" ")[0]}]</span> : null}
      </div>
    );
  }
  return (
    <div className="tc-m">
      {activo ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${t.youtubeId}?autoplay=1&rel=0`} title={`Testimonio de ${t.nombre}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      ) : (
        // YouTube no se carga (ni deja cookies) hasta que la persona toca la miniatura.
        <button className="tc-v foco" type="button" onClick={() => setActivo(true)} aria-label={`Ver el testimonio de ${t.nombre}`}>
          <img src={`https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" width={480} height={360} />
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><circle cx="12" cy="12" r="9" fill="hsl(231.9 77.1% 20.6% / 72%)" /><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor" /></svg>
        </button>
      )}
    </div>
  );
}

/** Carrusel horizontal con Embla (alineado al inicio, sin avance automático) y flechas. */
export function Testimonios({ lista, pendientes }: { lista: TestimonioVista[]; pendientes: boolean }) {
  const reducir = useReducedMotion();
  const [visor, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", duration: reducir ? 0 : 25 });
  const mover = useCallback((dir: 1 | -1) => (dir === 1 ? api?.scrollNext() : api?.scrollPrev()), [api]);
  return (
    <div className="wrap">
      <Revelar style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 64 }}>
        <h2 className="h2">Testimonios</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="rb foco" type="button" aria-label="Testimonios anteriores" onClick={() => mover(-1)}><Icono nombre="anterior" /></button>
          <button className="rb foco" type="button" aria-label="Testimonios siguientes" onClick={() => mover(1)}><Icono nombre="siguiente" /></button>
        </div>
      </Revelar>
      <Revelar d={1}>
        <div className="tt" ref={visor} role="group" aria-label="Carrusel de testimonios">
          <div className="tt-pista">
            {lista.map((t) => (
              <figure key={t.nombre} className="tc" style={{ margin: 0 }}>
                <MedioTestimonio t={t} pendientes={pendientes} />
                <div className="tc-c">
                  {t.cita ? <blockquote className="tc-q">{t.cita}</blockquote> : pendientes ? <blockquote className="tc-q"><span className="falta">[CITA]</span></blockquote> : null}
                  <figcaption style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <strong style={{ fontSize: 19, fontWeight: 700 }}>{t.nombre}</strong>
                    <span style={{ fontSize: 15, color: "hsl(231.9 20.2% 41.8%)" }}>{t.detalle}</span>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </Revelar>
    </div>
  );
}
