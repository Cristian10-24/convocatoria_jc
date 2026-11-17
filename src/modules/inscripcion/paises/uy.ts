// Uruguay · definición del formulario. EN PRODUCCIÓN: conserva las preguntas, las opciones y las claves con las que
// ya se guardaron inscripciones (población de respuesta múltiple, tallas XS–XXL, DNI argentino, ciudades argentinas,
// "¿cuál?" en el documento "Otro"). Lo único que se agregó es "Prefiero no responder" en los datos sensibles.
import { CANALES, GENERO, INGRESOS, OCUPACION, POBLACIONES, TALLAS, COMPUTADORA } from "../config/preguntas";
import type { DefinicionPais } from "../config/tipos";
import { EDAD_MINIMA, MAYORIA_DE_EDAD, OTRO_DOCUMENTO, PASAPORTE, conPrefieroNo, legalDe } from "./comunes";

export const definicion: DefinicionPais = {
  pais: "uy",
  config: {
    pais: "uy",
    nombre: "Uruguay",
    habilitado: true,
    trato: "vos",
    telefono: "UY",
    sedes: [
      { id: "paysandu", nombre: "Paysandú", ciudades: ["Paysandú", "Guichón", "Quebracho", "Salto", "Fray Bentos", "Young", "Colón (Argentina)", "Concepción del Uruguay (Argentina)"] },
      {
        id: "colonia", nombre: "Colonia",
        ciudades: ["Colonia del Sacramento", "Carmelo", "Nueva Palmira", "Juan Lacaze", "Rosario", "Nueva Helvecia", "Tarariras", "Colonia Valdense", "Ombúes de Lavalle"],
      },
    ],
    tiposDocumento: [
      { id: "ci", etiqueta: "Cédula de identidad", regla: { formato: "numerico", min: 6, max: 8 } },
      PASAPORTE,
      { id: "residencia", etiqueta: "Carné de residencia", regla: { formato: "numerico", min: 5, max: 15 } },
      { id: "dni_ar", etiqueta: "DNI argentino", regla: { formato: "numerico", min: 7, max: 8 }, ayuda: "Para quienes viven en Colón o Concepción del Uruguay." },
      OTRO_DOCUMENTO,
    ],
    grados: [
      { id: "5", etiqueta: "5.° de liceo" },
      { id: "6", etiqueta: "6.° de liceo" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Liceo",
    escalaNotas: { min: 1, max: 12 },
    edad: { minima: EDAD_MINIMA, alertaMayorDe: 30, mayoriaDeEdad: MAYORIA_DE_EDAD },
    maxAniosEgreso: 3,
  },
  etiquetas: { ciudad: { etiqueta: "Ciudad donde vivís" }, ciudadOtra: { etiqueta: "Escribí el nombre de tu ciudad" } },
  reglas: { ubicacion: "lista", poblacionUnica: false, seleccionadoSiempre: false, tallaObligatoria: true },
  opciones: {
    computadora: COMPUTADORA, ocupacion: OCUPACION, genero: conPrefieroNo(GENERO), poblaciones: conPrefieroNo(POBLACIONES),
    ingresos: conPrefieroNo(INGRESOS), tallas: TALLAS, canales: CANALES,
  },
  pasos: [
    { id: "ubicacion", titulo: "¿En qué ciudad vivís?", corto: "Ciudad", descripcion: "Elegí la ciudad donde vivís.", campos: ["ciudad", "ciudadOtra"] },
    {
      id: "personales", titulo: "Datos personales", corto: "Datos personales", descripcion: "Tal como aparecen en tu documento.",
      campos: ["nombres", "apellidos", "tipoDocumento", "tipoDocumentoOtro", "documento", "fechaNacimiento", "correo", "whatsapp", "telefonoAlterno", "direccion"],
    },
    {
      id: "acudiente", titulo: "Padre, madre, acudiente o tutor", corto: "Adulto responsable", descripcion: "Como sos menor de edad, necesitamos los datos de un adulto responsable.",
      campos: ["acudienteNombres", "acudienteApellidos", "acudienteCorreo", "acudienteTelefono", "acudienteRelacion", "acudienteRelacionOtra"],
    },
    { id: "estudios", titulo: "Estudios y conectividad", corto: "Estudios y conectividad", campos: ["grado", "anioEgreso", "promedio", "institucion", "internet", "computadora", "autonomia", "horas"] },
    { id: "perfil", titulo: "Sobre vos", corto: "Sobre vos", campos: ["ocupacion", "ocupacionOtra", "emprendimiento", "otrasPostulaciones", "aplicoAntes", "seleccionadoAntes"] },
    { id: "sociodemograficos", titulo: "Datos sociodemográficos", corto: "Datos sociodemográficos", campos: ["genero", "poblaciones", "poblacionOtra", "ingresos", "talla"] },
    { id: "cierre", titulo: "Información adicional", corto: "Información adicional", descripcion: "Ya casi terminamos.", campos: ["canal", "canalOtro", "embajador"] },
  ],
  legal: legalDe({ pais: "uy", trato: "vos", versionAnterior: "uy-2027-provisional-1" }),
};
