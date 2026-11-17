// Tipos de la configuración del formulario. La configuración es SOLO datos (sin funciones), para que se pueda
// importar igual en el navegador y en el servidor, y para cambiar textos u opciones sin tocar la lógica.
import type { CodigoTelefono, PaisSlug } from "@/shared/config/paises";

export type Trato = "tu" | "vos";

/** Texto que cambia según el trato: { tu: "Escribe", vos: "Escribí" }. Un string simple vale para los dos. */
export type TextoTrato = string | { tu: string; vos: string };

export type Opcion = { id: string; etiqueta: TextoTrato };

/**
 * Formato del número de identificación. Siempre se guarda como texto (no se pierden los ceros a la izquierda).
 * - numerico: solo dígitos, sin puntos, guiones ni letras (cédulas, DNI).
 * - alfanumerico: letras y números, sin espacios ni símbolos; se guarda en mayúsculas (pasaporte, "Otro").
 * - cedula_pa: cédula panameña, con sus guiones y prefijos (8-123-4567, PE-1-234, E-8-12345); se guarda en mayúsculas.
 */
export type ReglaDocumento = { formato: "numerico" | "alfanumerico" | "cedula_pa"; min: number; max: number };

export type TipoDocumento = { id: string; etiqueta: string; regla: ReglaDocumento; ayuda?: string; /** pide escribir cuál */ conTexto?: boolean };

/**
 * `ciudades`: lista de la que se elige la residencia (ubicación "lista"). `sede`: si esta opción es parte de otra
 * sede (Valle de Aburrá es de Medellín), el id de esa sede, que es el que se guarda.
 */
export type Sede = { id: string; nombre: string; ciudades: string[]; sede?: string };

export type ConfigPaisInscripcion = {
  pais: PaisSlug;
  /** false = el formulario muestra "Inscripciones muy pronto" aunque CONVOCATORIA_CONFIG lo abra. */
  habilitado: boolean;
  trato: Trato;
  telefono: CodigoTelefono;
  /** Si hay una sola, se asigna sola y no se pregunta. */
  sedes: Sede[];
  tiposDocumento: TipoDocumento[];
  /** Grados que se pueden cursar + la opción de "ya terminé" (id "egresado"). */
  grados: Opcion[];
  /** Cómo se llama el colegio en el país (Liceo, Colegio...). */
  institucion: string;
  escalaNotas: { min: number; max: number };
  edad: { minima: number; alertaMayorDe: number; mayoriaDeEdad: number };
  /** Años máximos desde que terminó la secundaria (requisito de la convocatoria). */
  maxAniosEgreso: number;
  /** Etiqueta del país en el formulario ("Uruguay"). */
  nombre: string;
  /** Datos de configuración aún sin confirmar con el equipo del país. */
  pendienteDeConfirmar?: string;
};

/** "cierre" es el último paso con preguntas (cómo se enteró...). El resumen y la autorización los arma el formulario. */
export type IdPaso = "ubicacion" | "personales" | "acudiente" | "estudios" | "perfil" | "sociodemograficos" | "cierre";

/** Listas de opciones que cambian de un país a otro. */
export type OpcionesPais = {
  computadora: Opcion[]; ocupacion: Opcion[]; genero: Opcion[]; poblaciones: Opcion[]; ingresos: Opcion[]; tallas: Opcion[]; canales: Opcion[];
};

export type ReglasPais = {
  /**
   * "lista" (Uruguay): sede y luego ciudad de residencia de la lista de esa sede (o "Otra").
   * "libre": se elige una ciudad sede u "Otra ciudad"; quien vive en otra ciudad dice a qué sede podría asistir, y la
   * residencia se escribe aparte.
   */
  ubicacion: "lista" | "libre";
  /** true: la población es una sola respuesta (se guarda igual como lista de un elemento). */
  poblacionUnica: boolean;
  /** "¿Fuiste seleccionado o beneficiario?" se pregunta siempre (true) o solo a quien ya aplicó antes (false). */
  seleccionadoSiempre: boolean;
  tallaObligatoria: boolean;
};

export type ClaveConsentimiento = "privacidad" | "datos" | "acudiente";

/** Consentimiento del paso de autorización. Se guarda la clave con la respuesta, la versión y la fecha. */
export type TextoConsentimiento = { clave: ClaveConsentimiento; version: string; texto: string };

export type LegalPais = {
  provisional: boolean;
  /** Ley de protección de datos del país y autoridad ante la que se reclama. */
  ley: string;
  autoridad: string;
  /** Versiones del formato anterior (una sola casilla): se siguen guardando para los envíos que lleguen así. */
  versionAnterior: string;
  versionAcudienteAnterior: string;
  titulo: string;
  parrafos: string[];
  consentimientos: TextoConsentimiento[];
};

/** Paso con sus campos. Los ids de campo son los de PREGUNTAS (config/preguntas.ts). */
export type PasoDef = { id: IdPaso; titulo: TextoTrato; corto: TextoTrato; descripcion?: TextoTrato; campos: string[] };

/**
 * Definición completa del formulario de un país: es lo ÚNICO que cambia de un país a otro. El formulario la dibuja y
 * el validador la aplica; ninguno de los dos conoce países. Son solo datos (pasan del servidor al navegador).
 */
export type DefinicionPais = {
  pais: PaisSlug;
  config: ConfigPaisInscripcion;
  pasos: PasoDef[];
  opciones: OpcionesPais;
  reglas: ReglasPais;
  /** Etiqueta o ayuda propias del país para una pregunta (el resto sale de config/preguntas.ts). */
  etiquetas?: Record<string, { etiqueta?: TextoTrato; ayuda?: TextoTrato }>;
  legal: LegalPais;
};
