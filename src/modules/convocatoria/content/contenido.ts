// Contenido de las landings 2027 (principal y por país). Los textos son los del lienzo de Claude Design; los
// componentes solo los dibujan. Lo que depende del trato (tú / vos) sale de `voz`: Uruguay va en voseo.
// Lo que la Fundación aún no confirma va marcado con `pendiente` y se muestra resaltado (ver MOSTRAR_PENDIENTES).
import { SEGMENTO_URL, type PaisSlug } from "@/shared/config/paises";

/** Cohorte a la que se convoca. */
export const COHORTE = { anio: 2027, inicio: "Marzo de 2027", fin: "Noviembre de 2027", horasSemana: 8 } as const;

/**
 * Cierre de las preinscripciones de URUGUAY si CONVOCATORIA_CONFIG no trae "cierra" (con "cierra", manda esa).
 * Los demás países no tienen fecha hasta que se configure: no se inventa ninguna.
 */
export const CIERRE_PRIMERA_ETAPA = "2026-12-18";

/**
 * Muestra los datos pendientes tal como los marca el diseño ([CITA], [LOGO ALIADO], [ENLACES DE REDES]...).
 * Antes de publicar: completar los datos o poner esto en false para ocultar lo que siga pendiente.
 */
export const MOSTRAR_PENDIENTES = false;

export const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

// ---------- Trato ----------
export type Voz = {
  aprende: string; convierte: string; habilidades: string; necesitas: string; avisame: string; marca: string;
  cumples: string; pasa: string; elige: string; todo: string; quiero: string; tienes: string;
};
const HABILIDADES = "tus competencias personales, aprendiendo a trabajar en equipo, liderar con confianza y resolver conflictos.";
const TU: Voz = {
  aprende: "Aprende a programar ", convierte: "Convierte tu idea en ", habilidades: `Fortalece ${HABILIDADES}`, necesitas: "¿Qué necesitas ",
  avisame: "Avísame", marca: "Marca", cumples: "cumples", pasa: "Pasa", elige: "elige", todo: "¡Cumples con todo! Ya puedes inscribirte.",
  quiero: "Sí, quiero inscribirme", tienes: "Tienes",
};
const VOS: Voz = {
  aprende: "Aprendé a programar ", convierte: "Convertí tu idea en ", habilidades: `Fortalecé ${HABILIDADES}`, necesitas: "¿Qué necesitás ",
  avisame: "Avisame", marca: "Marcá", cumples: "cumplís", pasa: "Pasá", elige: "elegí", todo: "¡Cumplís con todo! Ya podés inscribirte.",
  quiero: "Sí, quiero inscribirme", tienes: "Tenés",
};

// ---------- Fotos ----------
/** Ancho y alto reales de cada foto de public/convocatoria (para reservar el espacio y que la página no salte). */
const MEDIDAS = {
  "col-aula-2": [1280, 960], "col-aula": [1600, 900], "col-codigo": [1600, 1200], "col-comunidad": [1600, 1200], "col-grupo": [1600, 1200],
  "col-hero-2": [1600, 1200], "col-hero": [1600, 1200], "col-monitor-1": [1600, 1198], "col-monitor-2": [1600, 900], "col-taller": [1600, 1200],
  "col-visita": [1600, 1200], "ecu-aula-2": [1600, 1200], "ecu-aula": [1600, 1200], "ecu-codigo": [1600, 1200], "ecu-comunidad": [1600, 1200],
  "ecu-hero-2": [1600, 1200], "ecu-hero": [1600, 1067], "ecu-monitor-1": [1600, 1200], "ecu-monitor-2": [1600, 1200], "ecu-proyecto": [1600, 1200],
  "ecu-taller": [1600, 1200], "ecu-visita-2": [1280, 874], "ecu-visita": [1600, 1200], "pan-aula-2": [1600, 709], "pan-aula": [1600, 709],
  "pan-comunidad": [1280, 960], "pan-hero-2": [1600, 1067], "pan-hero": [1600, 1067], "pan-inauguracion": [1600, 1067], "pan-monitor-1": [1600, 709],
  "pan-monitor-2": [1600, 2133], "pan-reto": [1600, 2133], "pan-taller": [1600, 1200], "uy-aula-2": [1600, 900], "uy-aula": [1600, 738],
  "uy-comunidad": [1600, 900], "uy-hero-2": [1600, 1200], "uy-hero": [1600, 1200], "uy-monitor-1": [1600, 738], "uy-monitor-2": [1600, 900],
  "uy-taller": [1600, 900], "uy-visita": [1600, 738],
} as const satisfies Record<string, readonly [number, number]>;
export type IdFoto = keyof typeof MEDIDAS;

