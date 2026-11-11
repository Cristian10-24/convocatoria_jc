// Preguntas del formulario (contenido del formulario oficial de Jóvenes creaTIvos), iguales para los 4 países.
// Para cambiar un texto u opción, se edita aquí; la lógica (schema.ts) usa los `id`, que NO deben cambiar
// porque se guardan en la base y se usan en el panel.
// Lo que depende del país (sedes, documentos, grados, escala de notas) está en config/paises.ts.
import type { IdPaso, Opcion, TextoTrato } from "./tipos";

// ---------- Opciones ----------
export const SI_NO: Opcion[] = [
  { id: "si", etiqueta: "Sí" },
  { id: "no", etiqueta: "No" },
];

export const RELACION_ACUDIENTE: Opcion[] = [
  { id: "padre", etiqueta: "Padre" },
  { id: "madre", etiqueta: "Madre" },
  { id: "acudiente", etiqueta: "Acudiente" },
  { id: "tutor", etiqueta: "Tutor" },
  { id: "otro", etiqueta: "Otro" },
];

export const COMPUTADORA: Opcion[] = [
  { id: "propia", etiqueta: "Sí, tengo una computadora personal." },
  { id: "prestada", etiqueta: "No tengo, pero puedo acceder o pedir prestada una." },
  { id: "ninguna", etiqueta: "No tengo acceso a una computadora." },
];

export const AUTONOMIA: Opcion[] = [
  { id: "si", etiqueta: "Sí, me adapto bien al aprendizaje en línea." },
  { id: "algo", etiqueta: "Tengo algo de experiencia, pero necesito mejorar." },
  { id: "no", etiqueta: "No me siento cómodo/a con el aprendizaje en línea." },
];

export const HORAS: Opcion[] = [
  { id: "mas15", etiqueta: "Más de 15 horas." },
  { id: "10a15", etiqueta: "Entre 10 y 15 horas." },
  { id: "5a10", etiqueta: "Entre 5 y 10 horas." },
  { id: "menos5", etiqueta: "Menos de 5 horas." },
];

export const OCUPACION: Opcion[] = [
  { id: "estudiante", etiqueta: "Estudiante." },
  { id: "tiempo_completo", etiqueta: "Trabajador/a a tiempo completo." },
  { id: "tiempo_parcial", etiqueta: "Trabajador/a a tiempo parcial." },
  { id: "desempleado", etiqueta: "Desempleado/a." },
  { id: "emprendedor", etiqueta: "Emprendedor/a." },
  { id: "otro", etiqueta: "Otro" },
];

export const EMPRENDIMIENTO: Opcion[] = [
  { id: "si", etiqueta: "Sí, estoy trabajando en un emprendimiento/proyecto." },
  { id: "considerando", etiqueta: "No, pero estoy considerando iniciar uno." },
  { id: "no", etiqueta: "No, no tengo emprendimientos o proyectos personales." },
];

export const OTRAS_POSTULACIONES: Opcion[] = [
  { id: "esperando", etiqueta: "Sí, me he postulado y estoy esperando respuesta." },
  { id: "aceptado", etiqueta: "Sí, me he postulado y ya fui aceptado/a." },
  { id: "no_aceptado", etiqueta: "Sí, me he postulado y no fui aceptado/a." },
  { id: "no", etiqueta: "No, no me he postulado a otros programas." },
];

export const GENERO: Opcion[] = [
  { id: "femenino", etiqueta: "Femenino" },
  { id: "masculino", etiqueta: "Masculino" },
  { id: "no_binario", etiqueta: "No binario" },
];

/** "ninguna" es excluyente: al marcarla se desmarcan las demás. */
export const POBLACIONES: Opcion[] = [
  { id: "rural", etiqueta: "Población rural" },
  { id: "discapacidad", etiqueta: "Persona en situación de discapacidad" },
  { id: "lgbtiq", etiqueta: "Población LGBTIQ+" },
  { id: "afro", etiqueta: "Persona afrodescendiente" },
  { id: "migrante", etiqueta: "Persona migrante" },
  { id: "gestante", etiqueta: "Mujer gestante" },
  { id: "padre_adolescente", etiqueta: "Padre o madre adolescente" },
  { id: "otra", etiqueta: "Otra" },
  { id: "ninguna", etiqueta: "Ninguna de las anteriores" },
];
export const POBLACION_NINGUNA = "ninguna";

export const INGRESOS: Opcion[] = [
  { id: "menos1", etiqueta: "Son menores a un salario mínimo" },
  { id: "1a2", etiqueta: "Entre 1 y 2 salarios mínimos" },
  { id: "mas2", etiqueta: "Mayores a 2 salarios mínimos" },
];

