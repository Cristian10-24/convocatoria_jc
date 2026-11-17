// Configuración de los 4 países, reunida. La fuente es la definición de cada país (paises/<pais>.ts).
// Este índice es para lo que necesita ver todos los países a la vez (el panel de administración y sus filtros).
// El formulario público y el endpoint NO lo usan: cargan solo la definición de su país (paises/cargar.ts).
import type { PaisSlug } from "@/shared/config/paises";
import { definicion as col } from "../paises/col";
import { definicion as ecu } from "../paises/ecu";
import { definicion as pan } from "../paises/pan";
import { definicion as uy } from "../paises/uy";
import type { ConfigPaisInscripcion, DefinicionPais } from "./tipos";

export const DEFINICIONES: Record<PaisSlug, DefinicionPais> = { uy, col, pan, ecu };

export const CONFIG_PAISES: Record<PaisSlug, ConfigPaisInscripcion> = { uy: uy.config, col: col.config, pan: pan.config, ecu: ecu.config };

/** Valor de la ciudad (o de la sede) cuando no está en la lista. */
export const CIUDAD_OTRA = "__otra__";