export type Foto = { id: IdFoto; src: string; src800: string; ancho: number; alto: number; alt: string; /** object-position */ pos?: string };

export function foto(id: IdFoto, alt: string, pos?: string): Foto {
  const corte = id.indexOf("-");
  const base = `/convocatoria/${id.slice(0, corte)}/${id.slice(corte + 1)}`;
  return { id, src: `${base}.webp`, src800: `${base}-800.webp`, ancho: MEDIDAS[id][0], alto: MEDIDAS[id][1], alt, pos };
}

// ---------- Países ----------
export type PaisLanding = {
  slug: PaisSlug;
  nombre: string;
  /** Prefijo de sus fotos: col, ecu, pan, uy. */
  pre: "col" | "ecu" | "pan" | "uy";
  ruta: string;
  voz: Voz;
  /**
   * Requisito de ubicación: las ciudades sede y las cercanas, sin priorizar ninguna. Deben ser las mismas de la
   * definición del formulario del país (src/modules/inscripcion/paises/<pais>.ts); una prueba lo comprueba.
   */
  ubicacion: string;
  grado: string;
  gradoCorto: string;
  equipo: "computador" | "computadora";
  /** Ciudades donde se hacen los encuentros presenciales (preguntas frecuentes). */
  sedes: string;
  /** Pie de la foto de la actividad fuera del aula y la foto que la ilustra. */
  visita: string;
  fotoVisita: IdFoto;
};

const p = (slug: PaisSlug, datos: Omit<PaisLanding, "slug" | "ruta">): PaisLanding => ({ slug, ruta: `/${SEGMENTO_URL[slug]}`, ...datos });

export const PAISES: Record<PaisSlug, PaisLanding> = {
  col: p("col", {
    nombre: "Colombia", pre: "col", voz: TU,
    ubicacion: "Vivir en Barranquilla, Bogotá D.C., Cali, Cartagena de Indias, Medellín (incluido el Valle de Aburrá) o ciudades cercanas.",
    grado: "Estar en 10.° u 11.°, o ser bachiller.", gradoCorto: "10.° y 11.°, o bachiller",
    equipo: "computador", sedes: "Barranquilla, Bogotá D.C., Cali, Cartagena de Indias y Medellín", visita: "Visita a Sofka", fotoVisita: "col-visita",
  }),
  ecu: p("ecu", {
    nombre: "Ecuador", pre: "ecu", voz: TU, ubicacion: "Vivir en Quito, Guayaquil o ciudades cercanas.",
    grado: "Estar en 2.° o 3.° de bachillerato, o ser bachiller.", gradoCorto: "2.° y 3.° de bachillerato, o bachiller",
    equipo: "computadora", sedes: "Quito y Guayaquil", visita: "Visita a Sofka", fotoVisita: "ecu-visita",
  }),
  pan: p("pan", {
    nombre: "Panamá", pre: "pan", voz: TU, ubicacion: "Vivir en Ciudad de Panamá o ciudades cercanas de la provincia de Panamá.",
    grado: "Estar en 11.° o 12.°, o ser bachiller (egresado reciente).", gradoCorto: "11.° y 12.°, o bachiller",
    // El diseño pide "pan-visita", que no existe en el paquete: se usa pan-reto (decisión de la fase 0).
    equipo: "computadora", sedes: "Ciudad de Panamá", visita: "Reto en equipo", fotoVisita: "pan-reto",
  }),
  uy: p("uy", {
    nombre: "Uruguay", pre: "uy", voz: VOS, ubicacion: "Vivir en Colonia, Paysandú o ciudades cercanas, o en Colón y Concepción del Uruguay (Argentina).",
    grado: "Estar en 5.° o 6.° de liceo, o ser bachiller.", gradoCorto: "5.° y 6.° de liceo, o bachiller",
    equipo: "computadora", sedes: "Colonia y Paysandú", visita: "Visita pedagógica", fotoVisita: "uy-visita",
  }),
};

/** Orden en que aparecen los países en la franja y en los requisitos. */
export const ORDEN_PAISES: PaisSlug[] = ["col", "ecu", "pan", "uy"];

