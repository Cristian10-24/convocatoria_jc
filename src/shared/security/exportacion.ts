// Protección contra inyección de fórmulas en Excel/CSV (CSV injection).
// Un valor que empieza con =, +, -, @ (o tabulador/retorno) se interpreta como fórmula al abrir el archivo.
// Se antepone un apóstrofo para que quede como texto. Función pura.

const PELIGROSO = /^[=+\-@\t\r]/;

export function celdaSegura<T>(valor: T): T | string {
  if (typeof valor !== "string") return valor;
  return PELIGROSO.test(valor) ? `'${valor}` : valor;
}

/** Escapa un valor para CSV (comillas, separador y saltos de línea) después de sanitizarlo. */
export function celdaCsv(valor: unknown, separador = ","): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(celdaSegura(valor instanceof Date ? valor.toISOString() : valor));
  return /["\n\r]/.test(texto) || texto.includes(separador) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
