// Fechas de nacimiento y edad. Funciones puras. Las fechas se manejan como "AAAA-MM-DD" (sin hora ni zona),
// para que la edad no cambie según la zona horaria del servidor.

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true si es una fecha real "AAAA-MM-DD" (rechaza 2027-02-30). */
export function fechaValida(iso: string): boolean {
  const m = FECHA.exec(iso);
  if (!m) return false;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(a, mes - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === mes - 1 && f.getUTCDate() === d;
}

/** "AAAA-MM-DD" de hoy en una zona horaria (por defecto la de Bogotá, igual para todos los países de la convocatoria ±2 h). */
export function hoyIso(zona = "America/Bogota", ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** Edad cumplida en años a una fecha de referencia (ambas "AAAA-MM-DD"). */
export function edad(nacimiento: string, referencia: string): number {
  const [an, mn, dn] = nacimiento.split("-").map(Number) as [number, number, number];
  const [ar, mr, dr] = referencia.split("-").map(Number) as [number, number, number];
  let años = ar - an;
  if (mr < mn || (mr === mn && dr < dn)) años--;
  return años;
}