export type EstadoLanding = "abierta" | "pronto" | "cerrada";

// ---------- Hero ----------
export type Diapositiva = { foto: Foto; a: string; b: string; c: string; sub: string };

/**
 * Diapositivas del hero. `etapa`: nombre de la etapa del país ("inscripciones" o "preinscripciones").
 * `abiertas` (solo la principal): texto de qué está abierto, armado con la configuración (p. ej. "Preinscripciones
 * abiertas en Uruguay."), para no dar a entender que hay países abiertos que no lo están.
 */
export function diapositivas(pais: PaisLanding | null, estado: EstadoLanding, etapa = "inscripciones", abiertas = "Inscripciones 2027 muy pronto."): Diapositiva[] {
  if (!pais) {
    return [
      { foto: foto("ecu-hero", "", "center 30%"), a: "Formando talento en ", b: "las TIC", c: "", sub: abiertas },
      { foto: foto("col-codigo", "", "center 40%"), a: TU.aprende, b: "desde cero", c: "", sub: "Beca del 100 %." },
      { foto: foto("col-hero", "", "center 45%"), a: "", b: "+2.300 jóvenes", c: " en 4 países ya lo vivieron", sub: "Colombia, Ecuador, Panamá y Uruguay." },
      { foto: foto("col-taller", "", "center 35%"), a: TU.convierte, b: "un proyecto real", c: "", sub: "Ruta Emprender." },
    ];
  }
  const sub =
    estado === "pronto" ? `Muy pronto abrimos las ${etapa} en ${pais.nombre}.`
    : estado === "cerrada" ? `Las ${etapa} en ${pais.nombre} ya cerraron.`
    : "Formando talento en las TIC, con beca del 100 %.";
  return [
    { foto: foto(`${pais.pre}-hero`, "", "center 40%"), a: "Inscripciones 2027 · ", b: pais.nombre, c: "", sub },
    { foto: foto(`${pais.pre}-hero-2`, "", "center 45%"), a: pais.voz.aprende, b: "desde cero", c: "", sub: "Beca del 100 %, con mentoría y acompañamiento continuo." },
  ];
}

// ---------- Impacto y rutas ----------
export const IMPACTO = {
  texto: "Jóvenes creaTIvos es una iniciativa de alto impacto dedicada a cerrar la brecha digital en América Latina, preparando a la próxima generación de desarrolladores, emprendedores y líderes digitales en la región.",
  foto: foto("col-grupo", "Grupo de Jóvenes creaTIvos de Colombia con camisetas y gorras del programa"),
  jovenes: 2300,
  paises: 4,
};

export type Ruta = { semanas: number; nota: string; titulo: string; texto: string; temas: string[]; foto: Foto };
export function rutas(voz: Voz): Ruta[] {
  return [
    { semanas: 3, nota: "Mentoría activa", titulo: "Habilidades Esenciales", texto: voz.habilidades, temas: ["Liderazgo y Teamwork", "Comunicación Efectiva", "Resolución de Conflictos"], foto: foto("ecu-proyecto", "Jóvenes presentando su trabajo en equipo frente al grupo, Ecuador") },
    { semanas: 3, nota: "Incubación", titulo: "Emprender", texto: "Espacio diseñado para transformar tus ideas en proyectos viables mediante metodologías prácticas y validación de negocio.", temas: ["Modelo CANVAS", "Ideación y Validación", "Procesos de Negocio"], foto: foto("ecu-aula-2", "Participantes trabajando en computadores con la gorra de Jóvenes creaTIvos, Ecuador") },
    { semanas: 23, nota: "Full stack", titulo: "Desarrollo de Software", texto: "Desde los fundamentos hasta la creación de aplicaciones modernas, integrando tecnologías e inteligencia artificial.", temas: ["HTML, CSS y JS moderno", "React y Node.js", "Integración con IA"], foto: foto("ecu-codigo", "Dos jóvenes programando frente a una pantalla con código, Ecuador") },
  ];
}

