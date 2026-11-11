// Textos de la interfaz del formulario y mensajes de error, con el trato de cada país (tú / vos).
import type { TextoTrato, Trato } from "./tipos";

/** Resuelve un texto según el trato. */
export function txt(t: TextoTrato, trato: Trato): string {
  return typeof t === "string" ? t : t[trato];
}

/** Mensajes de validación (los usa schema.ts en el navegador y en el servidor). */
export const MENSAJES = {
  obligatorio: { tu: "Responde esta pregunta.", vos: "Respondé esta pregunta." },
  elegir: { tu: "Elige una opción.", vos: "Elegí una opción." },
  elegirAlMenosUna: { tu: "Elige al menos una opción.", vos: "Elegí al menos una opción." },
  cual: { tu: "Escribe cuál.", vos: "Escribí cuál." },
  nombre: { tu: "Escribe solo letras (puedes usar tildes, espacios y guiones).", vos: "Escribí solo letras (podés usar tildes, espacios y guiones)." },
  texto: { tu: "Escribe una respuesta válida.", vos: "Escribí una respuesta válida." },
  direccion: { tu: "Escribe la dirección completa (calle y número).", vos: "Escribí la dirección completa (calle y número)." },
  documento: "El número no es válido para ese tipo de identificación.",
  fecha: { tu: "Escribe una fecha válida.", vos: "Escribí una fecha válida." },
  fechaFutura: "La fecha no puede ser posterior a hoy.",
  edadMinima: { tu: "Para inscribirte necesitas tener al menos {min} años.", vos: "Para inscribirte necesitás tener al menos {min} años." },
  correo: "El correo no tiene un formato válido (ejemplo: nombre@gmail.com).",
  celular: { tu: "Escribe un número válido (ejemplo: {ejemplo}).", vos: "Escribí un número válido (ejemplo: {ejemplo})." },
  alternoIgual: "El número alterno debe ser distinto del WhatsApp.",
  anio: { tu: "Escribe un año válido.", vos: "Escribí un año válido." },
  promedio: { tu: "Escribe una nota entre {min} y {max} (puede tener decimales, como 4,5).", vos: "Escribí una nota entre {min} y {max} (puede tener decimales, como 8,5)." },
  aceptar: { tu: "Debes aceptar para enviar la inscripción.", vos: "Tenés que aceptar para enviar la inscripción." },
  acudienteAutoriza: "El adulto responsable debe autorizar la inscripción.",
} satisfies Record<string, TextoTrato>;

export const UI = {
  pasoDe: "Paso {n} de {t}",
  siguiente: "Siguiente",
  anterior: "Anterior",
  enviar: "Enviar inscripción",
  enviando: "Enviando…",
  revisa: { tu: "Revisa los campos marcados.", vos: "Revisá los campos marcados." },
  borrador: { tu: "Guardamos lo que escribes en este dispositivo hasta que envíes la inscripción.", vos: "Guardamos lo que escribís en este dispositivo hasta que envíes la inscripción." },
  resumen: { tu: "Revisa tus datos antes de enviar", vos: "Revisá tus datos antes de enviar" },
  editar: "Editar",
  seleccionar: { tu: "Selecciona…", vos: "Seleccioná…" },
  primeroSede: { tu: "Primero elige la sede", vos: "Primero elegí la sede" },
  ciudadOtra: "Otra",
  escala: "Escala del {min} al {max}.",
  avance: "Avance del formulario",
  cargando: "Cargando el formulario…",
  sugerencia: "¿Quisiste decir {correo}?",
  usarSugerencia: "Usar",
  verificacion: "Verificación de seguridad",
  errores: {
    duplicado: { tu: "Ya existe una inscripción con ese documento en esta convocatoria. Si crees que es un error, escríbenos.", vos: "Ya existe una inscripción con ese documento en esta convocatoria. Si creés que es un error, escribinos." },
    cerrada: "Las inscripciones para este país no están abiertas en este momento.",
    limite: "Recibimos demasiados intentos desde tu conexión. Espera unos minutos e intenta otra vez.",
    verificacion: { tu: "No pudimos verificar que no eres un robot. Recarga la verificación e intenta otra vez.", vos: "No pudimos verificar que no sos un robot. Recargá la verificación e intentá otra vez." },
    bot: "No pudimos procesar el envío. Intenta otra vez en unos segundos.",
    red: { tu: "No hay conexión o el servidor no respondió. Tus datos siguen aquí: intenta otra vez.", vos: "No hay conexión o el servidor no respondió. Tus datos siguen acá: intentá otra vez." },
    datos_invalidos: { tu: "Hay datos por corregir. Te llevamos al paso correspondiente.", vos: "Hay datos por corregir. Te llevamos al paso correspondiente." },
    interno: "Ocurrió un error inesperado. Intenta otra vez en unos minutos.",
  },
  exito: {
    titulo: "¡Inscripción recibida!",
    cuerpo: { tu: "Gracias, {nombre}. Tu inscripción a Jóvenes creaTIvos {anio} en {pais} quedó registrada.", vos: "Gracias, {nombre}. Tu inscripción a Jóvenes creaTIvos {anio} en {pais} quedó registrada." },
    radicado: "Número de inscripción",
    guardar: { tu: "Guarda este número: te lo pediremos si necesitas consultar tu inscripción.", vos: "Guardá este número: te lo vamos a pedir si necesitás consultar tu inscripción." },
    siguientes: { tu: "Revisaremos tu inscripción y te contactaremos por WhatsApp o correo con los siguientes pasos.", vos: "Vamos a revisar tu inscripción y te vamos a contactar por WhatsApp o correo con los siguientes pasos." },
    volver: "Volver a la convocatoria",
  },
  noDisponible: {
    proxima: { titulo: "Inscripciones muy pronto", cuerpo: { tu: "El formulario de {pais} todavía no está abierto. Vuelve pronto.", vos: "El formulario de {pais} todavía no está abierto. Volvé pronto." } },
    cerrada: { titulo: "Inscripciones cerradas", cuerpo: "Las inscripciones de esta convocatoria en {pais} ya cerraron. ¡Gracias por tu interés!" },
  },
} as const;

/** Reemplaza {clave} por su valor. */
export function plantilla(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? `{${k}}`));
}
