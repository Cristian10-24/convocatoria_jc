// ¿La persona pidió menos movimiento (prefers-reduced-motion)? Reemplaza a useReducedMotion de framer-motion, que en
// el primer render del navegador ya devuelve la preferencia real: en las páginas estáticas eso hacía que el HTML del
// servidor (sin preferencia) y el del navegador no coincidieran (error de hidratación #418).
// Con useSyncExternalStore, al hidratar React usa el valor del servidor (false) y justo después el real; en un
// componente que se monta solo en el navegador usa el real desde el principio. Mientras tanto, el CSS de
// `@media (prefers-reduced-motion: reduce)` ya deja todo quieto y visible, así que nada se mueve.
import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function suscribir(avisar: () => void): () => void {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

const enNavegador = () => window.matchMedia(CONSULTA).matches;
const enServidor = () => false;

export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(suscribir, enNavegador, enServidor);
}