// ---------- Cómo funciona ----------
export type IconoLanding = "portatil" | "personas" | "corazon" | "microfono" | "ubicacion" | "birrete" | "calendario" | "reloj";
export type ItemComo = { titulo: string; texto: string; icono: IconoLanding; foto: Foto };
export function comoFunciona(pais: PaisLanding | null): ItemComo[] {
  const voz = pais?.voz ?? TU;
  const f = (sufijo: "aula-2" | "taller" | "monitor-1" | "comunidad", general: IdFoto): IdFoto => (pais ? (`${pais.pre}-${sufijo}` as IdFoto) : general);
  return [
    { titulo: "80 % virtual", texto: "Rutas de formación en línea, parecidas a las de plataformas como Platzi, con sesiones en Zoom para reforzar lo que vas aprendiendo.", icono: "portatil", foto: foto(f("aula-2", "col-codigo"), "Participantes trabajando en sus computadores") },
    { titulo: "20 % presencial", texto: "Un encuentro práctico cada mes en tu ciudad y visitas a empresas de tecnología.", icono: "personas", foto: foto(f("taller", "ecu-proyecto"), "Jóvenes en un encuentro presencial") },
    { titulo: "Apoyo y acompañamiento", texto: `${voz.tienes} apoyo cercano del equipo para cuidar tu bienestar durante todo el programa.`, icono: "corazon", foto: foto(f("monitor-1", "col-monitor-1"), "Monitor acompañando a un participante") },
    { titulo: "Charlas complementarias", texto: "Temas actuales del mundo tecnológico, más allá del curso.", icono: "microfono", foto: foto(f("comunidad", "pan-inauguracion"), "Jóvenes creaTIvos reunidos") },
  ];
}

// ---------- Beneficios (solo en la principal) ----------
export const BENEFICIOS = {
  texto: "Todo lo que necesitas para que tu formación sea una experiencia integral de aprendizaje y crecimiento personal.",
  beca: { titulo: "Beca del 100 %", texto: "Acceso total sin costo alguno. Tu talento es tu única moneda de entrada." },
  visitas: { titulo: "Visitas pedagógicas", texto: "Conoce por dentro las oficinas de las empresas tecnológicas más importantes.", foto: foto("col-visita", "Jóvenes creaTIvos en la visita a las oficinas de Sofka") },
  otros: [
    { clase: "bt-a bt-tinte", icono: "certificado", titulo: "Certificado", texto: "Recibe una certificación oficial que respalda tus nuevos conocimientos técnicos." },
    { clase: "bt-b", icono: "personas", titulo: "Comunidad", texto: "Únete a la red exclusiva de Jóvenes creaTIvos en toda Latinoamérica." },
    { clase: "bt-c", icono: "corazon", titulo: "Apoyo y acompañamiento", texto: "Acompañamiento integral para potenciar tu bienestar durante el programa." },
    { clase: "bt-d bt-tinte", icono: "charla", titulo: "Asesorías de emprendimiento", texto: "Mentoría experta para llevar tus ideas de negocio al siguiente nivel." },
  ],
} as const;

// ---------- Requisitos ----------
// La edad no es un requisito de la landing (la alerta de edad del formulario sigue igual).
export type Requisito = { clave: string; texto: string; icono: IconoLanding; pendiente?: string };
export function requisitos(pais: PaisLanding | null): Requisito[] {
  const equipo = pais?.equipo ?? "computadora";
  return [
    { clave: "Ubicación", icono: "ubicacion", texto: pais ? pais.ubicacion : "Vivir en Colombia, Ecuador, Panamá o Uruguay. Se priorizan las ciudades principales, pero cualquier persona del país puede inscribirse." },
    { clave: "Nivel educativo", icono: "birrete", texto: pais ? pais.grado : "Estar en los últimos años del colegio o ser egresado reciente." },
    { clave: "Herramientas", icono: "portatil", texto: `Acceso a ${equipo === "computador" ? "un computador" : "una computadora"} e internet.` },
    { clave: "Compromiso", icono: "reloj", texto: "Mínimo 8 horas semanales." },
  ];
}

export const INCLUYE = [
  "Beca del 100 %: acceso total sin costo alguno.",
  "Visitas pedagógicas a empresas tecnológicas.",
  "Certificación oficial.",
  "Comunidad de Jóvenes creaTIvos en toda Latinoamérica.",
  "Apoyo y acompañamiento.",
  "Asesorías de emprendimiento.",
];
export function noIncluye(pais: PaisLanding): string[] {
  return [`${pais.equipo === "computador" ? "Computadores" : "Computadoras"} ni otros equipos.`, "Ayudas económicas.", "Acceso a internet."];
}

