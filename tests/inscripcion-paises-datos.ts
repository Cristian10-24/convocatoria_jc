// Datos de prueba (FALSOS) del formulario 2027: una inscripción válida y completa por país, en el formato nuevo
// (casillas de consentimiento separadas). Uruguay conserva sus claves; ver también inscripcion-datos.ts.
import { haceAnios, inscripcionUy } from "./inscripcion-datos";

const CONSENTIMIENTOS = { aceptaPrivacidad: true, autorizaDatos: true };

const COMUN = {
  direccion: "Calle 10 # 20-30",
  nombres: "lucía",
  apellidos: "prueba diseño",
  fechaNacimiento: haceAnios(19),
  institucion: "Institución Educativa de prueba",
  internet: "si",
  computadora: "propia",
  autonomia: "si",
  horas: "10a15",
  emprendimiento: "considerando",
  otrasPostulaciones: "no",
  genero: "femenino",
  talla: "m",
  ...CONSENTIMIENTOS,
};

/** Uruguay con el formulario nuevo: mismas preguntas y claves, dos casillas en vez de una. */
export function nuevaUy(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const { aceptaDatos: _anterior, ...datos } = inscripcionUy();
  void _anterior;
  return { ...datos, ...CONSENTIMIENTOS, ...extra };
}

export function nuevaCol(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...COMUN,
    sede: "medellin", ciudad: "Medellín",
    correo: "Lucia.Prueba@Gmail.com", whatsapp: "300 123 4567", telefonoAlterno: "310 765 4321",
    tipoDocumento: "ti", documento: "1023456789",
    grado: "11",
    ocupacion: ["estudio", "trabajo"], laboral: "parcial_sin",
    poblaciones: ["ninguna"], ingresos: "1a2",
    vivienda: "familiar", estrato: "2", nucleo: "4", elementos: ["nevera", "estufa", "tv"], servicios: ["energia", "agua", "gas"],
    conocimiento: "ninguno", lenguajes: "", ingles: "principiante",
    canal: "embajador", embajador: "Embajador de prueba 123",
    aplicoAntes: "no", seleccionadoAntes: "no",
    ...extra,
  };
}

export function nuevaEcu(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...COMUN,
    sede: "quito", ciudad: "Quito",
    correo: "lucia.ecuador@gmail.com", whatsapp: "099 123 4567", telefonoAlterno: "098 765 4321",
    tipoDocumento: "cedula", documento: "1712345678",
    grado: "3",
    ocupacion: ["estudio"],
    poblaciones: ["migrante"], ingresos: "menos1",
    vivienda: "arrendada", nucleo: "5", elementos: ["nevera", "estufa"], servicios: ["energia", "agua"],
    conocimiento: "basico", lenguajes: "Python", ingles: "principiante",
    canal: "flom_becario",
    aplicoAntes: "no", seleccionadoAntes: "no",
    ...extra,
  };
}

export function nuevaPan(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...COMUN,
    sede: "panama", ciudad: "San Miguelito",
    correo: "lucia.panama@gmail.com", whatsapp: "6123 4567", telefonoAlterno: "6765 4321",
    tipoDocumento: "cedula_juvenil", documento: "8-123-4567",
    grado: "12", institucion: "Colegio de prueba",
    ocupacion: ["estudiante"],
    poblaciones: ["afro"], ingresos: "usd_650",
    ingles: "intermedio",
    canal: "profesor",
    ...extra,
  };
}

export const NUEVAS = { uy: nuevaUy, col: nuevaCol, ecu: nuevaEcu, pan: nuevaPan } as const;
