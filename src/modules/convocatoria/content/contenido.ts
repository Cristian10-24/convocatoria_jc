// Contenido de las landings de convocatoria. Lo común está una sola vez; lo que cambia por país, en PAISES.
// Cada texto que depende del trato (tú / vos) sale de `voz`, para que Uruguay quede en voseo sin duplicar la página.
// Fuente: landings de tocaunavida.org (2026) adaptadas a la cohorte siguiente. Ver PLAN.md y CLAUDE.md.
import { SEGMENTO_URL, type PaisSlug } from "@/shared/config/paises";
import type { ConfigPais } from "./acciones";

/** Cohorte a la que se convoca. Cambiar aquí actualiza las 4 páginas. */
export const COHORTE = {
  anio: 2027,
  inicio: "marzo de 2027",
  fin: "noviembre de 2027",
  meses: 8,
  horasSemana: 8,
} as const;

export type Voz = {
  convierte: string; // "Conviértete" / "Convertite"
  postulate: string; // "Postúlate" / "Postulate"
  inscribete: string;
  vas: string; // "Vas" (igual en ambos, se deja por claridad)
  tienes: string;
  necesitas: string;
  puedes: string;
  vives: string;
  eres: string;
  cumples: string;
  quieres: string;
  escribenos: string;
  aqui: string; // "aquí" / "acá"
  marca: string; // "Marca" / "Marcá"
  mira: string; // "Mira" / "Mirá"
};

const TU: Voz = {
  convierte: "Conviértete", postulate: "Postúlate", inscribete: "Inscríbete", vas: "Vas", tienes: "tienes",
  necesitas: "Necesitas", puedes: "puedes", vives: "vives", eres: "eres", cumples: "cumples", quieres: "quieres", escribenos: "Escríbenos", aqui: "aquí", marca: "Marca", mira: "Mira",
};
const VOS: Voz = {
  convierte: "Convertite", postulate: "Postulate", inscribete: "Inscribite", vas: "Vas", tienes: "tenés",
  necesitas: "Necesitás", puedes: "podés", vives: "vivís", eres: "sos", cumples: "cumplís", quieres: "querés", escribenos: "Escribinos", aqui: "acá", marca: "Marcá", mira: "Mirá",
};

export type Foto = { src: string; alt: string; pie: string; ancho: number; alto: number };
export type Testimonio = { nombre: string; ciudad: string; pais: PaisSlug; anio: number; youtubeId: string; /** Como lo nombra la Fundación: "Joven creaTIva" / "Joven creaTIvo". */ rotulo: string };

export type Pais = {
  slug: PaisSlug;
  nombre: string;
  /** Ruta pública de la landing. */
  ruta: string;
  /** Gentilicio/expresión corta para el hero ("en Colombia"). */
  en: string;
  voz: Voz;
  /** Palabra local para el equipo de cómputo. */
  equipo: string;
  /** Requisito de residencia, ya redactado. */
  dondeVivir: string;
  /** Ciudades con encuentros presenciales (chips). */
  sedes: string[];
  /** Requisito de grados, ya redactado en la terminología local. */
  grados: string;
  /** Colores de la bandera, solo para el distintivo (no se usan emojis: Windows no los dibuja). */
  bandera: [string, string, string];
  fotos: { hero: Foto; galeria: Foto[] };
  /** Estado y botones por defecto del país (el back puede sobrescribirlos con CONVOCATORIA_CONFIG). */
  config: ConfigPais;
  /** Formulario de la convocatoria anterior (cerrado). Solo como referencia para el back; no se usa en botones. */
  formularioAnterior: string;
};

const f = (pais: PaisSlug, archivo: string, alt: string, pie: string, ancho: number, alto: number): Foto => ({
  src: `/convocatoria/${pais}/${archivo}`,
  alt,
  pie,
  ancho,
  alto,
});

