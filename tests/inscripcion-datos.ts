// Datos de prueba (FALSOS) para el formulario de Uruguay.
import { hoyIso } from "@/shared/validation/fechas";

/** "AAAA-MM-DD" de hace n años (menos un día, para que la edad ya esté cumplida). */
export function haceAnios(n: number, hoy = hoyIso()): string {
  const [a, m, d] = hoy.split("-").map(Number) as [number, number, number];
  const f = new Date(Date.UTC(a - n, m - 1, d - 1));
  return f.toISOString().slice(0, 10);
}

/** Inscripción válida de una persona mayor de edad en Uruguay. */
export function inscripcionUy(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sede: "paysandu",
    ciudad: "Salto",
    direccion: "Av. Artigas 1234",
    nombres: "maría josé",
    apellidos: "PÉREZ gómez",
    tipoDocumento: "ci",
    documento: "1.234.567-2",
    fechaNacimiento: haceAnios(19),
    correo: "Maria.Perez@Gmail.com",
    whatsapp: "091 234 567",
    telefonoAlterno: "099 876 543",
    grado: "6",
    promedio: "9,5",
    institucion: "Liceo N.º 1 de Salto",
    internet: "si",
    computadora: "propia",
    autonomia: "si",
    horas: "10a15",
    ocupacion: ["estudiante"],
    emprendimiento: "no",
    otrasPostulaciones: "no",
    aplicoAntes: "no",
    genero: "femenino",
    poblaciones: ["ninguna"],
    ingresos: "1a2",
    talla: "m",
    canal: "instagram",
    aceptaDatos: true,
    ...extra,
  };
}

/** Datos del acudiente (para menores de edad). */
export const ACUDIENTE = {
  acudienteNombres: "Laura",
  acudienteApellidos: "Gómez",
  acudienteCorreo: "laura.gomez@hotmail.com",
  acudienteTelefono: "098 111 222",
  acudienteRelacion: "madre",
  autorizaAcudiente: true,
};

/** Cédulas uruguayas válidas (dígito verificador correcto) para generar personas distintas. */
export function cedulaUy(base: number): string {
  const b = String(base).padStart(7, "0");
  const pesos = [2, 9, 8, 7, 6, 3, 4];
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(b[i]), 0);
  return `${b}${(10 - (suma % 10)) % 10}`;
}
