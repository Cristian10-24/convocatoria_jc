// Contraseñas con bcrypt (bcryptjs: JavaScript puro, funciona igual en Vercel y en Windows sin compilar nada).
import "server-only";
import bcrypt from "bcryptjs";

export const COSTO_BCRYPT = 12;

// Hash señuelo (costo 12, de una contraseña aleatoria descartada). Si el usuario no existe se compara contra este,
// así la respuesta tarda lo mismo que con un usuario real y no delata qué usuarios existen.
const SENUELO = "$2b$12$cFnXcZvdJjlVHuPyn5xkBuu1nqNDTA.xTA5LyDfBeHKySitt0ES0S";

export function hashearClave(clave: string): Promise<string> {
  // El esquema ya lo impide; esto es la última barrera para no guardar un hash de una clave recortada.
  if (bcrypt.truncates(clave)) throw new Error("[auth] Contraseña de más de 72 bytes");
  return bcrypt.hash(clave, COSTO_BCRYPT);
}

/** Compara siempre, aunque no haya hash (usa el señuelo y devuelve false). */
export async function compararClave(clave: string, hash: string | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(clave, hash ?? SENUELO);
  return hash !== undefined && ok;
}
