// Ecuador · definición del formulario (preguntas del formulario oficial 2026, con el diseño 2027).
// Como Colombia, pero sin estrato y con las opciones de la FLOM en "¿Cómo te enteraste?".
import type { DefinicionPais } from "../config/tipos";
import { EDAD_MINIMA, MAYORIA_DE_EDAD, PASAPORTE, conPrefieroNo, legalDe, opciones, opcionesComputadora, pasosLibre } from "./comunes";

export const definicion: DefinicionPais = {
  pais: "ecu",
  config: {
    pais: "ecu",
    nombre: "Ecuador",
    habilitado: true,
    trato: "tu",
    telefono: "EC",
    sedes: [
      { id: "quito", nombre: "Quito o poblaciones cercanas", ciudades: [] },
      { id: "guayaquil", nombre: "Guayaquil o poblaciones cercanas", ciudades: [] },
    ],
    tiposDocumento: [
      { id: "cedula", etiqueta: "Cédula de Ciudadanía", regla: { formato: "numerico", min: 10, max: 10 } },
      { id: "cedula_ext", etiqueta: "Cédula de Identidad para Extranjeros", regla: { formato: "numerico", min: 10, max: 10 } },
      PASAPORTE,
      { id: "refugiado", etiqueta: "Tarjeta de Refugiado", regla: { formato: "alfanumerico", min: 5, max: 15 } },
    ],
    grados: [
      { id: "2", etiqueta: "2.° de bachillerato" },
      { id: "3", etiqueta: "3.° de bachillerato" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Institución educativa",
    escalaNotas: { min: 1, max: 10 },
    edad: { minima: EDAD_MINIMA, alertaMayorDe: 25, mayoriaDeEdad: MAYORIA_DE_EDAD },
    maxAniosEgreso: 3,
  },
  reglas: { ubicacion: "libre", poblacionUnica: true, seleccionadoSiempre: true, tallaObligatoria: true },
  opciones: {
    computadora: opcionesComputadora("computadora"),
    ocupacion: opciones([["estudio", "Estudio"], ["trabajo", "Trabajo"], ["emprendo", "Emprendo"], ["ninguna", "No trabajo ni estudio ni emprendo"]]),
    genero: conPrefieroNo(opciones([["femenino", "Femenino"], ["masculino", "Masculino"], ["no_binario", "No binario"], ["no_sabe", "No sé / No respondo"], ["otro", "Otro"]])),
    poblaciones: conPrefieroNo(opciones([
      ["campesina", "Persona campesina"], ["indigena", "Persona perteneciente a pueblos indígenas"], ["afro", "Persona afrodescendiente"], ["lgbtiq", "Persona LGBTIQ+"],
      ["discapacidad", "Persona en condición de discapacidad"], ["madre_padre", "Persona que es madre o padre"], ["gestante", "Persona gestante"],
      ["victima", "Persona víctima del conflicto armado"], ["rrom", "Persona del pueblo Rrom (Gitano)"], ["migrante", "Persona migrante"], ["otra", "Otra"],
    ])),
    ingresos: conPrefieroNo(opciones([["menos1", "Menor a 1 salario mínimo"], ["1a2", "Entre 1 y 2 salarios mínimos"], ["mas2", "Mayor a 2 salarios mínimos"]])),
    tallas: opciones([["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]]),
    canales: opciones([
      ["flom_becario", "Soy becario de la FLOM"], ["flom", "A través de la Fundación Leonidas Ortega Moreira (FLOM)"],
      ["facebook", "Facebook"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["correo", "Correo electrónico"],
      ["familiar", "Me contó un familiar"], ["visita", "Visita informativa a mi institución educativa"], ["profesor", "Profesor de mi institución educativa"],
      ["participante", "Me contó un(a) participante de Jóvenes creaTIvos de años anteriores"], ["web", "Página web Fundación ROFÉ"], ["medios", "Medios de comunicación"],
      ["embajador", "Embajador"], ["otro", "Otro"],
    ]),
  },
  pasos: pasosLibre({
    perfil: ["laboral"],
    sociodemograficos: ["vivienda", "nucleo", "elementos", "servicios"],
    cierre: ["conocimiento", "lenguajes", "ingles", "talla", "canal", "embajador", "canalOtro", "aplicoAntes", "seleccionadoAntes"],
  }),
  etiquetas: {
    institucion: { etiqueta: "Institución educativa en la que estudias o estudiaste" },
    computadora: { etiqueta: "¿Tienes acceso a una computadora para estudiar y practicar durante el programa?" },
    talla: { etiqueta: "Talla de camisa", ayuda: "" },
    seleccionadoAntes: { etiqueta: "¿Fuiste beneficiario/a de Jóvenes creaTIvos en años anteriores?" },
  },
  legal: legalDe({
    pais: "ecu", trato: "tu", versionAnterior: "ecu-2027-provisional-1",
    ley: "Ley Orgánica de Protección de Datos Personales (LOPDP) de 2021", autoridad: "la Superintendencia de Protección de Datos Personales",
  }),
};
