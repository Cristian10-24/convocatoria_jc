// Configuración del formulario por país: sedes y ciudades, documentos, grados, escala de notas y trato.
// Las preguntas son las mismas en los 4 países (config/preguntas.ts); aquí solo cambia lo local.
// Uruguay está confirmado. Colombia, Panamá y Ecuador están preparados pero apagados (habilitado: false)
// hasta que el equipo confirme sus datos (ver `pendienteDeConfirmar`).
import type { PaisSlug } from "@/shared/config/paises";
import type { ConfigPaisInscripcion } from "./tipos";

const EDAD = { minima: 14, alertaMayorDe: 30, mayoriaDeEdad: 18 };
// Pasaporte y "Otro" admiten letras y números (se guardan en mayúsculas); los demás documentos, solo dígitos.
const PASAPORTE = { id: "pasaporte", etiqueta: "Pasaporte", regla: { formato: "alfanumerico", min: 5, max: 15 } } as const;
const OTRO_DOC = { id: "otro", etiqueta: "Otro", regla: { formato: "alfanumerico", min: 5, max: 20 }, conTexto: true } as const;

export const CONFIG_PAISES: Record<PaisSlug, ConfigPaisInscripcion> = {
  uy: {
    pais: "uy",
    nombre: "Uruguay",
    habilitado: true,
    trato: "vos",
    telefono: "UY",
    sedes: [
      {
        id: "paysandu",
        nombre: "Paysandú",
        ciudades: ["Paysandú", "Guichón", "Quebracho", "Salto", "Fray Bentos", "Young", "Colón (Argentina)", "Concepción del Uruguay (Argentina)"],
      },
      {
        id: "colonia",
        nombre: "Colonia",
        ciudades: [
          "Colonia del Sacramento", "Carmelo", "Nueva Palmira", "Juan Lacaze", "Rosario", "Nueva Helvecia", "Tarariras",
          "Colonia Valdense", "Ombúes de Lavalle",
        ],
      },
    ],
    tiposDocumento: [
      { id: "ci", etiqueta: "Cédula de identidad", regla: { formato: "numerico", min: 6, max: 8 } },
      PASAPORTE,
      { id: "residencia", etiqueta: "Carné de residencia", regla: { formato: "numerico", min: 5, max: 15 } },
      { id: "dni_ar", etiqueta: "DNI argentino", regla: { formato: "numerico", min: 7, max: 8 }, ayuda: "Para quienes viven en Colón o Concepción del Uruguay." },
      OTRO_DOC,
    ],
    grados: [
      { id: "5", etiqueta: "5.° de liceo" },
      { id: "6", etiqueta: "6.° de liceo" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Liceo",
    escalaNotas: { min: 1, max: 12 },
    edad: EDAD,
    maxAniosEgreso: 3,
  },

  col: {
    pais: "col",
    nombre: "Colombia",
    habilitado: false,
    pendienteDeConfirmar: "Ciudades de cada sede, tipos de documento y escala de notas (1–5).",
    trato: "tu",
    telefono: "CO",
    sedes: [
      { id: "barranquilla", nombre: "Barranquilla", ciudades: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Galapa"] },
      { id: "bogota", nombre: "Bogotá", ciudades: ["Bogotá D.C.", "Soacha", "Chía", "Funza", "Mosquera", "Madrid", "Cota"] },
      { id: "cali", nombre: "Cali", ciudades: ["Cali", "Jamundí", "Palmira", "Yumbo", "Candelaria"] },
      { id: "cartagena", nombre: "Cartagena", ciudades: ["Cartagena", "Turbaco", "Arjona"] },
      {
        id: "medellin",
        nombre: "Medellín",
        ciudades: ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Barbosa"],
      },
    ],
    tiposDocumento: [
      { id: "ti", etiqueta: "Tarjeta de identidad", regla: { formato: "numerico", min: 10, max: 11 } },
      { id: "cc", etiqueta: "Cédula de ciudadanía", regla: { formato: "numerico", min: 6, max: 10 } },
      { id: "ce", etiqueta: "Cédula de extranjería", regla: { formato: "numerico", min: 6, max: 12 } },
      { id: "ppt", etiqueta: "Permiso por Protección Temporal (PPT)", regla: { formato: "numerico", min: 6, max: 12 } },
      PASAPORTE,
      OTRO_DOC,
    ],
    grados: [
      { id: "10", etiqueta: "Grado 10°" },
      { id: "11", etiqueta: "Grado 11°" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Colegio",
    escalaNotas: { min: 1, max: 5 },
    edad: EDAD,
    maxAniosEgreso: 3,
  },

  pan: {
    pais: "pan",
    nombre: "Panamá",
    habilitado: false,
    pendienteDeConfirmar: "Ciudades cercanas, tipos de documento y escala de notas (1–5).",
    trato: "tu",
    telefono: "PA",
    sedes: [
      { id: "panama", nombre: "Ciudad de Panamá", ciudades: ["Ciudad de Panamá", "San Miguelito", "Arraiján", "La Chorrera", "Chepo", "Capira"] },
    ],
    tiposDocumento: [
      // PENDIENTE antes de activar Panamá: su cédula NO es un número entero. Hay que conservar el formato con guiones y
      // prefijos (8-123-4567, PE-1-234, E-8-12345, N-…, 1AV-…) con una regla propia (p. ej. formato "cedula_pa"),
      // validarla con cedulaPanama() de src/shared/validation/documento.ts y guardarla tal cual, en mayúsculas.
      { id: "cedula", etiqueta: "Cédula", regla: { formato: "numerico", min: 5, max: 15 } },
      PASAPORTE,
      { id: "residente", etiqueta: "Carné de residente", regla: { formato: "numerico", min: 5, max: 15 } },
      OTRO_DOC,
    ],
    grados: [
      { id: "11", etiqueta: "11.° grado" },
      { id: "12", etiqueta: "12.° grado" },
      { id: "egresado", etiqueta: "Ya me gradué de la secundaria" },
    ],
    institucion: "Colegio",
    escalaNotas: { min: 1, max: 5 },
    edad: EDAD,
    maxAniosEgreso: 3,
  },

  ecu: {
    pais: "ecu",
    nombre: "Ecuador",
    habilitado: false,
    pendienteDeConfirmar: "Ciudades de cada sede, tipos de documento y escala de notas (1–10).",
    trato: "tu",
    telefono: "EC",
    sedes: [
      { id: "quito", nombre: "Quito", ciudades: ["Quito", "Sangolquí", "Cumbayá", "Tumbaco", "Calderón", "Conocoto"] },
      { id: "guayaquil", nombre: "Guayaquil", ciudades: ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro"] },
    ],
    tiposDocumento: [
      { id: "cedula", etiqueta: "Cédula de identidad", regla: { formato: "numerico", min: 10, max: 10 } },
      PASAPORTE,
      OTRO_DOC,
    ],
    grados: [
      { id: "2", etiqueta: "2.° de bachillerato" },
      { id: "3", etiqueta: "3.° de bachillerato" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Colegio",
    escalaNotas: { min: 1, max: 10 },
    edad: EDAD,
    maxAniosEgreso: 3,
  },
};

/** Valor del selector de ciudad cuando no está en la lista. */
export const CIUDAD_OTRA = "__otra__";
