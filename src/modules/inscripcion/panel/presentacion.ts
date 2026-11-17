// Cómo se muestra una inscripción guardada en el panel y en la exportación. Funciones puras.
// Reutiliza las etiquetas del formulario (config/preguntas.ts y config/paises.ts): los ids guardados se traducen
// al mismo texto que vio la persona al inscribirse.
import { LEY_DATOS } from "@/shared/config/legal";
import { NOMBRE_PAIS, type PaisSlug } from "@/shared/config/paises";
import { ALERTAS, type CodigoAlerta } from "../config/alertas";
import { CAMPOS_SENSIBLES, TEXTOS_PANEL } from "../config/panel";
import { CIUDAD_OTRA, CONFIG_PAISES, DEFINICIONES } from "../config/paises";
import { PASOS, PREGUNTAS, type IdCampo } from "../config/preguntas";
import { txt } from "../config/textos";
import { textoRespuesta } from "../mostrar";
import type { Inscripcion } from "../repository";
import type { Borrador } from "../schema";

const SENSIBLES = new Set<IdCampo>(CAMPOS_SENSIBLES);
export const esSensible = (campo: IdCampo): boolean => SENSIBLES.has(campo);

/** Etiqueta de una pregunta en el panel (siempre con tuteo). */
export const etiquetaPregunta = (campo: IdCampo): string => txt(PREGUNTAS[campo].etiqueta, "tu");

export const nombreSede = (pais: PaisSlug, sede: string): string =>
  CONFIG_PAISES[pais]?.sedes.find((s) => s.id === sede)?.nombre ?? sede;

export const nombreTipoDocumento = (pais: PaisSlug, id: string): string =>
  CONFIG_PAISES[pais]?.tiposDocumento.find((t) => t.id === id)?.etiqueta ?? id;

export const nombreCiudad =(d: Pick<Inscripcion, "ciudad" | "ciudadOtra">): string =>
  d.ciudad === CIUDAD_OTRA ? `${d.ciudadOtra ?? "Otra"} (otra)` : d.ciudad;

export const nombreCompleto = (d: Pick<Inscripcion, "nombres" | "apellidos">): string => `${d.nombres} ${d.apellidos}`.trim();

export const textoAlerta = (codigo: string): string => ALERTAS[codigo as CodigoAlerta] ?? codigo;

/** La inscripción guardada con la forma que espera `textoRespuesta` (la del borrador del formulario). */
function aBorrador(doc: Inscripcion): Borrador {
  const plano: Record<string, unknown> = { ...doc };
  if (doc.acudiente) {
    plano.acudienteNombres = doc.acudiente.nombres;
    plano.acudienteApellidos = doc.acudiente.apellidos;
    plano.acudienteCorreo = doc.acudiente.correo;
    plano.acudienteTelefono = doc.acudiente.telefono;
    plano.acudienteRelacion = doc.acudiente.relacion;
    plano.acudienteRelacionOtra = doc.acudiente.relacionOtra;
  }
  // Números como se escriben en español (9,5), igual que en el formulario.
  for (const [k, v] of Object.entries(plano)) if (typeof v === "number") plano[k] = k === "anioEgreso" ? String(v) : v.toLocaleString("es");
  return plano as Borrador;
}

/** Texto de una respuesta guardada ("" si no respondió). */
export function valorCampo(doc: Inscripcion, campo: IdCampo, b = aBorrador(doc)): string {
  const cfg = DEFINICIONES[doc.pais];
  if (!cfg) return "";
  if (campo === "sede") return nombreSede(doc.pais, doc.sede);
  return textoRespuesta(cfg, campo, b);
}

export type FilaDetalle = { etiqueta: string; valor: string; reservado?: boolean };
export type SeccionDetalle = { titulo: string; filas: FilaDetalle[] };

// Campos de "Cierre" que no aportan en el detalle (siempre son "Sí": sin aceptarlos no hay inscripción).
const OMITIR_DETALLE = new Set<IdCampo>(["aceptaDatos", "autorizaAcudiente", "ciudadOtra"]);

/** Títulos del detalle en el panel (en tercera persona; los del formulario le hablan a quien se inscribe). */
const TITULOS_DETALLE: Record<string, string> = { ubicacion: "Dónde vive", perfil: "Sobre la persona", cierre: "Difusión" };

