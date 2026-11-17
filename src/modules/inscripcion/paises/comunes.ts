// Piezas que comparten las definiciones de los 4 países: reglas de documentos, pasos del formulario según el modo
// de ubicación y el texto legal en lenguaje sencillo. Son solo datos y funciones puras: importar este archivo nunca
// lanza errores, y cada país (uy.ts, col.ts, ecu.ts, pan.ts) arma con esto su propia definición.
import { LEY_DATOS, VERSION_PRIVACIDAD } from "@/shared/config/legal";
import type { PaisSlug } from "@/shared/config/paises";
import { CONTACTO } from "@/shared/config/sitio";
import { PREFIERO_NO } from "../config/preguntas";
import type { DefinicionPais, LegalPais, Opcion, PasoDef, TipoDocumento, Trato } from "../config/tipos";

export const MAYORIA_DE_EDAD = 18;
export const EDAD_MINIMA = 14;

// Pasaporte y "Otro" admiten letras y números (se guardan en mayúsculas); los demás documentos, solo dígitos.
export const PASAPORTE: TipoDocumento = { id: "pasaporte", etiqueta: "Pasaporte", regla: { formato: "alfanumerico", min: 5, max: 15 } };
export const OTRO_DOCUMENTO: TipoDocumento = { id: "otro", etiqueta: "Otro", regla: { formato: "alfanumerico", min: 5, max: 20 }, conTexto: true };

export const opciones = (pares: Array<[string, string]>): Opcion[] => pares.map(([id, etiqueta]) => ({ id, etiqueta }));

/** Los datos sensibles siempre se pueden dejar sin responder. */
export const conPrefieroNo = (lista: Opcion[]): Opcion[] => (lista.some((o) => o.id === PREFIERO_NO.id) ? lista : [...lista, PREFIERO_NO]);

/** Acceso a un equipo: mismas claves en todos los países; cambia la palabra (computador / computadora). */
export function opcionesComputadora(equipo: "computador" | "computadora"): Opcion[] {
  const una = equipo === "computador" ? "uno" : "una";
  const prestada = equipo === "computador" ? "prestado uno" : "prestada una";
  return opciones([["propia", `Sí, tengo ${una} personal`], ["prestada", `No tengo, pero puedo acceder o pedir ${prestada}`], ["ninguna", "No tengo acceso"]]);
}

/**
 * Pasos del formulario de los países con ubicación "libre" (Colombia, Ecuador y Panamá), en el orden del diseño.
 * `extras` agrega las preguntas que solo tiene ese país. El resumen y la autorización los arma el formulario.
 */
export function pasosLibre(extras: { perfil?: string[]; sociodemograficos?: string[]; cierre: string[] }): PasoDef[] {
  return [
    { id: "ubicacion", titulo: "¿En qué ciudad vives?", corto: "Ciudad", descripcion: "Elige la ciudad donde vives.", campos: ["ciudad", "ciudadOtra"] },
    {
      id: "personales", titulo: "Datos personales", corto: "Datos personales", descripcion: "Tal como aparecen en tu documento.",
      campos: ["correo", "nombres", "apellidos", "whatsapp", "telefonoAlterno", "tipoDocumento", "tipoDocumentoOtro", "documento", "direccion", "fechaNacimiento"],
    },
    {
      id: "acudiente", titulo: "Padre, madre, acudiente o tutor", corto: "Adulto responsable", descripcion: "Como eres menor de edad, necesitamos los datos de un adulto responsable.",
      campos: ["acudienteNombres", "acudienteApellidos", "acudienteCorreo", "acudienteTelefono", "acudienteRelacion", "acudienteRelacionOtra"],
    },
    { id: "estudios", titulo: "Estudios y conectividad", corto: "Estudios y conectividad", campos: ["grado", "anioEgreso", "institucion", "internet", "computadora", "autonomia", "horas"] },
    { id: "perfil", titulo: "Sobre ti", corto: "Sobre ti", campos: ["ocupacion", "ocupacionOtra", "emprendimiento", ...(extras.perfil ?? []), "otrasPostulaciones"] },
    {
      id: "sociodemograficos", titulo: "Datos sociodemográficos", corto: "Datos sociodemográficos",
      campos: ["genero", "poblaciones", "poblacionOtra", "ingresos", ...(extras.sociodemograficos ?? [])],
    },
    { id: "cierre", titulo: "Información adicional", corto: "Información adicional", descripcion: "Ya casi terminamos.", campos: extras.cierre },
  ];
}

