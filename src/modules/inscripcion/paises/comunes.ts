// Piezas que comparten las definiciones de los 4 países: reglas de documentos, pasos del formulario según el modo
// de ubicación y el texto legal en lenguaje sencillo. Son solo datos y funciones puras: importar este archivo nunca
// lanza errores, y cada país (uy.ts, col.ts, ecu.ts, pan.ts) arma con esto su propia definición.
import { LEY_DATOS, RESPONSABLE, VERSION_ACUDIENTE, VERSION_DATOS, VERSION_PRIVACIDAD } from "@/shared/config/legal";
import type { PaisSlug } from "@/shared/config/paises";
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
 * Autorización de datos, tomada de la política oficial de la Fundación ROFÉ (DE-010-D v1, ver shared/config/legal.ts).
 * Igual en los 4 países (solo cambia el trato tú / vos del aviso). Regla: cada frase está respaldada por ese documento.
 * Cada consentimiento guarda su `version`: al cambiar un texto hay que cambiar su versión en shared/config/legal.ts.
 */
export function legalDe(entrada: { pais: PaisSlug; trato: Trato; versionAnterior: string }): LegalPais {
  const ley = LEY_DATOS[entrada.pais];
  const vos = entrada.trato === "vos";
  const t = (tu: string, v: string) => (vos ? v : tu);
  const r = RESPONSABLE;
  return {
    provisional: false,
    ley: ley.ley,
    autoridad: ley.autoridad,
    versionAnterior: entrada.versionAnterior,
    versionAcudienteAnterior: "acudiente-2027-provisional-1",
    titulo: "Cómo usamos tus datos",
    parrafos: [
      `El responsable de tus datos es la ${r.nombre} (NIT ${r.nit}), ${r.direccion}.`,
      "La Fundación usa tus datos para el desarrollo de sus programas, lo que puede incluir información sobre tu núcleo familiar y tus condiciones socioeconómicas, y para enviarte información sobre sus programas por SMS, correo electrónico o llamada, solo de lunes a viernes de 7:00 a. m. a 7:00 p. m. y los sábados de 8:00 a. m. a 3:00 p. m.",
      t(
        "Los datos sensibles solo se tratan con tu autorización expresa: la Fundación se compromete a usarlos únicamente para esos fines y a cuidar su confidencialidad. En esas preguntas puedes elegir «Prefiero no responder».",
        "Los datos sensibles solo se tratan con tu autorización expresa: la Fundación se compromete a usarlos únicamente para esos fines y a cuidar su confidencialidad. En esas preguntas podés elegir «Prefiero no responder».",
      ),
      t(
        "Si eres menor de edad, la autorización la da tu representante legal o acudiente.",
        "Si sos menor de edad, la autorización la da tu representante legal o acudiente.",
      ),
      "La Fundación puede entregar la información a terceros que actúen como Encargados, para cumplir esas finalidades. Pasados 10 años desde la afiliación al programa, elimina la información, salvo que la ley la obligue a conservarla.",
      t(
        `Tienes derecho a conocer, actualizar, rectificar y suprimir tus datos, a pedir prueba de esta autorización y a revocarla, según la ${ley.ley}. Para hacerlo, escribe a ${r.correo} con una copia de tu documento. Si no te responden a tiempo o no estás conforme con la respuesta, puedes presentar una queja ante ${ley.autoridad}.`,
        `Tenés derecho a conocer, actualizar, rectificar y suprimir tus datos, a pedir prueba de esta autorización y a revocarla, según la ${ley.ley}. Para hacerlo, escribí a ${r.correo} con una copia de tu documento. Si no te responden a tiempo o no estás conforme con la respuesta, podés presentar una queja ante ${ley.autoridad}.`,
      ),
    ],
    consentimientos: [
      { clave: "privacidad", version: VERSION_PRIVACIDAD, texto: `Leí y acepto la Política de Tratamiento de Datos de la ${r.nombre}` },
      { clave: "datos", version: VERSION_DATOS, texto: `Autorizo a la ${r.nombre} el tratamiento de mis datos personales, incluidos los datos sensibles que entregue, para las finalidades de su Política de Tratamiento de Datos` },
      { clave: "acudiente", version: VERSION_ACUDIENTE, texto: `Como representante legal o acudiente, autorizo la inscripción de la persona menor de edad y el tratamiento de sus datos personales, según la Política de Tratamiento de Datos de la ${r.nombre}` },
    ],
  };
}
