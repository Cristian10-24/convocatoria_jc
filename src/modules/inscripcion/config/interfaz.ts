// Textos de la interfaz del formulario 2027 (los del lienzo de Claude Design), con el trato de cada país.
// Los mensajes de validación siguen en textos.ts. {clave} se reemplaza con plantilla().
import type { TextoTrato } from "./tipos";

export const IU = {
  titulo: "Inscripción {anio}",
  volver: "Volver a la convocatoria",
  guardado: "Guardado automático",
  tiempo: "Menos de 10 minutos",
  progreso: "Paso {n} de {t} · {paso}",
  progresoAria: "Progreso de la inscripción",
  tuInscripcion: "Tu inscripción",
  anterior: "Anterior",
  siguiente: "Siguiente",
  enviar: "Enviar inscripción",
  enviando: "Enviando…",
  editar: "Editar",
  opcional: " (opcional)",
  otraCiudad: "Otra ciudad",
  ciudad: {
    pregunta: { tu: "¿En qué ciudad vives?", vos: "¿En qué ciudad vivís?" },
    noEsta: "Mi ciudad no está en la lista",
    buscar: { tu: "Busca tu ciudad", vos: "Buscá tu ciudad" },
    sinResultados: { tu: "No la encontramos. Elige «Mi ciudad no está en la lista» y escríbela.", vos: "No la encontramos. Elegí «Mi ciudad no está en la lista» y escribila." },
  },
  otraCiudadDe: "Otra ciudad de {pais}",
  ciudadOtraLista: "Otra",
  dia: "Día", mes: "Mes", anio: "Año",
  meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  edad: { tu: "Tienes {edad} años.", vos: "Tenés {edad} años." },
  edadMenor: { tu: " Como eres menor de edad, en el siguiente paso te pedimos los datos de un adulto responsable.", vos: " Como sos menor de edad, en el siguiente paso te pedimos los datos de un adulto responsable." },
  escala: "Del {min} al {max}.",
  sugerencia: "¿Quisiste decir {correo}?",
  usarSugerencia: "Usar",
  falta1: "Falta 1 dato.",
  faltan: "Faltan {n} datos.",
  marcamos: "Te marcamos en rojo lo que falta.",
  privacidadTitulo: "Tu privacidad.",
  // Respaldado por la política oficial (DE-010-D): datos sensibles, autorización expresa y confidencialidad.
  privacidad: { tu: "Son datos sensibles: solo se tratan con tu autorización expresa y la Fundación se compromete a cuidar su confidencialidad. Puedes elegir «Prefiero no responder».", vos: "Son datos sensibles: solo se tratan con tu autorización expresa y la Fundación se compromete a cuidar su confidencialidad. Podés elegir «Prefiero no responder»." },
  privacidadEnlace: "Cómo usamos tus datos",
  lateral: { gratis: "100 % gratuito.", gratisTexto: "Nunca te pediremos pagos.", confidencial: "Tus datos son confidenciales.", dudas: "¿Dudas?" },
  resumen: { titulo: { tu: "Revisa tus respuestas", vos: "Revisá tus respuestas" }, corto: "Resumen", descripcion: { tu: "Si algo no está bien, toca «Editar».", vos: "Si algo no está bien, tocá «Editar»." } },
  autorizacion: {
    titulo: "Autorización de datos", corto: "Autorización de datos",
    descripcion: { tu: "Antes de enviar, revisa y acepta cómo vamos a usar tus datos.", vos: "Antes de enviar, revisá y aceptá cómo vamos a usar tus datos." },
    politica: "Leer la Política de Tratamiento de Datos completa",
    verificacion: "Verificación de seguridad",
  },
  errores: {
    conexionTitulo: "No pudimos enviar tu inscripción.",
    conexion: { tu: "Parece un problema de conexión o nuestro. Intenta de nuevo en unos minutos: tus respuestas siguen guardadas en este dispositivo.", vos: "Parece un problema de conexión o nuestro. Intentá de nuevo en unos minutos: tus respuestas siguen guardadas en este dispositivo." },
    reintentar: "Reintentar",
    limite: { tu: "Recibimos demasiados intentos desde tu conexión. Espera unos minutos e intenta otra vez.", vos: "Recibimos demasiados intentos desde tu conexión. Esperá unos minutos e intentá otra vez." },
    verificacion: { tu: "No pudimos completar la verificación de seguridad. Revisa tu conexión y toca «Enviar inscripción» otra vez: tus respuestas siguen guardadas.", vos: "No pudimos completar la verificación de seguridad. Revisá tu conexión y tocá «Enviar inscripción» otra vez: tus respuestas siguen guardadas." },
    datos: { tu: "Hay datos por corregir. Te llevamos al paso correspondiente.", vos: "Hay datos por corregir. Te llevamos al paso correspondiente." },
  },
  ok: {
    titulo: "Inscripción recibida",
    cuerpo: "Gracias, {nombre}. Tu inscripción a Jóvenes creaTIvos {anio} en {pais} quedó registrada.",
    // Lo que ve la persona es "número de inscripción"; internamente el campo sigue siendo `radicado`.
    radicado: "Número de inscripción",
    copiar: "Copiar", copiado: "Copiado",
    /** {correo}: el contacto del programa (CONTACTO.correo), que se muestra como enlace. */
    guardar: { tu: "Guárdalo: para cualquier consulta sobre tu inscripción puedes usar este número o tu número de documento, escribiendo a {correo}.", vos: "Guardalo: para cualquier consulta sobre tu inscripción podés usar este número o tu número de documento, escribiendo a {correo}." },
    pasos: [
      { titulo: "Revisamos tu inscripción", texto: "Validamos que cumplas los requisitos." },
      { titulo: "Te contactamos", texto: "Por WhatsApp o correo, con los siguientes pasos." },
      { titulo: "Inicio en marzo de 2027", texto: "El cronograma detallado te llega por correo." },
    ],
    compartir: { tu: "Comparte la convocatoria", vos: "Compartí la convocatoria" },
    mensajeCompartir: "Convocatoria Jóvenes creaTIvos 2027: beca del 100 % para aprender desarrollo de software desde cero.",
    enlace: "Copiar enlace", enlaceCopiado: "Enlace copiado",
  },
  duplicado: {
    titulo: { tu: "Ya tienes una inscripción", vos: "Ya tenés una inscripción" },
    cuerpo: { tu: "Ya existe una inscripción a Jóvenes creaTIvos {anio} en {pais} con ese documento. No hace falta que te inscribas de nuevo.", vos: "Ya existe una inscripción a Jóvenes creaTIvos {anio} en {pais} con ese documento. No hace falta que te inscribas de nuevo." },
    corregir: { tu: "¿Necesitas corregir un dato o crees que es un error? Escríbenos a", vos: "¿Necesitás corregir un dato o creés que es un error? Escribinos a" },
    conDocumento: "con tu número de documento.",
  },
  cerradas: {
    // {etapa}: "inscripciones" o "preinscripciones", según el país (ver etapaDe en shared/config/convocatoria.ts).
    titulo: "Las {etapa} en {pais} están cerradas",
    cuerpo: "Las {etapa} de la cohorte {anio} ya terminaron. Si ya te inscribiste, tu inscripción sigue en revisión.",
    dudas: { tu: "Escríbenos a", vos: "Escribinos a" },
    dudas2: { tu: "si tienes dudas, o sigue nuestras redes.", vos: "si tenés dudas, o seguí nuestras redes." },
  },
  pronto: {
    titulo: "Las {etapa} en {pais} abren muy pronto",
    cuerpo: { tu: "El formulario de {pais} todavía no está abierto. En la página de la convocatoria puedes dejar tu correo para que te avisemos.", vos: "El formulario de {pais} todavía no está abierto. En la página de la convocatoria podés dejar tu correo para que te avisemos." },
  },
  paso0: {
    progreso: "Antes de empezar · País",
    titulo: "¿En qué país vives?",
    descripcion: "Así cargamos el formulario de tu país.",
    ayuda: "Cada país tiene su propio formulario. Al elegir, seguimos con tu ciudad.",
    estado: { proxima: "Abre muy pronto", cerrada: "Inscripciones cerradas", mantenimiento: "En mantenimiento" },
  },
  cargando: "Cargando el formulario…",
} as const satisfies Record<string, unknown>;

export type TextoIU = TextoTrato;
