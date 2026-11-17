// Panamá · definición del formulario (preguntas del formulario oficial 2026, con el diseño 2027). Es el más corto:
// una sola sede, ingresos en dólares y sin las preguntas del hogar ni las de participación anterior.
// La cédula panameña conserva sus guiones y prefijos (8-123-4567, PE-1-234, E-8-12345): regla "cedula_pa".
import type { DefinicionPais } from "../config/tipos";
import { EDAD_MINIMA, MAYORIA_DE_EDAD, OTRO_DOCUMENTO, ETIQUETAS_DISENO, PASAPORTE, conPrefieroNo, legalDe, opciones, opcionesComputadora, pasosLibre } from "./comunes";

export const definicion: DefinicionPais = {
  pais: "pan",
  config: {
    pais: "pan",
    nombre: "Panamá",
    habilitado: true,
    trato: "tu",
    telefono: "PA",
    // Ciudades cercanas: las del plan inicial, pendientes de confirmar con el equipo de Panamá.
    sedes: [{ id: "panama", nombre: "Ciudad de Panamá", ciudades: ["San Miguelito", "Arraiján", "La Chorrera", "Chepo", "Capira"] }],
    tiposDocumento: [
      { id: "cedula_juvenil", etiqueta: "Cédula juvenil", regla: { formato: "cedula_pa", min: 5, max: 15 }, ayuda: "Con sus guiones, como aparece en el documento (por ejemplo, 8-123-4567)." },
      { id: "cedula", etiqueta: "Cédula de Identidad", regla: { formato: "cedula_pa", min: 5, max: 15 }, ayuda: "Con sus guiones, como aparece en el documento (por ejemplo, 8-123-4567)." },
      PASAPORTE,
      { id: "residente", etiqueta: "Permiso de Residencia", regla: { formato: "alfanumerico", min: 5, max: 15 } },
      OTRO_DOCUMENTO,
    ],
    grados: [
      { id: "11", etiqueta: "11.°" },
      { id: "12", etiqueta: "12.°" },
      { id: "egresado", etiqueta: "Ya soy bachiller (egresado reciente)" },
    ],
    institucion: "Colegio",
    escalaNotas: { min: 1, max: 5 },
    edad: { minima: EDAD_MINIMA, alertaMayorDe: 30, mayoriaDeEdad: MAYORIA_DE_EDAD },
    maxAniosEgreso: 3,
  },
  reglas: { ubicacion: "libre", poblacionUnica: true, seleccionadoSiempre: false, tallaObligatoria: true },
  opciones: {
    computadora: opcionesComputadora("computadora"),
    ocupacion: opciones([
      ["estudiante", "Estudiante"], ["tiempo_completo", "Trabajador/a a tiempo completo"], ["tiempo_parcial", "Trabajador/a a tiempo parcial"],
      ["desempleado", "Desempleado/a"], ["emprendedor", "Emprendedor/a"], ["otro", "Otro"],
    ]),
    genero: conPrefieroNo(opciones([["femenino", "Femenino"], ["masculino", "Masculino"], ["no_binario", "No binario"], ["otro", "Otro"]])),
    poblaciones: conPrefieroNo(opciones([
      ["campesina", "Persona campesina"], ["indigena", "Persona perteneciente a pueblos indígenas"], ["afro", "Persona afrodescendiente"], ["lgbtiq", "Persona LGBTIQ+"],
      ["discapacidad", "Persona en condición de discapacidad"], ["madre_padre", "Persona que es madre o padre"], ["gestante", "Persona gestante"],
      ["rrom", "Persona del pueblo Rrom (Gitano)"], ["migrante", "Persona migrante"], ["otra", "Otra"],
    ])),
    ingresos: conPrefieroNo(opciones([
      ["usd_345", "Menos de USD 345"], ["usd_650", "USD 346–650"], ["usd_800", "USD 651–800"], ["usd_1200", "USD 801–1.200"], ["usd_mas", "Más de USD 1.200"],
    ])),
    tallas: opciones([["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]]),
    canales: opciones([
      ["facebook", "Facebook"], ["instagram", "Instagram"], ["correo", "Correo electrónico"], ["profesor", "Profesor de mi colegio"], ["prensa", "Prensa/Radio"],
      ["web", "Página web Fundación ROFÉ"], ["otro", "Otro"],
    ]),
  },
  pasos: pasosLibre({ cierre: ["ingles", "talla", "canal", "canalOtro"] }),
  etiquetas: {
    ...ETIQUETAS_DISENO,
    documento: { ayuda: "" },
    institucion: { etiqueta: "Colegio en el que estudias o estudiaste" },
    computadora: { etiqueta: "¿Tienes acceso a una computadora para estudiar y practicar durante el programa?" },
    talla: { etiqueta: "Talla de camisa", ayuda: "" },
  },
  legal: legalDe({ pais: "pan", trato: "tu", versionAnterior: "pan-2027-provisional-1" }),
};
