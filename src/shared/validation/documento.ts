// Documentos de identidad: normalización y reglas de formato reutilizables.
// Qué tipos acepta cada país y qué regla aplica cada uno se configura en el módulo de inscripción
// (src/modules/inscripcion/config); aquí solo están las reglas. Funciones puras.

/** Documento sin puntos, espacios ni guiones, en mayúsculas ("1.234.567-2" -> "12345672"). */
export function normalizarDocumento(valor: string): string {
  return valor.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
}

const repetido = (d: string) => /^(\d)\1+$/.test(d);

/** Solo dígitos (se permiten puntos, espacios y guiones al escribir) con longitud entre min y max. */
export function numerico(valor: string, min: number, max: number): boolean {
  if (!/^[\d.\s-]+$/.test(valor.trim())) return false;
  const d = valor.replace(/\D/g, "");
  return d.length >= min && d.length <= max && !repetido(d);
}

/** Letras y números (pasaportes, cédulas de extranjería) con longitud entre min y max. */
export function alfanumerico(valor: string, min: number, max: number): boolean {
  if (!/^[0-9A-Za-z.\s-]+$/.test(valor.trim())) return false;
  const d = normalizarDocumento(valor);
  return d.length >= min && d.length <= max && /\d/.test(d) && !repetido(d);
}

/**
 * Cédula de Ecuador: 10 dígitos, provincia 01–24 o 30, tercer dígito < 6 y dígito verificador (módulo 10).
 */
export function cedulaEcuador(valor: string): boolean {
  const d = valor.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(d)) return false;
  const provincia = Number(d.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(d[2]) >= 6) return false;
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let p = Number(d[i]) * (i % 2 === 0 ? 2 : 1);
    if (p > 9) p -= 9;
    suma += p;
  }
  return (10 - (suma % 10)) % 10 === Number(d[9]);
}

/**
 * Cédula de identidad de Uruguay: 6 a 8 dígitos (el último es verificador), con o sin puntos y guion.
 * Pesos 2-9-8-7-6-3-4 sobre los 7 dígitos base (rellenados con ceros a la izquierda).
 */
export function cedulaUruguay(valor: string): boolean {
  if (!/^[\d.\s-]+$/.test(valor.trim())) return false;
  const d = valor.replace(/\D/g, "");
  if (d.length < 6 || d.length > 8 || repetido(d)) return false;
  const base = d.slice(0, -1).padStart(7, "0");
  const pesos = [2, 9, 8, 7, 6, 3, 4];
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(base[i]), 0);
  return (10 - (suma % 10)) % 10 === Number(d.at(-1));
}

/**
 * Cédula de Panamá: provincia (1–13) o prefijo (E, N, PE, AV, PI, o provincia+AV/PI), tomo y asiento.
 * Ejemplos: 8-123-4567, PE-12-345, E-8-12345, 4AV-12-345.
 */
export function cedulaPanama(valor: string): boolean {
  const t = valor.trim().toUpperCase().replace(/\s+/g, "");
  return /^(?:(?:[1-9]|1[0-3])(?:AV|PI)?|E|N|PE)-\d{1,4}-\d{1,6}$/.test(t);
}

/** DNI de Argentina: 7 u 8 dígitos. */
export function dniArgentina(valor: string): boolean {
  return numerico(valor, 7, 8);
}