/** Detalle agrupado por los pasos del formulario. Sin permiso, los datos sensibles se reemplazan por un aviso. */
export function seccionesDetalle(doc: Inscripcion, verSensibles: boolean): SeccionDetalle[] {
  const b = aBorrador(doc);
  const secciones: SeccionDetalle[] = [];
  for (const paso of PASOS) {
    if (paso.id === "acudiente" && !doc.acudiente) continue;
    const filas: FilaDetalle[] = [];
    for (const campo of paso.campos) {
      if (OMITIR_DETALLE.has(campo)) continue;
      if (esSensible(campo) && !verSensibles) {
        // Se muestra la pregunta para que se sepa que existe, pero no la respuesta.
        if (campo === "poblacionOtra") continue;
        filas.push({ etiqueta: etiquetaPregunta(campo), valor: TEXTOS_PANEL.sensibleOculto, reservado: true });
        continue;
      }
      const valor = campo === "ciudad" ? nombreCiudad(doc) : valorCampo(doc, campo, b);
      if (valor) filas.push({ etiqueta: etiquetaPregunta(campo), valor });
    }
    if (paso.id === "personales") filas.push({ etiqueta: "Edad al inscribirse", valor: `${doc.edad} años` });
    if (filas.length) secciones.push({ titulo: TITULOS_DETALLE[paso.id] ?? txt(paso.titulo, "tu"), filas });
  }
  return secciones;
}

// ---------- Consentimientos ----------

export type EstadoConsentimiento = "acepto" | "no_acepto" | "no_aplica" | "no_pedido";
export type FilaConsentimiento = { clave: string; etiqueta: string; estado: EstadoConsentimiento; version?: string; fecha?: Date };

/**
 * Qué aceptó la persona, con versión del texto y fecha (registro inalterable). Las inscripciones anteriores al
 * formulario 2027 no traen `consentimientos`: se arman con versionAutorizacion y la fecha de la inscripción, y la
 * política de privacidad figura como "no se pedía".
 */
export function filasConsentimiento(doc: Inscripcion): FilaConsentimiento[] {
  const etiquetas: Record<string, string> = {
    privacidad: "Política de privacidad",
    datos: `Tratamiento de datos personales (${LEY_DATOS[doc.pais]?.ley ?? "ley de datos"})`,
    acudiente: "Autorización de adulto responsable",
  };
  const guardados = doc.consentimientos;
  return (["privacidad", "datos", "acudiente"] as const).map((clave) => {
    const etiqueta = etiquetas[clave]!;
    const c = guardados?.find((x) => x.clave === clave);
    if (c) return { clave, etiqueta, estado: c.respuesta ? "acepto" : "no_acepto", version: c.version, fecha: c.fecha };
    if (clave === "acudiente" && !doc.acudiente) return { clave, etiqueta, estado: "no_aplica", fecha: doc.creadoEn };
    if (guardados?.length && clave === "privacidad") return { clave, etiqueta, estado: "no_pedido" };
    if (!guardados?.length) {
      if (clave === "privacidad") return { clave, etiqueta, estado: "no_pedido" };
      const version = clave === "datos" ? doc.versionAutorizacion : doc.versionAutorizacionAcudiente;
      return version ? { clave, etiqueta, estado: "acepto", version, fecha: doc.creadoEn } : { clave, etiqueta, estado: "no_pedido" };
    }
    return { clave, etiqueta, estado: "no_pedido" };
  });
}

// ---------- Exportación ----------

export type ValorCelda = string | number | Date;
export type Columna = { titulo: string; ancho?: number; valor: (doc: Inscripcion) => ValorCelda };

const pregunta = (campo: IdCampo, ancho = 22): Columna => ({ titulo: etiquetaPregunta(campo), ancho, valor: (d) => valorCampo(d, campo) });

