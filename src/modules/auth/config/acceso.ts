// Reglas de acceso al panel. Valores del diseño 2027 marcados [POR CONFIRMAR]: se cambian solo aquí.

/** Intentos fallidos seguidos (por correo y por conexión) antes de bloquear el ingreso. */
export const MAX_INTENTOS = 5;
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