export const PAISES: Record<PaisSlug, Pais> = {
  col: {
    slug: "col",
    nombre: "Colombia",
    ruta: `/${SEGMENTO_URL.col}`,
    en: "en Colombia",
    voz: TU,
    equipo: "computador",
    dondeVivir: "Vivir en Barranquilla, Bogotá, Cali, Cartagena o Medellín (incluido el Valle de Aburrá).",
    sedes: ["Barranquilla", "Bogotá", "Cali", "Cartagena", "Medellín"],
    grados: "Estar en grado 10° u 11°, o haberte graduado como bachiller hace máximo 3 años.",
    bandera: ["#FCD116", "#003893", "#CE1126"],
    fotos: {
      hero: f("col", "hero", "Grupo de Jóvenes creaTIvos con camisetas blancas y gorras naranjas en una sesión presencial en Cartagena", "Sesión presencial · Cartagena 2026", 1600, 1200),
      galeria: [
        f("col", "aula", "Estudiantes programando en una sala de computadores en Barranquilla", "Clase práctica · Barranquilla", 1600, 900),
        f("col", "taller", "Estudiantes presentando sus ideas en carteleras durante un taller en Bogotá", "Taller de emprendimiento · Bogotá", 1600, 1200),
        f("col", "visita", "Grupo de estudiantes en la visita pedagógica a la empresa Sofka en Bogotá", "Visita a Sofka · Bogotá", 1600, 1200),
        f("col", "comunidad", "Jóvenes creaTIvos posando juntos en Cartagena", "Comunidad JC · Cartagena", 1600, 1200),
        f("col", "inauguracion", "Estudiantes y equipo en la tarima de la inauguración de Jóvenes creaTIvos 2026 en Cali", "Inauguración 2026 · Cali", 1600, 1200),
        f("col", "visita-2", "Estudiantes recorriendo las instalaciones de PriceSmart en Barranquilla", "Visita a PriceSmart · Barranquilla", 1600, 902),
      ],
    },
    config: { estado: "proxima" },
    formularioAnterior: "https://forms.gle/5gCnUUFWbhTsBpBG6",
  },
  pan: {
    slug: "pan",
    nombre: "Panamá",
    ruta: `/${SEGMENTO_URL.pan}`,
    en: "en Panamá",
    voz: TU,
    equipo: "computadora",
    dondeVivir: "Vivir en la provincia de Panamá o en ciudades cercanas.",
    sedes: ["Ciudad de Panamá"],
    grados: "Estar en 11° o 12° grado, o haberte graduado de la secundaria hace máximo 3 años.",
    bandera: ["#FFFFFF", "#005293", "#D21034"],
    fotos: {
      hero: f("pan", "hero", "Foto grupal de la inauguración de Jóvenes creaTIvos 2026 en Ciudad de Panamá", "Inauguración 2026 · Ciudad de Panamá", 1600, 1067),
      galeria: [
        f("pan", "taller", "Estudiantes trabajando en equipo durante un reto práctico", "Reto en equipo · Ciudad de Panamá", 1600, 1200),
        f("pan", "aula", "Estudiantes en una sala de computadores durante una sesión presencial", "Sesión presencial · Ciudad de Panamá", 1600, 709),
        f("pan", "taller-2", "Estudiantes mostrando el cartel de su proyecto", "Presentación de proyecto", 1600, 1200),
        f("pan", "comunidad", "Grupo de Jóvenes creaTIvos en Panamá", "Comunidad JC · Panamá", 1280, 960),
        f("pan", "exterior", "Estudiantes con la camiseta de Jóvenes creaTIvos al aire libre", "Sesión presencial al aire libre", 1600, 1200),
        f("pan", "inauguracion", "Estudiantes con gorras naranjas en el auditorio de la inauguración", "Inauguración 2026", 1600, 1067),
      ],
    },
    config: { estado: "proxima" },
    formularioAnterior: "https://forms.gle/5Kzc5UJe4HUSzBBd9",
  },
  ecu: {
    slug: "ecu",
    nombre: "Ecuador",
    ruta: `/${SEGMENTO_URL.ecu}`,
    en: "en Ecuador",
    voz: TU,
    equipo: "computadora",
    dondeVivir: "Vivir en Quito o Guayaquil.",
    sedes: ["Quito", "Guayaquil"],
    grados: "Estar en 2.° o 3.° de bachillerato, o haberte graduado como bachiller hace máximo 3 años.",
    bandera: ["#FFDD00", "#034EA2", "#ED1C24"],
    fotos: {
      hero: f("ecu", "hero", "Estudiantes sonrientes con gorras naranjas en la inauguración de Jóvenes creaTIvos 2026 en Quito", "Inauguración 2026 · Quito", 1600, 1067),
      galeria: [
        f("ecu", "aula", "Estudiante escribiendo código en una sala de computadores en Quito", "Clase práctica · Quito", 1600, 1200),
        f("ecu", "taller", "Equipos presentando sus carteles en una sesión presencial en Quito", "Taller presencial · Quito", 1600, 1200),
        f("ecu", "visita", "Grupo de estudiantes en la visita a Sofka en Quito", "Visita a Sofka · Quito", 1600, 1200),
        f("ecu", "visita-2", "Estudiantes en la visita a Torres & Torres en Guayaquil", "Visita a Torres & Torres · Guayaquil", 1280, 874),
        f("ecu", "comunidad", "Jóvenes creaTIvos posando en grupo en Quito", "Comunidad JC · Quito", 1600, 1200),
        f("ecu", "inauguracion", "Cuatro estudiantes sonriendo en una sesión presencial en Guayaquil", "Sesión presencial · Guayaquil", 1600, 1200),
      ],
    },
    config: { estado: "proxima" },
    formularioAnterior: "https://forms.gle/ohoPQ9hS44yfNs1N8",
  },
  uy: {
    slug: "uy",
    nombre: "Uruguay",
    ruta: `/${SEGMENTO_URL.uy}`,
    en: "en Uruguay",
    voz: VOS,
    equipo: "computadora",
    dondeVivir: "Vivir en Uruguay, o en Colón o Concepción del Uruguay (Argentina).",
    sedes: ["Colonia", "Paysandú"],
    grados: "Estar en 5.° o 6.° de liceo, o haber egresado del bachillerato hace máximo 3 años.",
    bandera: ["#FFFFFF", "#0038A8", "#FCD116"],
    fotos: {
      hero: f("uy", "hero", "Foto grupal de la inauguración de Jóvenes creaTIvos 2026 en Colonia", "Inauguración 2026 · Colonia", 1600, 1200),
      galeria: [
        f("uy", "taller", "Estudiantes resolviendo un reto práctico en equipo en Paysandú", "Reto en equipo · Paysandú", 1600, 900),
        f("uy", "comunidad", "Jóvenes creaTIvos posando juntos en Colonia", "Comunidad JC · Colonia", 1600, 900),
        f("uy", "visita", "Estudiantes en la visita a Sofka en Paysandú", "Visita a Sofka · Paysandú", 1600, 738),
        f("uy", "taller-2", "Estudiantes trabajando con sus computadoras en Colonia", "Sesión presencial · Colonia", 1600, 900),
        f("uy", "aula", "Estudiantes programando en Paysandú", "Clase práctica · Paysandú", 1600, 738),
        f("uy", "inauguracion", "Estudiantes con gorras en la inauguración de Paysandú", "Inauguración 2026 · Paysandú", 1600, 1200),
      ],
    },
    // Formulario propio. Se activa cuando CONVOCATORIA_CONFIG pone a Uruguay en "abierta"; antes sale "muy pronto".
    config: { estado: "proxima", acciones: { postular: { tipo: "ruta", ruta: `/inscripcion/${SEGMENTO_URL.uy}` } } },
    formularioAnterior: "https://forms.gle/Q1Dug7r2W6XbgHwe9",
  },
};

