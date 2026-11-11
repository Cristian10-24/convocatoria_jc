// Textos libres y nombres de persona. Funciones puras: las usan el servidor (zod) y el navegador.
// Adaptado de validation-jc (src/lib/validation/name.ts y src/lib/clausura/formulario/textos.ts).

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "e", "da", "do", "dos", "van", "von"]);
const VOCAL = /[aeiouáéíóúü]/i;
const LETRAS = /[a-záéíóúüñ]+/gi;
const PALABRA_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[-'’][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

/** Recorta, colapsa espacios y normaliza a NFC. No cambia mayúsculas ni tildes. */
export function limpiarEspacios(valor: string): string {
  return valor.normalize("NFC").replace(/\s+/g, " ").trim();
}

function capitalizar(palabra: string): string {
  // "maría-josé" -> "María-José", "d'angelo" -> "D'Angelo"
  return palabra
    .split(/([-'’.])/)
    .map((p) => (p.length ? p.charAt(0).toLocaleUpperCase("es") + p.slice(1) : p))
    .join("");
}

/** "  MARÍA  DE LOS ángeles " -> "María de los Ángeles". Nunca agrega tildes. */
export function nombrePropio(valor: string): string {
  return limpiarEspacios(valor)
    .toLocaleLowerCase("es")
    .split(" ")
    .filter(Boolean)
    .map((w, i) => (i > 0 && PARTICULAS.has(w) ? w : capitalizar(w)))
    .join(" ");
}

/**
 * Texto "basura": sin letras, un carácter repetido 4+ veces, una palabra de 5+ letras sin vocales o 5+ consonantes
 * seguidas ("ffddgdffg", "aaaa"). Siglas cortas (TIC, HTML) son válidas.
 */
export function esBasura(t: string): boolean {
  const palabras = t.match(LETRAS) ?? [];
  if (!palabras.length) return true;
  if (/(.)\1{3,}/iu.test(t.replace(/\s/g, ""))) return true;
  if (palabras.some((p) => p.length >= 5 && !VOCAL.test(p))) return true;
  if (palabras.some((p) => /[bcdfghjklmnñpqrstvwxyz]{5,}/i.test(p))) return true;
  return false;
}

/** Texto libre con sentido y un mínimo de caracteres. */
export function textoConSentido(t: string, min: number): boolean {
  const limpio = limpiarEspacios(t);
  return limpio.length >= min && !esBasura(limpio);
}

/**
 * Nombres o apellidos (una o más palabras): solo letras, tildes, ñ, guion y apóstrofo internos; cada palabra con
 * 2+ letras (salvo partículas como "y", "e"), sin basura.
 */
export function partesNombreValidas(t: string): boolean {
  const limpio = limpiarEspacios(t);
  if (limpio.length < 2 || limpio.length > 60) return false;
  const palabras = limpio.split(" ");
  if (!palabras.every((p) => PALABRA_NOMBRE.test(p))) return false;
  if (!palabras.every((p) => PARTICULAS.has(p.toLowerCase()) || p.replace(/[-'’]/g, "").length >= 2)) return false;
  return !esBasura(limpio) && palabras.every((p) => VOCAL.test(p) || p.length <= 3);
}