export const TALLAS: Opcion[] = ["XS", "S", "M", "L", "XL", "XXL"].map((t) => ({ id: t.toLowerCase(), etiqueta: t }));

export const CANALES: Opcion[] = [
  { id: "participante", etiqueta: "Me lo contó un(a) participante de Jóvenes creaTIvos de años anteriores" },
  { id: "facebook", etiqueta: "Facebook" },
  { id: "instagram", etiqueta: "Instagram" },
  { id: "correo", etiqueta: "Correo electrónico" },
  { id: "profesor", etiqueta: { tu: "Un profesor de mi colegio o liceo", vos: "Un profesor de mi liceo" } },
  { id: "prensa", etiqueta: "Prensa" },
  { id: "embajador", etiqueta: "Embajador" },
  { id: "otro", etiqueta: "Otro" },
];

// ---------- Preguntas (etiqueta y ayuda) ----------
type Texto = { etiqueta: TextoTrato; ayuda?: TextoTrato; placeholder?: string };

export const PREGUNTAS = {
  sede: { etiqueta: "Sede a la que asistirías", ayuda: "Los encuentros presenciales son una vez al mes en esta sede." },
  ciudad: { etiqueta: "Ciudad o población de residencia" },
  ciudadOtra: { etiqueta: { tu: "¿En qué ciudad vives?", vos: "¿En qué ciudad vivís?" } },
  direccion: { etiqueta: "Dirección residencial", placeholder: "Calle, número, barrio" },

  nombres: { etiqueta: "Nombres" },
  apellidos: { etiqueta: "Apellidos" },
  tipoDocumento: { etiqueta: "Tipo de identificación" },
  tipoDocumentoOtro: { etiqueta: "¿Cuál?" },
  documento: { etiqueta: "Número de identificación" },
  fechaNacimiento: { etiqueta: "Fecha de nacimiento" },
  correo: { etiqueta: "Correo electrónico", ayuda: { tu: "Verifica que esté bien escrito: por ahí te contactaremos.", vos: "Verificá que esté bien escrito: por ahí te vamos a contactar." }, placeholder: "nombre@gmail.com" },
  whatsapp: { etiqueta: "Número de WhatsApp", ayuda: { tu: "Verifica que esté bien escrito.", vos: "Verificá que esté bien escrito." } },
  telefonoAlterno: { etiqueta: "Número alterno", ayuda: "Otro número para contactarte (distinto del WhatsApp)." },

  acudienteNombres: { etiqueta: "Nombres" },
  acudienteApellidos: { etiqueta: "Apellidos" },
  acudienteCorreo: { etiqueta: "Correo electrónico" },
  acudienteTelefono: { etiqueta: "Número de teléfono" },
  acudienteRelacion: { etiqueta: { tu: "Relación contigo", vos: "Relación con vos" } },
  acudienteRelacionOtra: { etiqueta: "¿Cuál?" },

  grado: { etiqueta: { tu: "Grado que cursas", vos: "Grado que cursás" } },
  anioEgreso: { etiqueta: { tu: "¿En qué año terminaste la secundaria?", vos: "¿En qué año terminaste el liceo?" } },
  promedio: { etiqueta: "¿Cuál es tu nota promedio?" },
  institucion: { etiqueta: { tu: "Institución en la que estudias o estudiaste", vos: "Liceo en el que estudiás o estudiaste" } },
  internet: { etiqueta: "Tengo acceso a internet" },
  computadora: { etiqueta: { tu: "¿Tienes acceso a una computadora propia para estudiar y practicar durante el programa?", vos: "¿Tenés acceso a una computadora propia para estudiar y practicar durante el programa?" } },
  autonomia: { etiqueta: { tu: "¿Te sientes cómodo/a aprendiendo de manera autónoma y utilizando plataformas en línea para estudiar?", vos: "¿Te sentís cómodo/a aprendiendo de manera autónoma y usando plataformas en línea para estudiar?" } },
  horas: { etiqueta: { tu: "¿Cuántas horas semanales puedes dedicar de manera exclusiva a este programa?", vos: "¿Cuántas horas semanales podés dedicar de manera exclusiva a este programa?" } },

  ocupacion: { etiqueta: "¿Cuál es tu ocupación actual?", ayuda: { tu: "Puedes elegir más de una opción.", vos: "Podés elegir más de una opción." } },
  ocupacionOtra: { etiqueta: "¿Cuál?" },
  emprendimiento: { etiqueta: { tu: "¿Actualmente tienes algún emprendimiento o proyecto personal en curso?", vos: "¿Actualmente tenés algún emprendimiento o proyecto personal en curso?" } },
  otrasPostulaciones: { etiqueta: { tu: "¿Te has postulado recientemente a otros programas educativos, universitarios u oportunidades similares?", vos: "¿Te postulaste recientemente a otros programas educativos, universitarios u oportunidades similares?" } },
  aplicoAntes: { etiqueta: "He aplicado anteriormente para participar en Jóvenes creaTIvos" },
  seleccionadoAntes: { etiqueta: "Fui seleccionado/a en Jóvenes creaTIvos en años anteriores" },

  genero: { etiqueta: { tu: "¿Cómo te identificas en cuanto a género?", vos: "¿Cómo te identificás en cuanto a género?" } },
  poblaciones: { etiqueta: { tu: "¿Con cuáles de estas poblaciones te identificas?", vos: "¿Con cuáles de estas poblaciones te identificás?" }, ayuda: { tu: "Puedes elegir varias. Si perteneces a otra, elige «Otra» y escribe cuál.", vos: "Podés elegir varias. Si pertenecés a otra, elegí «Otra» y escribí cuál." } },
  poblacionOtra: { etiqueta: "¿Cuál?" },
  ingresos: { etiqueta: "Los ingresos en tu hogar…" },
  talla: { etiqueta: "Talla de camiseta", ayuda: "Para la camiseta de Jóvenes creaTIvos." },

  canal: { etiqueta: { tu: "¿Cómo te enteraste de esta convocatoria?", vos: "¿Cómo te enteraste de esta convocatoria?" } },
  canalOtro: { etiqueta: "¿Cuál?" },
  embajador: { etiqueta: { tu: "¿Recuerdas el nombre o código del embajador que te compartió la inscripción?", vos: "¿Te acordás del nombre o código del embajador que te compartió la inscripción?" }, ayuda: { tu: "Si no lo recuerdas, danos algún dato para identificarlo (ciudad o teléfono).", vos: "Si no te acordás, danos algún dato para identificarlo (ciudad o teléfono)." } },
  aceptaDatos: { etiqueta: "He leído y acepto los Términos y Políticas de Protección de Datos de la Fundación ROFÉ" },
  autorizaAcudiente: { etiqueta: "Como padre, madre, acudiente o tutor, autorizo la inscripción y el tratamiento de los datos de la persona menor de edad" },
} satisfies Record<string, Texto>;