/** Egresados 2025 (videos ya publicados en YouTube por la Fundación). */
export const TESTIMONIOS: Testimonio[] = [
  { nombre: "Antonella Caballero", ciudad: "Barranquilla", pais: "col", anio: 2025, youtubeId: "2nqR9nhCkdg", rotulo: "Joven creaTIva" },
  { nombre: "Andrés Navarrete", ciudad: "Bogotá", pais: "col", anio: 2025, youtubeId: "4LLBIA_JnTI", rotulo: "Joven creaTIvo" },
  { nombre: "Eilyn Obregón", ciudad: "Cali", pais: "col", anio: 2025, youtubeId: "roXbrp300RM", rotulo: "Joven creaTIva" },
  { nombre: "Linda Julio", ciudad: "Cartagena", pais: "col", anio: 2025, youtubeId: "a0h-nldX7eo", rotulo: "Joven creaTIva" },
  { nombre: "Dairyn Palacios", ciudad: "Medellín", pais: "col", anio: 2025, youtubeId: "e36AcPeU_xs", rotulo: "Joven creaTIva" },
  { nombre: "Damaris Jiménez", ciudad: "Guayaquil", pais: "ecu", anio: 2025, youtubeId: "haTs9oOExGM", rotulo: "Joven creaTIva" },
  { nombre: "César Ortuño", ciudad: "Quito", pais: "ecu", anio: 2025, youtubeId: "6w0KpOtU2nw", rotulo: "Joven creaTIvo" },
  { nombre: "Danara Guerrero", ciudad: "Uruguay", pais: "uy", anio: 2025, youtubeId: "VQnYTwORz5I", rotulo: "Joven creaTIva" },
];