/** Columnas de la exportación. Sin permiso para datos sensibles, esas columnas no existen (no van vacías). */
export function columnasExportacion(verSensibles: boolean): Columna[] {
  const columnas: Columna[] = [
    { titulo: "Número de inscripción", ancho: 22, valor: (d) => d.radicado },
    { titulo: "Fecha de inscripción", ancho: 20, valor: (d) => d.creadoEn },
    { titulo: "País", ancho: 12, valor: (d) => NOMBRE_PAIS[d.pais] ?? d.pais },
    pregunta("sede", 16),
    { titulo: etiquetaPregunta("ciudad"), ancho: 22, valor: nombreCiudad },
    pregunta("direccion", 30),
    pregunta("nombres"),
    pregunta("apellidos"),
    pregunta("tipoDocumento", 18),
    { titulo: "Tipo de documento (otro)", ancho: 16, valor: (d) => d.tipoDocumentoOtro ?? "" },
    { titulo: etiquetaPregunta("documento"), ancho: 16, valor: (d) => d.documento },
    pregunta("fechaNacimiento", 14),
    { titulo: "Edad al inscribirse", ancho: 10, valor: (d) => d.edad },
    { titulo: etiquetaPregunta("correo"), ancho: 28, valor: (d) => d.correo },
    { titulo: etiquetaPregunta("whatsapp"), ancho: 16, valor: (d) => d.whatsapp },
    { titulo: etiquetaPregunta("telefonoAlterno"), ancho: 16, valor: (d) => d.telefonoAlterno },
    { titulo: "Menor de edad", ancho: 10, valor: (d) => (d.acudiente ? "Sí" : "No") },
    { titulo: "Acudiente: nombre", ancho: 24, valor: (d) => (d.acudiente ? `${d.acudiente.nombres} ${d.acudiente.apellidos}` : "") },
    { titulo: "Acudiente: correo", ancho: 26, valor: (d) => d.acudiente?.correo ?? "" },
    { titulo: "Acudiente: teléfono", ancho: 16, valor: (d) => d.acudiente?.telefono ?? "" },
    { titulo: "Acudiente: relación", ancho: 14, valor: (d) => valorCampo(d, "acudienteRelacion") },
    pregunta("grado", 16),
    { titulo: etiquetaPregunta("anioEgreso"), ancho: 10, valor: (d) => d.anioEgreso ?? "" },
    { titulo: etiquetaPregunta("promedio"), ancho: 10, valor: (d) => d.promedio ?? "" },
    pregunta("institucion", 28),
    pregunta("internet", 10),
    pregunta("computadora", 30),
    pregunta("autonomia", 30),
    pregunta("horas", 18),
    pregunta("ocupacion", 26),
    pregunta("emprendimiento", 30),
    pregunta("otrasPostulaciones", 30),
    pregunta("aplicoAntes", 10),
    pregunta("seleccionadoAntes", 10),
  ];
  if (verSensibles) columnas.push(pregunta("genero", 14), pregunta("poblaciones", 30), pregunta("ingresos", 24));
  columnas.push(
    pregunta("talla", 8),
    pregunta("canal", 26),
    { titulo: "Canal (otro)", ancho: 18, valor: (d) => d.canalOtro ?? "" },
    { titulo: "Embajador", ancho: 22, valor: (d) => d.embajador ?? "" },
    { titulo: "Alertas", ancho: 40, valor: (d) => d.alertas.map((a) => a.motivo).join(" · ") },
    { titulo: "utm_source", ancho: 14, valor: (d) => d.origen?.utm_source ?? "" },
    { titulo: "utm_medium", ancho: 14, valor: (d) => d.origen?.utm_medium ?? "" },
    { titulo: "utm_campaign", ancho: 16, valor: (d) => d.origen?.utm_campaign ?? "" },
    { titulo: "Versión de la autorización", ancho: 22, valor: (d) => d.versionAutorizacion },
  );
  return columnas;
}

/** Etiqueta de una opción de una pregunta (para las gráficas). `pais` hace falta para sedes y grados. */
export function etiquetaOpcion(campo: IdCampo, id: string, pais: PaisSlug = "col"): string {
  const cfg = DEFINICIONES[pais];
  if (campo === "sede") return nombreSede(pais, id);
  const valor = ["internet", "aplicoAntes", "seleccionadoAntes"].includes(campo) ? id === "true" : id;
  const texto = textoRespuesta(cfg, campo, { [campo]: valor } as Borrador);
  return texto || "Sin respuesta";
}
