// Tipos de la configuración del formulario. La configuración es SOLO datos (sin funciones), para que se pueda
// importar igual en el navegador y en el servidor, y para cambiar textos u opciones sin tocar la lógica.
import type { CodigoTelefono, PaisSlug } from "@/shared/config/paises";

export type Trato = "tu" | "vos";

/** Texto que cambia según el trato: { tu: "Escribe", vos: "Escribí" }. Un string simple vale para los dos. */
export type TextoTrato = string | { tu: string; vos: string };

export type Opcion = { id: string; etiqueta: TextoTrato };

/** El número de identificación es siempre un entero: solo dígitos, sin puntos, guiones ni letras. */
export type ReglaDocumento = { min: number; max: number };

export type TipoDocumento = { id: string; etiqueta: string; regla: ReglaDocumento; ayuda?: string; /** pide escribir cuál */ conTexto?: boolean };

export type Sede = { id: string; nombre: string; ciudades: string[] };

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

export type IdPaso = "ubicacion" | "personales" | "acudiente" | "estudios" | "perfil" | "sociodemograficos" | "cierre";
