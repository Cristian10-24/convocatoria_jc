"use client";

// Efectos de movimiento de las landings, con el mismo lenguaje que el panel de datos (framer-motion):
// aparición al hacer scroll, título por palabras, trazos SVG que fluyen, partículas que reaccionan al mouse,
// contadores, foto con inclinación 3D y barra de progreso. TODO respeta prefers-reduced-motion:
// con movimiento reducido el contenido aparece quieto y completo.
import {
  m, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./Convocatoria.module.css";

const SUAVE = [0.22, 1, 0.36, 1] as const;

/** Aparece (sube y se aclara) la primera vez que entra en pantalla. */
export function Aparecer({ children, retraso = 0, desde = "abajo", className, as = "div" }: {
  children: ReactNode; retraso?: number; desde?: "abajo" | "izq" | "der" | "zoom"; className?: string; as?: "div" | "section" | "li" | "figure";
}) {
  const reducido = useReducedMotion();
  const inicial = { abajo: { opacity: 0, y: 28 }, izq: { opacity: 0, x: -36 }, der: { opacity: 0, x: 36 }, zoom: { opacity: 0, scale: 0.94 } }[desde];
  const M = m[as];
  return (
    <M
      className={className}
      initial={reducido ? false : inicial}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay: retraso, ease: SUAVE }}
    >
      {children}
    </M>
  );
}

const contenedor: Variants = { oculto: {}, visible: { transition: { staggerChildren: 0.09 } } };
const hijo: Variants = { oculto: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: SUAVE } } };

