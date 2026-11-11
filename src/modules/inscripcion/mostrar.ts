// Convierte respuestas (ids) en texto legible para el resumen del formulario. Función pura.
import { CIUDAD_OTRA } from "./config/paises";
import {
  AUTONOMIA, CANALES, COMPUTADORA, EMPRENDIMIENTO, GENERO, HORAS, INGRESOS, OCUPACION, OTRAS_POSTULACIONES, POBLACIONES,
  RELACION_ACUDIENTE, SI_NO, TALLAS, type IdCampo,
} from "./config/preguntas";
import { txt } from "./config/textos";
import type { ConfigPaisInscripcion, Opcion } from "./config/tipos";
import type { Borrador } from "./schema";

function opciones(cfg: ConfigPaisInscripcion, campo: IdCampo): Opcion[] | undefined {
  switch (campo) {
    case "sede": return cfg.sedes.map((s) => ({ id: s.id, etiqueta: s.nombre }));
    case "tipoDocumento": return cfg.tiposDocumento;
    case "grado": return cfg.grados;
    case "acudienteRelacion": return RELACION_ACUDIENTE;
    case "internet": case "aplicoAntes": case "seleccionadoAntes": return SI_NO;
    case "computadora": return COMPUTADORA;
    case "autonomia": return AUTONOMIA;
    case "horas": return HORAS;
    case "ocupacion": return OCUPACION;
    case "emprendimiento": return EMPRENDIMIENTO;
    case "otrasPostulaciones": return OTRAS_POSTULACIONES;
    case "genero": return GENERO;
    case "poblaciones": return POBLACIONES;
    case "ingresos": return INGRESOS;
    case "talla": return TALLAS;
    case "canal": return CANALES;
    default: return undefined;
  }
}

/** Texto de una respuesta, o "" si está vacía. */
export function textoRespuesta(cfg: ConfigPaisInscripcion, campo: IdCampo, d: Borrador): string {
  const valor = d[campo];
  if (valor === undefined || valor === "" || (Array.isArray(valor) && !valor.length)) return "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (campo === "ciudad" && valor === CIUDAD_OTRA) return d.ciudadOtra || "Otra";
  if (campo === "fechaNacimiento" && typeof valor === "string") {
    const [a, m, dia] = valor.split("-");
    return a && m && dia ? `${dia}/${m}/${a}` : valor;
  }
  const lista = opciones(cfg, campo);
  const etiqueta = (id: string) => {
    const o = lista?.find((x) => x.id === id);
    return o ? txt(o.etiqueta, cfg.trato).replace(/\.$/, "") : id;
  };
  return Array.isArray(valor) ? valor.map(etiqueta).join(", ") : etiqueta(valor);
}
