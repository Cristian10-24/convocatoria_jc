"use client";

// Piezas interactivas de la landing: ruta de formación con línea de tiempo, galería con visor,
// requisitos que la persona va marcando, cuenta regresiva del cierre y preguntas frecuentes animadas.
// Los textos llegan ya redactados desde el servidor (tuteo/voseo resuelto en contenido.ts).
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Foto } from "@/modules/convocatoria/content/contenido";
import s from "./Convocatoria.module.css";

const SUAVE = [0.22, 1, 0.36, 1] as const;
const Flecha = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

// ---------- Ruta de formación ----------
type Curso = { n: number; titulo: string; semanas: number; lema: string; temas: readonly string[] };
type Interes = { texto: string; curso: number };

/**
 * Intereses + línea de tiempo proporcional a las semanas + tarjetas que se voltean.
 * Cara frontal: número y nombre del curso. Reverso: qué se aprende. Se voltea al pasar el mouse,
 * al tocarla (celular), con el foco del teclado, o al elegir un interés que ese curso trabaja.
 */
export function RutaInteractiva({ cursos, intereses = [], textos }: {
  cursos: readonly Curso[];
  intereses?: readonly Interes[];
  textos: { intereses: string; voltear: string };
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const [volteadas, setVolteadas] = useState<Set<number>>(() => new Set());
  const [interes, setInteres] = useState<string | null>(null);
  const punteroRef = useRef(false);
  const reducido = useReducedMotion();
  const total = cursos.reduce((a, c) => a + c.semanas, 0);
  const elegido = intereses.find((i) => i.texto === interes)?.curso ?? null;
  const alternar = (n: number) => setVolteadas((v) => { const x = new Set(v); if (x.has(n)) x.delete(n); else x.add(n); return x; });
  const elegirInteres = (i: Interes) => {
    const nuevo = interes === i.texto ? null : i.texto;
    setInteres(nuevo);
    setActivo(nuevo ? i.curso : null);
    if (nuevo) setTimeout(() => document.getElementById(`curso-${i.curso}`)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "nearest" }), 60);
  };
  return (
    <div className={s.ruta} onMouseLeave={() => setActivo(elegido)}>
      {intereses.length > 0 && (
        <div className={s.intereses}>
          <p className={s.interesesPista}>{textos.intereses}</p>
          <div className={s.interesesLista} role="group" aria-label="Intereses">
            {intereses.map((i) => (
              <m.button
                type="button"
                key={i.texto}
                className={`${s.interes} ${s[`interes${i.curso}`]} ${interes === i.texto ? s.interesSi : ""}`}
                aria-pressed={interes === i.texto}
                whileTap={reducido ? undefined : { scale: 0.94 }}
                onClick={() => elegirInteres(i)}
              >
                {i.texto}
              </m.button>
            ))}
          </div>
        </div>
      )}
      <div className={s.linea}>
        {cursos.map((c, i) => (
          <m.button
            type="button"
            key={c.n}
            className={`${s.tramo} ${s[`tramo${c.n}`]} ${activo === c.n ? s.tramoActivo : ""}`}
            style={{ flexGrow: c.semanas, flexBasis: 0 }}
            initial={reducido ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.35, ease: SUAVE }}
            onMouseEnter={() => setActivo(c.n)}
            onFocus={() => setActivo(c.n)}
            onClick={() => document.getElementById(`curso-${c.n}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            aria-label={`${c.titulo}: ${c.semanas} semanas de ${total}`}
          >
            <span>{c.semanas} sem.</span>
          </m.button>
        ))}
      </div>
      <ol className={s.cursos}>
        {cursos.map((c, i) => {
          const vuelta = volteadas.has(c.n) || activo === c.n || elegido === c.n;
          return (
            <m.li
              id={`curso-${c.n}`}
              key={c.n}
              className={`${s.curso} ${s[`curso${c.n}`]} ${vuelta ? s.cursoVuelta : ""} ${activo === c.n || elegido === c.n ? s.cursoActivo : ""} ${elegido !== null && elegido !== c.n ? s.cursoApagado : ""}`}
              initial={reducido ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: SUAVE }}
            >
              <button
                type="button"
                className={s.cursoGiro}
                aria-pressed={vuelta}
                aria-label={`${c.titulo}, ${c.semanas} semanas. ${vuelta ? `Temas: ${c.temas.join(", ")}` : textos.voltear}`}
                // Mouse: se voltea al pasar. Toque: solo el clic la voltea (sin hover ni foco pegado). Teclado: el foco la voltea.
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setActivo(c.n); }}
                onPointerLeave={(e) => { if (e.pointerType === "mouse") setActivo(elegido); }}
                onPointerDown={() => { punteroRef.current = true; }}
                onFocus={() => { if (!punteroRef.current) setActivo(c.n); punteroRef.current = false; }}
                onBlur={() => setActivo(elegido)}
                onClick={() => alternar(c.n)}
              >
                <span className={`${s.cursoCara} ${s.cursoFrente}`} aria-hidden>
                  <span className={s.cursoCabeza}>
                    <span className={s.cursoNum}>{c.n}</span>
                    <span className={s.cursoSemanas}>{c.semanas} semanas</span>
                  </span>
                  <span className={s.cursoTitulo}>{c.titulo}</span>
                  <span className={s.cursoLema}>{c.lema}</span>
                  <span className={s.cursoVoltear}>{textos.voltear} ↻</span>
                </span>
                <span className={`${s.cursoCara} ${s.cursoReverso}`} aria-hidden>
                  <span className={s.cursoReversoTitulo}>{c.titulo}</span>
                  <span className={s.temas}>
                    {c.temas.map((t) => <span key={t} className={s.tema}>{t}</span>)}
                  </span>
                </span>
              </button>
            </m.li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- Galería con visor ----------
export function Galeria({ fotos }: { fotos: Foto[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const reducido = useReducedMotion();
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const origen = useRef<HTMLElement | null>(null);
  const inicioX = useRef<number | null>(null);
  const mover = useCallback((d: number) => setAbierta((i) => (i === null ? i : (i + d + fotos.length) % fotos.length)), [fotos.length]);
  const cerrar = useCallback(() => { setAbierta(null); origen.current?.focus(); }, []);

  useEffect(() => {
    if (abierta === null) return;
    cerrarRef.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = overflow; };
  }, [abierta, cerrar, mover]);

  const foto = abierta === null ? null : fotos[abierta]!;
  return (
    <>
      <div className={s.galeria}>
        {fotos.map((f, i) => (
          <m.button
            type="button"
            key={f.src}
            className={`${s.galeriaItem} ${i === 0 ? s.galeriaGrande : ""}`}
            initial={reducido ? false : { opacity: 0, scale: 0.92, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: SUAVE }}
            onClick={(e) => { origen.current = e.currentTarget; setAbierta(i); }}
            aria-label={`Ampliar foto: ${f.pie}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${f.src}-800.webp`} srcSet={`${f.src}-800.webp 800w, ${f.src}.webp ${f.ancho}w`} sizes={i === 0 ? "(min-width: 960px) 640px, 100vw" : "(min-width: 960px) 320px, 50vw"} alt={f.alt} loading="lazy" width={f.ancho} height={f.alto} />
            <span className={s.galeriaPie}>{f.pie}</span>
            <span className={s.galeriaLupa} aria-hidden><Flecha d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6" /></span>
          </m.button>
        ))}
      </div>
      <AnimatePresence>
        {foto && (
          <m.div
            className={s.visor}
            role="dialog"
            aria-modal="true"
            aria-label={foto.pie}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
          >
            <AnimatePresence mode="wait">
              <m.figure
                key={foto.src}
                className={s.visorFigura}
                initial={reducido ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                onPointerDown={(e) => { inicioX.current = e.clientX; }}
                onPointerUp={(e) => {
                  if (inicioX.current === null) return;
                  const dx = e.clientX - inicioX.current;
                  inicioX.current = null;
                  if (dx < -60) mover(1); else if (dx > 60) mover(-1);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${foto.src}.webp`} alt={foto.alt} draggable={false} />
                <figcaption>{foto.pie} · {abierta! + 1} / {fotos.length}</figcaption>
              </m.figure>
            </AnimatePresence>
            <button ref={cerrarRef} type="button" className={`${s.visorBoton} ${s.visorCerrar}`} onClick={cerrar} aria-label="Cerrar"><Flecha d="M6 6l12 12M18 6L6 18" /></button>
            <button type="button" className={`${s.visorBoton} ${s.visorAnt}`} onClick={() => mover(-1)} aria-label="Foto anterior"><Flecha d="M15 6l-6 6 6 6" /></button>
            <button type="button" className={`${s.visorBoton} ${s.visorSig}`} onClick={() => mover(1)} aria-label="Foto siguiente"><Flecha d="M9 6l6 6-6 6" /></button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------- Requisitos para marcar ----------
export function ChecklistRequisitos({ items, textos, children }: {
  items: string[];
  textos: { progreso: string; listo: string; pista: string };
  children: ReactNode; // el botón de postular
}) {
  const [marcados, setMarcados] = useState<boolean[]>(() => items.map(() => false));
  const reducido = useReducedMotion();
  const n = marcados.filter(Boolean).length;
  const listo = n === items.length;
  return (
    <div className={s.checklist}>
      <p className={s.checklistPista}>{textos.pista}</p>
      <ul className={s.checks}>
        {items.map((r, i) => (
          <li key={r}>
            <label className={`${s.checkFila} ${marcados[i] ? s.checkFilaSi : ""}`}>
              <input type="checkbox" checked={marcados[i]} onChange={() => setMarcados((m) => m.map((v, j) => (j === i ? !v : v)))} />
              <m.span className={s.checkCaja} animate={marcados[i] && !reducido ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <m.path d="M5.5 12.5l4.2 4.2 8.8-9.2" initial={false} animate={{ pathLength: marcados[i] ? 1 : 0 }} transition={{ duration: 0.3 }} />
                </svg>
              </m.span>
              <span>{r}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className={s.medidor} aria-live="polite">
        <div className={s.medidorBarra}><m.i animate={{ width: `${(n / items.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} /></div>
        <span>{listo ? textos.listo : textos.progreso.replace("{n}", String(n)).replace("{t}", String(items.length))}</span>
      </div>
      <m.div className={listo ? s.ctaListo : undefined} animate={listo && !reducido ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={{ duration: 0.6 }}>
        {children}
      </m.div>
      <AnimatePresence>{listo && !reducido && <Confeti />}</AnimatePresence>
    </div>
  );
}

const COLORES_CONFETI = ["#e9531f", "#ffc845", "#4fa3e3", "#1f9d6b", "#1c2a7a"];

function Confeti() {
  // Las trayectorias aleatorias se calculan una sola vez al montar (no en cada render).
  const [piezas] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      color: COLORES_CONFETI[i % COLORES_CONFETI.length],
      left: 50 + (Math.random() - 0.5) * 30,
      alto: -140 - Math.random() * 120,
      x: (Math.random() - 0.5) * 320,
      giro: Math.random() * 540,
      duracion: 1.6 + Math.random() * 0.6,
    })),
  );
  return (
    <div className={s.confeti} aria-hidden>
      {piezas.map((p, i) => (
        <m.i
          key={i}
          style={{ background: p.color, left: `${p.left}%` }}
          initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: [-10, p.alto, 60], x: p.x, opacity: [1, 1, 0], rotate: p.giro }}
          exit={{ opacity: 0 }}
          transition={{ duration: p.duracion, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// Reloj compartido para la cuenta regresiva: el servidor no tiene hora (null) y el navegador avanza cada segundo.
function suscribirReloj(aviso: () => void) {
  const t = setInterval(aviso, 1000);
  return () => clearInterval(t);
}
const segundoActual = () => Math.floor(Date.now() / 1000) * 1000;
const sinHora = () => null;

// ---------- Cuenta regresiva ----------
export function CuentaRegresiva({ hastaIso, rotulo }: { hastaIso: string; rotulo: string }) {
  const ahora = useSyncExternalStore<number | null>(suscribirReloj, segundoActual, sinHora);
  // Cierra al final del día indicado, hora de Bogotá/Panamá/Quito (UTC-5); Montevideo cierra 2 h antes: diferencia aceptable para un contador.
  const fin = new Date(`${hastaIso}T23:59:59-05:00`).getTime();
  if (ahora === null || fin <= ahora) return null;
  const seg = Math.floor((fin - ahora) / 1000);
  const partes = [
    { v: Math.floor(seg / 86400), l: "días" },
    { v: Math.floor((seg % 86400) / 3600), l: "horas" },
    { v: Math.floor((seg % 3600) / 60), l: "min" },
    { v: seg % 60, l: "seg" },
  ];
  return (
    <div className={s.cuenta} role="timer" aria-label={`${rotulo}: ${partes[0]!.v} días`}>
      <span className={s.cuentaRotulo}>{rotulo}</span>
      <div className={s.cuentaCajas}>
        {partes.map((p) => (
          <div key={p.l} className={s.cuentaCaja}>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.strong key={p.v} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ duration: 0.25 }}>
                {String(p.v).padStart(2, "0")}
              </m.strong>
            </AnimatePresence>
            <span>{p.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Preguntas frecuentes ----------
export function PreguntasFrecuentes({ items }: { items: { q: string; a: string }[] }) {
  const [abierta, setAbierta] = useState<number | null>(0);
  const reducido = useReducedMotion();
  return (
    <div className={s.faqLista}>
      {items.map((f, i) => {
        const open = abierta === i;
        return (
          <div key={f.q} className={`${s.faq} ${open ? s.faqAbierta : ""}`}>
            <h3 className={s.faqTitulo}>
              <button type="button" aria-expanded={open} aria-controls={`faq-${i}`} id={`faq-b-${i}`} onClick={() => setAbierta(open ? null : i)}>
                {f.q}
                <m.span animate={{ rotate: open ? 45 : 0 }} className={s.faqMas} aria-hidden>+</m.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <m.div
                  id={`faq-${i}`}
                  role="region"
                  aria-labelledby={`faq-b-${i}`}
                  initial={reducido ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: SUAVE }}
                  style={{ overflow: "hidden" }}
                >
                  <p>{f.a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
