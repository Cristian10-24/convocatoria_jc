// Roles del panel y qué puede hacer cada uno. Es la única tabla de permisos: la lógica (permisos.ts) solo la consulta.
// Datos sensibles (decisión F14 de PLAN.md): poblaciones, ingresos y género. Solo admin ve el detalle individual;
// los demás roles los ven agregados y se excluyen de su exportación.

export const ROLES = ["admin", "coordinador", "lector"] as const;
export type Rol = (typeof ROLES)[number];

export const PERMISOS = [
  "ver_panel",
  "ver_inscritos",
  "ver_detalle_sensible",
  "exportar",
  "gestionar_usuarios",
] as const;
export type Permiso = (typeof PERMISOS)[number];

export const PERMISOS_POR_ROL: Record<Rol, readonly Permiso[]> = {
  admin: ["ver_panel", "ver_inscritos", "ver_detalle_sensible", "exportar", "gestionar_usuarios"],
  coordinador: ["ver_panel", "ver_inscritos", "exportar"],
  lector: ["ver_panel", "ver_inscritos", "exportar"],
};

/**
 * Alcance por país. "todos": ve los 4 países. "asignados": solo los de su lista; con la lista vacía no ve nada
 * (falla cerrado), nunca "todos".
 */
export const ALCANCE_POR_ROL: Record<Rol, "todos" | "asignados"> = {
  admin: "todos",
  coordinador: "asignados",
  lector: "todos",
};

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administración",
  coordinador: "Coordinación de país",
  lector: "Consulta",
};
