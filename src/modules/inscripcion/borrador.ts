// Borrador del formulario en sessionStorage: si la persona recarga la página o se le cierra la pestaña sin querer,
// no pierde lo escrito. Se borra al confirmar la inscripción. Todo va en try/catch: en modo privado o con el
// almacenamiento bloqueado, el formulario funciona igual (solo sin borrador).
import type { PaisSlug } from "@/shared/config/paises";
import type { IdPaso } from "./config/tipos";
import { Entrada, type Borrador } from "./schema";

const clave = (pais: PaisSlug) => `convocatoria:inscripcion:${pais}`;

export type EstadoGuardado = { datos: Borrador; paso: IdPaso };

export function leerBorrador(pais: PaisSlug): EstadoGuardado | null {
  try {
    const crudo = sessionStorage.getItem(clave(pais));
    if (!crudo) return null;
    const json = JSON.parse(crudo) as { datos?: unknown; paso?: unknown };
    // Se valida la forma: un borrador viejo o manipulado no rompe el formulario.
    const forma = Entrada.partial().safeParse(json.datos);
    if (!forma.success) return null;
    return { datos: forma.data as Borrador, paso: (typeof json.paso === "string" ? json.paso : "ubicacion") as IdPaso };
  } catch {
    return null;
  }
}

export function guardarBorrador(pais: PaisSlug, estado: EstadoGuardado): void {
  try {
    sessionStorage.setItem(clave(pais), JSON.stringify(estado));
  } catch {
    /* sin almacenamiento: se sigue sin borrador */
  }
}

export function borrarBorrador(pais: PaisSlug): void {
  try {
    sessionStorage.removeItem(clave(pais));
  } catch {
    /* nada que borrar */
  }
}
