// Colombia · definición del formulario (preguntas del formulario oficial 2026, con el diseño 2027).
// Tiene lo que no tiene Uruguay: condiciones laborales, vivienda, estrato, núcleo familiar, elementos y servicios del
// hogar, nivel de software, lenguajes e inglés. Pendiente de confirmar con el equipo del país: rango de edad 2027.
import type { DefinicionPais } from "../config/tipos";
import { EDAD_MINIMA, MAYORIA_DE_EDAD, ETIQUETAS_DISENO, PASAPORTE, conPrefieroNo, legalDe, opciones, opcionesComputadora, pasosLibre } from "./comunes";

export const definicion: DefinicionPais = {
  pais: "col",
  config: {
    pais: "col",
    nombre: "Colombia",
    habilitado: true,
    trato: "tu",
    telefono: "CO",
    sedes: [
      // Ciudades cercanas: las del plan inicial, pendientes de confirmar con el equipo de Colombia. El Valle de Aburrá
      // va como ciudades cercanas de Medellín.
      { id: "barranquilla", nombre: "Barranquilla", ciudades: ["Soledad", "Malambo", "Puerto Colombia", "Galapa"] },
      { id: "bogota", nombre: "Bogotá D.C.", ciudades: ["Soacha", "Chía", "Funza", "Mosquera", "Madrid", "Cota"] },
      { id: "cali", nombre: "Cali", ciudades: ["Jamundí", "Palmira", "Yumbo", "Candelaria"] },
      { id: "cartagena", nombre: "Cartagena de Indias", ciudades: ["Turbaco", "Arjona"] },
      { id: "medellin", nombre: "Medellín", ciudades: ["Bello", "Itagüí", "Envigado", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Barbosa"] },
    ],
    tiposDocumento: [
      { id: "cc", etiqueta: "Cédula de Ciudadanía", regla: { formato: "numerico", min: 6, max: 10 } },
      { id: "ti", etiqueta: "Tarjeta de identidad", regla: { formato: "numerico", min: 10, max: 11 } },
      { id: "ce", etiqueta: "Cédula de Extranjería", regla: { formato: "numerico", min: 6, max: 12 } },
      PASAPORTE,
      { id: "ppt", etiqueta: "PPT", regla: { formato: "numerico", min: 6, max: 12 } },
    ],
    grados: [
      { id: "10", etiqueta: "10.°" },
      { id: "11", etiqueta: "11.°" },
      { id: "egresado", etiqueta: "Ya soy bachiller" },
    ],
    institucion: "Institución educativa",
    escalaNotas: { min: 1, max: 5 },
    edad: { minima: EDAD_MINIMA, alertaMayorDe: 25, mayoriaDeEdad: MAYORIA_DE_EDAD },
    maxAniosEgreso: 3,
  },
  reglas: { ubicacion: "libre", poblacionUnica: true, seleccionadoSiempre: true, tallaObligatoria: true },
  opciones: {
    computadora: opcionesComputadora("computador"),
    ocupacion: opciones([["estudio", "Estudio"], ["trabajo", "Trabajo"], ["emprendo", "Emprendo"], ["ninguna", "No trabajo ni estudio ni emprendo"]]),
    genero: conPrefieroNo(opciones([["femenino", "Femenino"], ["masculino", "Masculino"], ["no_binario", "No binario"], ["no_sabe", "No sé / No respondo"], ["otro", "Otro"]])),
    poblaciones: conPrefieroNo(opciones([
      ["campesina", "Persona campesina"], ["indigena", "Persona perteneciente a pueblos indígenas"], ["afro", "Persona afrodescendiente"], ["lgbtiq", "Persona LGBTIQ+"],
      ["palenquera", "Persona palenquera o raizal"], ["discapacidad", "Persona en condición de discapacidad"], ["madre_padre", "Persona que es madre o padre"],
      ["gestante", "Persona gestante"], ["victima", "Persona víctima del conflicto armado"], ["rrom", "Persona del pueblo Rrom (Gitano)"], ["migrante", "Persona migrante"],
      ["retornada", "Persona colombiana retornada"], ["ninguna", "Ninguna de las anteriores"], ["otra", "Otra"],
    ])),
    ingresos: conPrefieroNo(opciones([["menos1", "Menor a 1 salario mínimo"], ["1a2", "Entre 1 y 2 salarios mínimos"], ["mas2", "Mayor a 2 salarios mínimos"]])),
    tallas: opciones([["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]]),
    canales: opciones([
      ["facebook", "Facebook"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["correo", "Correo electrónico"],
      ["familiar", "Me contó un familiar"], ["sms", "Mensaje de texto"], ["visita", "Visita informativa a mi institución educativa"], ["profesor", "Profesor de mi institución educativa"],
      ["dps", "DPS (Familias en Acción / Jóvenes en Acción / Renta solidaria)"], ["participante", "Me contó un(a) participante de Jóvenes creaTIvos de años anteriores"],
      ["web", "Página web Fundación ROFÉ"], ["medios", "Medios de comunicación"], ["embajador", "Embajador"], ["otro", "Otro"],
    ]),
  },
  pasos: pasosLibre({
    perfil: ["laboral"],
    sociodemograficos: ["vivienda", "estrato", "nucleo", "elementos", "servicios"],
    cierre: ["conocimiento", "lenguajes", "ingles", "talla", "canal", "embajador", "canalOtro", "aplicoAntes", "seleccionadoAntes"],
  }),
  etiquetas: {
    ...ETIQUETAS_DISENO,
    institucion: { etiqueta: "Institución educativa en la que estudias o estudiaste" },
    computadora: { etiqueta: "¿Tienes acceso a un computador para estudiar y practicar durante el programa?" },
    talla: { etiqueta: "Talla de camisa", ayuda: "" },
    seleccionadoAntes: { etiqueta: "¿Fuiste beneficiario/a de Jóvenes creaTIvos en años anteriores?" },
  },
  legal: legalDe({ pais: "col", trato: "tu", versionAnterior: "col-2027-provisional-1", ley: "Ley 1581 de 2012", autoridad: "la Superintendencia de Industria y Comercio" }),
};