// ---------- Galería ----------
export type FotoGaleria = { foto: Foto; pie: string };
export function galeria(pais: PaisLanding | null): FotoGaleria[] {
  if (!pais) {
    return [
      { foto: foto("col-visita", "Grupo de jóvenes en la visita a las oficinas de Sofka", "center 45%"), pie: "Visita pedagógica a Sofka · Colombia" },
      { foto: foto("ecu-visita-2", "Jóvenes y equipo de una empresa aliada durante una visita", "center 40%"), pie: "Visita pedagógica · Ecuador" },
      { foto: foto("col-comunidad", "Jóvenes creaTIvos reunidos después de una sesión presencial", "center 35%"), pie: "Comunidad · Colombia" },
      { foto: foto("pan-hero-2", "Jóvenes creaTIvos de Panamá con sus gorras del programa", "center 35%"), pie: "Comunidad · Panamá" },
      { foto: foto("uy-visita", "Jóvenes creaTIvos de Uruguay durante una visita", "center 40%"), pie: "Visita pedagógica · Uruguay" },
      { foto: foto("ecu-comunidad", "Jóvenes creaTIvos de Ecuador reunidos en el aula", "center 40%"), pie: "Comunidad · Ecuador" },
      { foto: foto("pan-comunidad", "Grupo de Jóvenes creaTIvos de Panamá", "center 35%"), pie: "Comunidad · Panamá" },
      { foto: foto("uy-comunidad", "Jóvenes creaTIvos de Uruguay reunidos", "center 45%"), pie: "Comunidad · Uruguay" },
    ];
  }
  const n = pais.nombre;
  const f = (sufijo: string) => `${pais.pre}-${sufijo}` as IdFoto;
  return [
    { foto: foto(f("aula"), `Jóvenes en una sesión presencial en ${n}`, "center 40%"), pie: "En el aula" },
    { foto: foto(f("monitor-1"), `Monitor acompañando a un participante en ${n}`, "center 35%"), pie: "Con los monitores" },
    { foto: foto(f("aula-2"), `Participantes trabajando en ${n}`, "center 40%"), pie: "Sesión presencial" },
    { foto: foto(f("monitor-2"), `Monitor explicando al grupo en ${n}`, "center 30%"), pie: "Acompañamiento" },
    { foto: foto(f("taller"), `Taller práctico en ${n}`, "center 40%"), pie: "Taller" },
    { foto: foto(pais.fotoVisita, `Actividad fuera del aula en ${n}`, "center 35%"), pie: pais.visita },
    { foto: foto(f("comunidad"), `Jóvenes creaTIvos de ${n} reunidos`, "center 40%"), pie: "Comunidad" },
  ];
}

// ---------- Acerca, testimonios, aliados y preguntas ----------
export const ACERCA = {
  parrafos: [
    "Programa integral de desarrollo de capacidades para el trabajo y el emprendimiento.",
    "Está compuesto por cinco módulos: Curso de Aprendizaje Efectivo, desarrollo de habilidades esenciales del ser, taller de emprendimiento “Desarrolla una Idea de Negocio”, formación en inteligencia artificial, y formación en desarrollo de software, donde de la mano de expertos los jóvenes aprenden diferentes especialidades de programación.",
  ],
  modulos: ["Curso de Aprendizaje Efectivo", "Habilidades esenciales del ser", "Taller de emprendimiento “Desarrolla una Idea de Negocio”", "Formación en inteligencia artificial", "Formación en desarrollo de software"],
  foto: foto("pan-inauguracion", "Inauguración de Jóvenes creaTIvos en Panamá, con el auditorio lleno de participantes"),
};

