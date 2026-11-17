// Valores de animación compartidos (guía de animación del diseño 2027). Reglas: solo transform y opacity, entre
// 200 y 600 ms, una sola curva y nada se anima con prefers-reduced-motion (useMovimientoReducido en cada componente).
// Se usan con `m.` dentro de `LazyMotion strict`, nunca con `motion.`.
import type { Variants } from "framer-motion";

/** cubic-bezier(.2,.7,.2,1): la misma de `--curva` en tokens.css. */
export const curva = [0.2, 0.7, 0.2, 1] as const;

/** Entrada de un bloque: sube 28 px y aparece. */
export const entrada: Variants = {
  oculto: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: curva } },
};

/** Contenedor que escalona a sus hijos (70 ms al hacer scroll). */
export const grupo: Variants = { visible: { transition: { staggerChildren: 0.07 } } };

/** Escalonado del texto del hero (80 ms). */
export const grupoHero: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

/** whileInView: cada bloque entra una sola vez, cuando asoma el 10 %. */
export const opcionesVista = { once: true, amount: 0.1 } as const;

/** Con movimiento reducido todo aparece sin animación: mismas claves, sin desplazamiento ni duración. */
export const sinMovimiento: Variants = { oculto: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } };

/** Paso del formulario: entra 24 px desde la derecha (350 ms) y sale con fundido corto. */
export function variantesPaso(reducir: boolean | null): Variants {
  return {
    entra: { opacity: 0, x: reducir ? 0 : 24 },
    esta: { opacity: 1, x: 0, transition: { duration: reducir ? 0 : 0.35, ease: curva } },
    sale: { opacity: 0, transition: { duration: reducir ? 0 : 0.15 } },
  };
}

/** Duraciones del diseño, en segundos. */
export const DURACION = { boton: 0.2, visto: 0.25, paso: 0.35, barra: 0.5, entrada: 0.6, logo: 0.7, heroFundido: 0.9, tramo: 0.9, cifras: 1.4, ondas: 1.4, heroZoom: 9 } as const;

/** Avance automático del carrusel del hero, en milisegundos. */
export const HERO_AVANCE_MS = 6500;