/** Lista cuyos hijos (<ItemEscalonado>) aparecen uno tras otro. */
export function Escalonado({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const reducido = useReducedMotion();
  const M = m[as];
  return (
    <M className={className} variants={contenedor} initial={reducido ? false : "oculto"} whileInView="visible" viewport={{ once: true, margin: "0px 0px -10% 0px" }}>
      {children}
    </M>
  );
}
export function ItemEscalonado({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" | "figure" }) {
  const M = m[as];
  return <M className={className} variants={hijo}>{children}</M>;
}

/** Título que entra palabra por palabra (como el hero del panel). `partes` permite resaltar tramos en naranja. */
export function TituloPalabras({ partes, className }: { partes: { texto: string; resaltado?: boolean }[]; className?: string }) {
  const reducido = useReducedMotion();
  let n = 0;
  return (
    <h1 className={className}>
      {partes.map((p, i) => (
        <span key={i} className={p.resaltado ? s.naranja : undefined}>
          {p.texto.split(" ").filter(Boolean).map((palabra, j) => {
            const k = n++;
            return (
              <m.span
                key={j}
                className={s.palabra}
                initial={reducido ? false : { opacity: 0, y: 30, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.12 + k * 0.07, duration: 0.7, ease: SUAVE }}
              >
                {palabra}
              </m.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/** Número que cuenta desde 0 al entrar en pantalla. */
export function Contador({ hasta, sufijo = "" }: { hasta: number; sufijo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true });
  const reducido = useReducedMotion();
  // null = sin animar: se muestra el valor final (así sale en el HTML estático, sin JS y con movimiento reducido).
  const [animado, setAnimado] = useState<number | null>(null);
  useEffect(() => {
    if (!visto || reducido) return;
    const t0 = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setAnimado(Math.round(hasta * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [visto, reducido, hasta]);
  return <span ref={ref}>{reducido ? hasta : (animado ?? hasta)}{sufijo}</span>;
}

/** Barra fina arriba que muestra cuánto se ha recorrido de la página. */
export function BarraProgreso() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  return <m.div className={s.progreso} style={{ scaleX: x }} aria-hidden />;
}

/**
 * Trazos SVG del fondo (misma figura que BackgroundPaths del panel). OPTIMIZADO: antes se animaba cada línea
 * con framer-motion (38 líneas recalculadas y redibujadas en cada cuadro: ~6 fps en equipos modestos).
 * Ahora el SVG se dibuja una sola vez y lo que se mueve es la capa entera con CSS transform (GPU, casi gratis).
 */
export function Trazos({ className, cantidad = 14 }: { className?: string; cantidad?: number }) {
  const paths = Array.from({ length: cantidad }, (_, k) => {
    const i = k * 2; // mismo abanico que antes, con la mitad de líneas
    return {
      id: k,
      d: `M-${380 - i * 6} -${189 + i * 7}C-${380 - i * 6} -${189 + i * 7} -${312 - i * 6} ${216 - i * 7} ${152 - i * 6} ${343 - i * 7}C${616 - i * 6} ${470 - i * 7} ${684 - i * 6} ${875 - i * 7} ${684 - i * 6} ${875 - i * 7}`,
      w: 0.7 + i * 0.05,
      o: 0.08 + i * 0.018,
    };
  });
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
        {paths.map((p) => <path key={p.id} d={p.d} stroke="currentColor" strokeWidth={p.w} strokeOpacity={p.o} />)}
      </svg>
    </div>
  );
}

/** Foto que se inclina en 3D siguiendo el mouse (solo con puntero fino; en celular queda quieta). */
export function FotoTilt({ children, className }: { children: ReactNode; className?: string }) {
  const reducido = useReducedMotion();
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 150, damping: 18 });
  const brilloX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const brilloY = useTransform(my, [0, 1], ["0%", "100%"]);
  const brillo = useTransform([brilloX, brilloY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.28), transparent 55%)`);
  if (reducido) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      // Sin opacidad inicial: la foto es lo más grande de la pantalla y debe verse de inmediato (LCP).
      initial={{ scale: 0.96, rotate: -1.5 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: SUAVE }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}
    >
      {children}
      <m.span className={s.tiltBrillo} style={{ background: brillo }} aria-hidden />
    </m.div>
  );
}

/** Imagen con parallax suave al hacer scroll. */
export function Parallax({ children, className, rango = 40 }: { children: ReactNode; className?: string; rango?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducido = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-rango, rango]);
  return (
    <div ref={ref} className={className}>
      <m.div style={{ y: reducido ? 0 : y, height: `calc(100% + ${rango * 2}px)`, marginTop: -rango }}>{children}</m.div>
    </div>
  );
}

/**
 * Foto de "¿Cómo funciona?": se revela como cortina con una franja naranja que la cruza, luego queda con
 * acercamiento lento (Ken Burns, CSS) + parallax al hacer scroll, sube una etiqueta con el pie de foto y se acerca
 * al pasar el mouse. Solo el revelado (una vez) no es de GPU.
 */
export function FotoRevelada({ children, pie, className }: { children: ReactNode; pie: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visto = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reducido = useReducedMotion();
  const animar = !reducido;
  return (
    <div ref={ref} className={`${className ?? ""} ${s.fotoRevelada}`}>
      <m.div
        className={s.fotoRevMarco}
        initial={animar ? { clipPath: "inset(0 100% 0 0)" } : false}
        animate={visto ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration: 1.1, ease: SUAVE, delay: 0.15 }}
      >
        <Parallax className={s.fotoRevParallax} rango={34}>
          <div className={s.fotoRevKen}>{children}</div>
        </Parallax>
        <span className={s.fotoRevVelo} aria-hidden />
      </m.div>
      {animar && (
        <m.span
          className={s.fotoRevFranja}
          aria-hidden
          initial={{ x: "-101%" }}
          animate={visto ? { x: ["-101%", "0%", "101%"] } : undefined}
          transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1], times: [0, 0.45, 1] }}
        />
      )}
      <m.span
        className={s.fotoRevPie}
        initial={animar ? { opacity: 0, y: 18 } : false}
        animate={visto ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, delay: 1.05, ease: SUAVE }}
      >
        <i className={s.fotoRevPunto} aria-hidden /> {pie}
      </m.span>
      <span className={s.fotoRevAro} aria-hidden />
    </div>
  );
}

/** Campo de partículas en canvas (técnica del ParticleHero del panel): flotan, se enlazan y el mouse las aparta. */
export function Particulas({ colores, enlace = "255, 200, 69", className }: { colores: string[]; enlace?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let ancho = 0, alto = 0, id = 0, visible = true;
    const raton = { x: -9999, y: -9999 };
    let ps: { x: number; y: number; vx: number; vy: number; r: number; c: string }[] = [];
    const medir = () => {
      const r = canvas.getBoundingClientRect();
      ancho = r.width; alto = r.height;
      canvas.width = ancho * dpr; canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(ancho < 600 ? 28 : 48, Math.floor((ancho * alto) / 12000));
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * ancho, y: Math.random() * alto, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 2.4, c: colores[Math.floor(Math.random() * colores.length)]!,
      }));
    };
    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      for (const p of ps) {
        if (!reducido) {
          const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) { const f = (1 - Math.sqrt(d2) / 120) * 0.9; p.vx += (dx / 120) * f; p.vy += (dy / 120) * f; }
          p.vx *= 0.96; p.vy *= 0.96;
          p.vx += (Math.random() - 0.5) * 0.03; p.vy += (Math.random() - 0.5) * 0.03;
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > ancho) p.vx *= -1;
          if (p.y < 0 || p.y > alto) p.vy *= -1;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
      }
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i]!, b = ps[j]!, dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 9025) { const d = Math.sqrt(d2); ctx.strokeStyle = `rgba(${enlace}, ${0.22 * (1 - d / 95)})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      if (!reducido && visible && !document.hidden) id = requestAnimationFrame(dibujar);
    };
    medir(); dibujar();
    const mover = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); raton.x = e.clientX - r.left; raton.y = e.clientY - r.top; };
    const salir = () => { raton.x = -9999; raton.y = -9999; };
    // Solo anima mientras se ve: ahorra batería en celular.
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; cancelAnimationFrame(id); if (visible) id = requestAnimationFrame(dibujar); });
    io.observe(canvas);
    const padre = canvas.parentElement;
    padre?.addEventListener("pointermove", mover); padre?.addEventListener("pointerleave", salir);
    window.addEventListener("resize", medir);
    return () => { cancelAnimationFrame(id); io.disconnect(); padre?.removeEventListener("pointermove", mover); padre?.removeEventListener("pointerleave", salir); window.removeEventListener("resize", medir); };
  }, [colores, enlace]);
  return <canvas ref={ref} className={className} aria-hidden />;
}