/** Redacción del diseño 2027 para las preguntas comunes (Uruguay conserva la suya, la del formulario en producción). */
export const ETIQUETAS_DISENO: NonNullable<DefinicionPais["etiquetas"]> = {
  ciudad: { etiqueta: "Ciudad donde vives" },
  ciudadOtra: { etiqueta: "Escribe el nombre de tu ciudad" },
  direccion: { etiqueta: "Dirección" },
  telefonoAlterno: { ayuda: "De un familiar o persona cercana." },
  documento: { ayuda: "Solo dígitos, sin puntos ni comas." },
  grado: { etiqueta: "Grado que cursas" },
  anioEgreso: { etiqueta: "Año en que terminaste" },
  internet: { etiqueta: "¿Tienes acceso a internet?" },
  autonomia: { etiqueta: "¿Te sientes cómodo/a aprendiendo de manera autónoma y usando plataformas en línea?" },
  horas: { etiqueta: "¿Cuántas horas semanales puedes dedicar de manera exclusiva al programa?", ayuda: "El programa pide mínimo 8 horas a la semana." },
  poblaciones: { etiqueta: "Población con la que te identificas", ayuda: "" },
  ingresos: { etiqueta: "Ingresos totales de tu hogar" },
  canal: { etiqueta: "¿Cómo te enteraste de la convocatoria?" },
  embajador: { etiqueta: "Nombre o código del embajador", ayuda: "Si no lo recuerdas, cuéntanos algo para identificarlo, como su ciudad o teléfono." },
  aplicoAntes: { etiqueta: "¿Has aplicado antes a Jóvenes creaTIvos?" },
};

/**
 * [TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA] Autorización de datos en lenguaje sencillo, igual en los 4 países
 * salvo la ley y la autoridad. La Fundación ROFÉ debe revisarla y reemplazarla: se edita SOLO aquí (o en el país).
 * Cada consentimiento guarda su `version`: al cambiar un texto hay que cambiar su versión.
 */
export function legalDe(entrada: { pais: PaisSlug; trato: Trato; versionAnterior: string }): LegalPais {
  // La ley y la autoridad de cada país son las mismas que muestra /privacidad (shared/config/legal.ts).
  const datos = { ...entrada, ...LEY_DATOS[entrada.pais] };
  const vos = datos.trato === "vos";
  const t = (tu: string, v: string) => (vos ? v : tu);
  return {
    provisional: true,
    ley: datos.ley,
    autoridad: datos.autoridad,
    versionAnterior: datos.versionAnterior,
    versionAcudienteAnterior: "acudiente-2027-provisional-1",
    titulo: "Cómo usamos tus datos",
    parrafos: [
      "El responsable de tus datos es la Fundación ROFÉ.",
      t(
        "Los usamos para gestionar tu inscripción y el proceso de selección, contactarte sobre el proceso y el programa, y elaborar estadísticas del programa en las que nadie se identifica.",
        "Los usamos para gestionar tu inscripción y el proceso de selección, contactarte sobre el proceso y el programa, y elaborar estadísticas del programa en las que nadie se identifica.",
      ),
      t(
        "Los datos sensibles (género, poblaciones e ingresos) son voluntarios: puedes dejarlos en «Prefiero no responder». Solo se usan sumados, para estadísticas e informes del programa.",
        "Los datos sensibles (género, poblaciones e ingresos) son voluntarios: podés dejarlos en «Prefiero no responder». Solo se usan sumados, para estadísticas e informes del programa.",
      ),
      "No vendemos tus datos ni los compartimos con terceros, salvo lo necesario para operar el programa.",
      t(
        `Tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, y a revocar esta autorización, según la ${datos.ley}. También puedes reclamar ante ${datos.autoridad}.`,
        `Tenés derecho a conocer, actualizar, rectificar y suprimir tus datos, y a revocar esta autorización, según la ${datos.ley}. También podés reclamar ante ${datos.autoridad}.`,
      ),
      t(`Para dudas o para ejercer tus derechos, escribe a ${CONTACTO.correo}.`, `Para dudas o para ejercer tus derechos, escribí a ${CONTACTO.correo}.`),
    ],
    consentimientos: [
      { clave: "privacidad", version: VERSION_PRIVACIDAD, texto: "Leí y acepto la Política de privacidad" },
      { clave: "datos", version: `datos-${datos.pais}-2027-provisional-1`, texto: `Autorizo el tratamiento de mis datos personales, según la ${datos.ley}` },
      { clave: "acudiente", version: "acudiente-2027-provisional-2", texto: "Como madre, padre o adulto responsable, autorizo la inscripción y el tratamiento de los datos" },
    ],
  };
}