/** Primero los del país; luego el resto. Panamá aún no tiene videos propios. */
export function testimoniosPara(pais: PaisSlug): Testimonio[] {
  return [...TESTIMONIOS.filter((t) => t.pais === pais), ...TESTIMONIOS.filter((t) => t.pais !== pais)];
}

export const CURSOS = [
  { n: 1, titulo: "Habilidades esenciales", semanas: 3, temas: ["Liderazgo", "Trabajo en equipo", "Comunicación efectiva", "Resolución de conflictos"] },
  { n: 2, titulo: "Emprendimiento", semanas: 3, temas: ["Ideación", "Modelo CANVAS", "Validación"] },
  { n: 3, titulo: "Desarrollo de software", semanas: 23, temas: ["PSeInt", "HTML", "CSS", "JavaScript", "Git", "React"] },
] as const;

export function comoFunciona(p: Pais) {
  const v = p.voz;
  return [
    { titulo: "Mayoritariamente virtual", texto: `Rutas de formación en línea, parecidas a las de plataformas como Platzi, con sesiones en Zoom para reforzar lo que ${v.vas.toLowerCase()} aprendiendo.` },
    { titulo: "Encuentros presenciales cada mes", texto: `Sesiones prácticas en ${p.sedes.length > 1 ? "tu ciudad" : p.sedes[0]} y visitas a empresas de tecnología.` },
    { titulo: "Apoyo en salud mental", texto: `${v.tienes[0]!.toUpperCase()}${v.tienes.slice(1)} acompañamiento para cuidar tu bienestar durante todo el programa.` },
    { titulo: "Charlas complementarias", texto: "Temas actuales del mundo tecnológico, más allá del curso." },
  ];
}

export const INCLUYE = [
  "Beca del 100 % para la formación completa: sin costo de matrícula ni de inscripción.",
  "Visitas pedagógicas a empresas del sector TI.",
  "Certificado de participación.",
  "Acceso a la comunidad Jóvenes creaTIvos, donde se comparten oportunidades laborales.",
];

export function noIncluye(p: Pais) {
  return [`${p.equipo === "computador" ? "Computadores" : "Computadoras"} ni otros equipos.`, "Ayudas económicas.", "Acceso a internet."];
}

export function requisitos(p: Pais) {
  return [
    p.dondeVivir,
    p.grados,
    `Tener acceso a ${p.equipo === "computador" ? "un computador" : "una computadora"} y a internet.`,
    `Tener ${COHORTE.horasSemana} horas a la semana para dedicarle al programa.`,
  ];
}

export function preguntas(p: Pais) {
  const v = p.voz;
  const uy = p.slug === "uy";
  return [
    { q: "¿Cuánto cuesta?", a: `Nada. Es una beca del 100 %: no hay costo de matrícula ni de inscripción.` },
    { q: uy ? "¿Tengo que saber programar?" : "¿Necesito saber programar?", a: `No. El programa empieza desde cero: primero habilidades esenciales, después emprendimiento y por último desarrollo de software.` },
    { q: "¿Cuánto dura y cuándo empieza?", a: `${COHORTE.meses} meses: de ${COHORTE.inicio} a ${COHORTE.fin}. ${v.necesitas} unas ${COHORTE.horasSemana} horas a la semana.` },
    { q: "¿Es virtual o presencial?", a: `Mayoritariamente virtual, con un encuentro presencial al mes en ${p.sedes.join(", ").replace(/, ([^,]*)$/, " y $1")} y visitas a empresas.` },
    { q: uy ? "¿Me prestan una computadora?" : `¿Me prestan ${p.equipo === "computador" ? "un computador" : "una computadora"}?`, a: `No. El programa no incluye equipos ni ayudas económicas: ${v.necesitas.toLowerCase()} tener ${p.equipo === "computador" ? "un computador" : "una computadora"} e internet por tu cuenta.` },
    { q: uy ? "¿Qué recibo al terminar?" : "¿Qué recibo al terminar?", a: `Un certificado de participación y la entrada a la comunidad Jóvenes creaTIvos, donde se comparten oportunidades laborales.` },
  ];
}

export const CONTACTO = { correo: "comunicaciones@tocaunavida.org", sitio: "https://tocaunavida.org" };
