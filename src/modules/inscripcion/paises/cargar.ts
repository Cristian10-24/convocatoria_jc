// Carga la definición del formulario de UN país, bajo demanda. Cada país está en su propio archivo y se importa
// de forma dinámica: el endpoint y la página de un país solo cargan su definición, y si la de un país falla al
// cargarse (un error en su archivo), ese país queda sin formulario y se registra en el log; los demás no se enteran.
import type { PaisSlug } from "@/shared/config/paises";
import type { DefinicionPais } from "../config/tipos";

const CARGADORES: Record<PaisSlug, () => Promise<{ definicion: DefinicionPais }>> = {
  uy: () => import("./uy"),
  col: () => import("./col"),
  ecu: () => import("./ecu"),
  pan: () => import("./pan"),
};

/** Comprobación mínima de forma: una definición incompleta se trata como si no existiera. */
function completa(def: DefinicionPais | undefined, pais: PaisSlug): def is DefinicionPais {
  return !!def && def.pais === pais && def.pasos?.length > 0 && def.config?.sedes?.length > 0 && def.config.tiposDocumento?.length > 0 && def.legal?.consentimientos?.length > 0;
}

/** Definición del país, o null si no se pudo cargar (queda en el log con el nombre del país). Nunca lanza. */
export async function cargarDefinicion(pais: PaisSlug): Promise<DefinicionPais | null> {
  try {
    const { definicion } = await CARGADORES[pais]();
    if (completa(definicion, pais)) return definicion;
    console.error(`[inscripcion] La definición del formulario de "${pais}" está incompleta; ese país queda sin formulario.`);
  } catch (e) {
    console.error(`[inscripcion] No se pudo cargar la definición del formulario de "${pais}":`, e instanceof Error ? e.message : e);
  }
  return null;
}
