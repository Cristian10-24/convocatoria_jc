// Permisos y alcance por país. Funciones puras: el panel (fase 4) recibe el `Alcance` desde la página o la ruta y lo
// aplica en el servidor, en cada consulta.
import { PAISES, esPais, type PaisSlug } from "@/shared/config/paises";
import { ALCANCE_POR_ROL, PERMISOS_POR_ROL, ROLES, type Permiso, type Rol } from "./config/roles";

export const esRol = (v: unknown): v is Rol => typeof v === "string" && (ROLES as readonly string[]).includes(v);

/** Un rol desconocido no puede nada. */
export function puede(rol: string | undefined, permiso: Permiso): boolean {
  return esRol(rol) && PERMISOS_POR_ROL[rol].includes(permiso);
}

/** Lo que el panel necesita saber para filtrar: países visibles y si puede ver datos sensibles en detalle (F14). */
export type Alcance = { paises: PaisSlug[]; verSensibles: boolean };

export function alcanceDe(usuario: { rol: string; paises: readonly string[] }): Alcance {
  if (!esRol(usuario.rol)) return { paises: [], verSensibles: false };
  const paises = ALCANCE_POR_ROL[usuario.rol] === "todos" ? [...PAISES] : [...new Set(usuario.paises.filter(esPais))];
  return { paises, verSensibles: puede(usuario.rol, "ver_detalle_sensible") };
}

/**
 * Filtro de MongoDB por país. Siempre explícito (`$in`), también para quien ve todo: con la lista vacía no coincide
 * nada, así un alcance mal armado falla cerrado.
 */
export function filtroPais(alcance: Alcance): { pais: { $in: PaisSlug[] } } {
  return { pais: { $in: [...alcance.paises] } };
}