export type IdCampo = keyof typeof PREGUNTAS;

// ---------- Pasos ----------
export type Paso = { id: IdPaso; titulo: TextoTrato; descripcion?: TextoTrato; campos: IdCampo[] };

export const PASOS: Paso[] = [
  { id: "ubicacion", titulo: { tu: "Dónde vives", vos: "Dónde vivís" }, descripcion: { tu: "Elige la sede más cercana y tu ciudad.", vos: "Elegí la sede más cercana y tu ciudad." }, campos: ["sede", "ciudad", "ciudadOtra", "direccion"] },
  { id: "personales", titulo: "Datos personales", campos: ["nombres", "apellidos", "tipoDocumento", "tipoDocumentoOtro", "documento", "fechaNacimiento", "correo", "whatsapp", "telefonoAlterno"] },
  { id: "acudiente", titulo: "Padre, madre, acudiente o tutor", descripcion: { tu: "Como eres menor de edad, necesitamos los datos de un adulto responsable.", vos: "Como sos menor de edad, necesitamos los datos de un adulto responsable." }, campos: ["acudienteNombres", "acudienteApellidos", "acudienteCorreo", "acudienteTelefono", "acudienteRelacion", "acudienteRelacionOtra"] },
  { id: "estudios", titulo: "Estudios y disponibilidad", campos: ["grado", "anioEgreso", "promedio", "institucion", "internet", "computadora", "autonomia", "horas"] },
  { id: "perfil", titulo: { tu: "Sobre ti", vos: "Sobre vos" }, campos: ["ocupacion", "ocupacionOtra", "emprendimiento", "otrasPostulaciones", "aplicoAntes", "seleccionadoAntes"] },
  { id: "sociodemograficos", titulo: "Datos sociodemográficos", descripcion: "Nos ayudan a asignar mejor el programa. Son confidenciales.", campos: ["genero", "poblaciones", "poblacionOtra", "ingresos", "talla"] },
  { id: "cierre", titulo: "Último paso", campos: ["canal", "canalOtro", "embajador", "aceptaDatos", "autorizaAcudiente"] },
];
