// Convierte respuestas (ids) en texto legible para el resumen del formulario y el panel. Función pura.
// Las opciones salen de la definición del país; las que son iguales en todos, de config/preguntas.ts.
import {
  AUTONOMIA, CONDICIONES_LABORALES, CONOCIMIENTO, ELEMENTOS, EMPRENDIMIENTO, ESTRATO, HORAS, INGLES, NUCLEO, OTRAS_POSTULACIONES, PREGUNTAS,
  RELACION_ACUDIENTE, SERVICIOS, SI_NO, VIVIENDA,
} from "./config/preguntas";
import { txt } from "./config/textos";
import type { DefinicionPais, Opcion, TextoTrato } from "./config/tipos";
import { CIUDAD_OTRA, type Borrador } from "./schema";

/** Opciones de una pregunta en un país, o undefined si es de texto libre. */
export function opcionesDe(def: DefinicionPais, campo: string): Opcion[] | undefined {
  const { config: cfg, opciones: ops } = def;
  switch (campo) {
    case "sede": return cfg.sedes.map((s) => ({ id: s.id, etiqueta: s.nombre }));
    case "tipoDocumento": return cfg.tiposDocumento;
    case "grado": return cfg.grados;
    case "acudienteRelacion": return RELACION_ACUDIENTE;
    case "internet": case "aplicoAntes": case "seleccionadoAntes": return SI_NO;
    case "computadora": return ops.computadora;
    case "autonomia": return AUTONOMIA;
    case "horas": return HORAS;
    case "ocupacion": return ops.ocupacion;
    case "emprendimiento": return EMPRENDIMIENTO;
    case "laboral": return CONDICIONES_LABORALES;
    case "otrasPostulaciones": return OTRAS_POSTULACIONES;
    case "genero": return ops.genero;
    case "poblaciones": return ops.poblaciones;
    case "ingresos": return ops.ingresos;
    case "talla": return ops.tallas;
    case "vivienda": return VIVIENDA;
    case "estrato": return ESTRATO;
    case "nucleo": return NUCLEO;
    case "elementos": return ELEMENTOS;
    case "servicios": return SERVICIOS;
    case "conocimiento": return CONOCIMIENTO;
    case "ingles": return INGLES;
    case "canal": return ops.canales;
    default: return undefined;
  }
}

type TextoPregunta = { etiqueta: TextoTrato; ayuda?: TextoTrato; placeholder?: string };

/** Etiqueta, ayuda y ejemplo de una pregunta: lo propio del país gana a lo común. */
export function preguntaDe(def: DefinicionPais, campo: string): { etiqueta: string; ayuda?: string; placeholder?: string } {
  const comun = (PREGUNTAS as Record<string, TextoPregunta | undefined>)[campo];
  const propia = def.etiquetas?.[campo];
  const tr = def.config.trato;
  const etiqueta = propia?.etiqueta ?? comun?.etiqueta ?? campo;
  const ayuda = propia?.ayuda ?? comun?.ayuda;
  return { etiqueta: txt(etiqueta, tr), ayuda: ayuda ? txt(ayuda, tr) || undefined : undefined, placeholder: comun?.placeholder };
}

/** Texto de una respuesta, o "" si está vacía. */
export function textoRespuesta(def: DefinicionPais, campo: string, d: Borrador): string {
  const valor = (d as Record<string, unknown>)[campo];
  if (valor === undefined || valor === "" || (Array.isArray(valor) && !valor.length)) return "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (campo === "ciudad" && valor === CIUDAD_OTRA) return d.ciudadOtra || "Otra";
  if (campo === "sede" && valor === CIUDAD_OTRA) return d.ciudadOtra ? `${d.ciudadOtra} (otra ciudad)` : "Otra ciudad";
  if (campo === "fechaNacimiento" && typeof valor === "string") {
    const [a, m, dia] = valor.split("-");
    return a && m && dia ? `${dia}/${m}/${a}` : valor;
  }
  const lista = opcionesDe(def, campo);
  const etiqueta = (id: string) => {
    const o = lista?.find((x) => x.id === id);
    return o ? txt(o.etiqueta, def.config.trato).replace(/\.$/, "") : id;
  };
  return Array.isArray(valor) ? valor.map((x) => etiqueta(String(x))).join(", ") : etiqueta(String(valor));
}
