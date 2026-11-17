"use client";

// Carga diferida de framer-motion: los componentes usan `m.*` (sin código de animación propio) y las funciones de
// animación (domAnimation: animate, exit, whileInView, hover) llegan en un trozo aparte después de pintar la página.
// No se usa domMax (drag/layout) para no cargar ~10 KB más: el visor desliza con eventos nativos.
import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

const cargar = () => import("./movimientoFunciones").then((r) => r.default);

export default function MovimientoProveedor({ children }: { children: ReactNode }) {
  return <LazyMotion features={cargar} strict>{children}</LazyMotion>;
}