/** Egresados 2025. `youtubeId`: video ya publicado por la Fundación. Cada testimonio muestra solo video, nombre y ciudad. */
export type Testimonio = { nombre: string; rol: string; ciudad: string; pais: PaisSlug; youtubeId?: string };
export const TESTIMONIOS: Testimonio[] = [
  { nombre: "Antonella Caballero", rol: "Joven creaTIva 2025", ciudad: "Barranquilla", pais: "col", youtubeId: "2nqR9nhCkdg" },
  { nombre: "Andrés Navarrete", rol: "Joven creaTIvo 2025", ciudad: "Bogotá", pais: "col", youtubeId: "4LLBIA_JnTI" },
  { nombre: "Eilyn Obregón", rol: "Joven creaTIva 2025", ciudad: "Cali", pais: "col", youtubeId: "roXbrp300RM" },
  { nombre: "Linda Julio", rol: "Joven creaTIva 2025", ciudad: "Cali", pais: "col", youtubeId: "a0h-nldX7eo" },
  { nombre: "Dairyn Palacios", rol: "Joven creaTIva 2025", ciudad: "Medellín", pais: "col", youtubeId: "e36AcPeU_xs" },
  { nombre: "Damaris Jiménez", rol: "Joven creaTIva 2025", ciudad: "Guayaquil", pais: "ecu", youtubeId: "haTs9oOExGM" },
  { nombre: "César Ortuño", rol: "Joven creaTIvo 2025", ciudad: "Quito", pais: "ecu", youtubeId: "6w0KpOtU2nw" },
  { nombre: "Danara Guerrero", rol: "Joven creaTIva 2025", ciudad: "Paysandú", pais: "uy", youtubeId: "VQnYTwORz5I" },
];
/** Países cuya landing muestra todos los testimonios, igual y en el mismo orden que la principal. */
const TESTIMONIOS_COMPLETOS: readonly PaisSlug[] = ["uy"];

/**
 * Testimonios de cada página. La principal y Uruguay: todos, en el mismo orden. Las demás landings: los de su país;
 * si un país todavía no tiene (Panamá), los de todos, así nunca queda la sección vacía ni con un dato pendiente.
 */
export function testimoniosPara(pais: PaisLanding | null): Testimonio[] {
  if (!pais || TESTIMONIOS_COMPLETOS.includes(pais.slug)) return TESTIMONIOS;
  const propios = TESTIMONIOS.filter((t) => t.pais === pais.slug);
  return propios.length ? propios : TESTIMONIOS;
}

/**
 * Sección de aliados. Oculta hasta tener los logos: al recibirlos, cargar la lista y poner `true` (sin la sección
 * no queda ningún espacio vacío en la página).
 */
export const MOSTRAR_ALIADOS = false;
/** Logos de aliados: pendientes de entregar. */
export const ALIADOS_PENDIENTES = ["Sofka Technologies [LOGO]", "[LOGO ALIADO]", "[LOGO ALIADO]", "[LOGO ALIADO]", "[LOGO ALIADO]", "[LOGO ALIADO]"];

/**
 * Preguntas frecuentes, en lenguaje neutro (sin tú ni vos: sirven igual en los 4 países). Cambian solo las ciudades de
 * los encuentros y la palabra para el equipo (computador en Colombia).
 */
export function preguntas(pais: PaisLanding | null): Array<{ q: string; a: string }> {
  const equipo = pais?.equipo === "computador" ? "un computador" : "una computadora";
  const sedes = pais ? `en ${pais.sedes}` : "en las ciudades sede de cada país";
  return [
    { q: "¿Cuánto cuesta?", a: "Nada. Es una beca del 100 %: no hay costo de matrícula ni de inscripción." },
    { q: "¿Hay que saber programar?", a: "No. El programa empieza desde cero: primero habilidades esenciales, después emprendimiento y por último desarrollo de software." },
    { q: "¿Cuánto dura y cuándo empieza?", a: "8 meses: de marzo de 2027 a noviembre de 2027. Requiere unas 8 horas a la semana." },
    { q: "¿Es virtual o presencial?", a: `Mayoritariamente virtual, con un encuentro presencial al mes ${sedes} y visitas a empresas.` },
    { q: `¿El programa presta ${equipo}?`, a: `No. El programa no incluye equipos ni ayudas económicas: hace falta contar con ${equipo} e internet propios.` },
    { q: "¿Qué se recibe al terminar?", a: "Un certificado de participación y la entrada a la comunidad Jóvenes creaTIvos, donde se comparten oportunidades laborales." },
  ];
}
/** Preguntas de la landing principal. */
export const PREGUNTAS = preguntas(null);

/** Redes de la Fundación. Sin `url`, el enlace queda marcado como pendiente. */
export const REDES: Array<{ nombre: "Instagram" | "YouTube" | "LinkedIn"; url?: string }> = [
  { nombre: "Instagram", url: "https://www.instagram.com/tocaunavida/" },
  { nombre: "YouTube", url: "https://www.youtube.com/channel/UCnb0QeYM_z_91NcTkjjm3SQ" },
  { nombre: "LinkedIn", url: "https://www.linkedin.com/company/tocaunavida/" },
];
