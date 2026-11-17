// Reglas de acceso al panel. Valores del diseño 2027 marcados [POR CONFIRMAR]: se cambian solo aquí.

/** Intentos fallidos seguidos con un mismo correo o usuario antes de bloquear su ingreso. */
export const MAX_INTENTOS = 5;
/**
 * Intentos fallidos desde una misma conexión (cualquier correo) antes de bloquearla. Más alto que por correo: en la
 * red compartida de la oficina, los errores de varias personas no deben bloquear a todo el equipo.
 */
export const MAX_INTENTOS_CONEXION = 20;
/** Minutos de bloqueo tras llegar al máximo. */
export const MINUTOS_BLOQUEO = 15;
/** Minutos que vale el enlace para restablecer la contraseña. */
export const MINUTOS_ENLACE = 30;
/** Desde cuántos intentos restantes se avisa "te quedan N intentos". */
export const AVISAR_DESDE = 2;

export const RUTA_LOGIN = "/admin/login";
export const RUTA_INICIO = "/admin";
export const RUTA_CAMBIO = "/admin/clave";
export const RUTA_OLVIDE = "/admin/olvide";
export const RUTA_RESTABLECER = "/admin/restablecer";
