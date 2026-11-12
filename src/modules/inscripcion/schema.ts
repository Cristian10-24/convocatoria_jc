// Esquema de la inscripción: el MISMO código valida en el navegador (paso a paso) y en el servidor (todo junto).
// 1) `Entrada` (zod) fija la forma: textos acotados, listas acotadas, booleanos; descarta claves desconocidas.
// 2) `revisar()` aplica las reglas de cada campo, las condiciones (qué se pregunta a quién) y normaliza.
// 3) `esquemaInscripcion()` une las dos cosas en un esquema zod que devuelve los datos listos para guardar.
import { z } from "zod";
import type { PaisSlug } from "@/shared/config/paises";
import { normalizarCorreo, correoValido } from "@/shared/validation/correo";
import { edad as calcularEdad, fechaValida } from "@/shared/validation/fechas";
import { validarCelular } from "@/shared/validation/telefono";
import { nombrePropio, limpiarEspacios, partesNombreValidas, textoConSentido } from "@/shared/validation/textos";
import { CIUDAD_OTRA, CONFIG_PAISES } from "./config/paises";
import {
  AUTONOMIA, CANALES, COMPUTADORA, EMPRENDIMIENTO, GENERO, HORAS, INGRESOS, OCUPACION, OTRAS_POSTULACIONES, PASOS, POBLACIONES,
  POBLACION_NINGUNA, RELACION_ACUDIENTE, SI_NO, TALLAS, type IdCampo, type Paso,
} from "./config/preguntas";
import { MENSAJES, plantilla, txt } from "./config/textos";
import type { ConfigPaisInscripcion, Opcion, ReglaDocumento } from "./config/tipos";
import { TELEFONOS } from "@/shared/config/paises";

// ---------- 1. Forma ----------
const texto = (max = 120) => z.string().max(max).optional().default("");
const lista = z.array(z.string().max(40)).max(12).optional().default([]);

export const Entrada = z.object({
  sede: texto(40), ciudad: texto(80), ciudadOtra: texto(80), direccion: texto(160),
  nombres: texto(80), apellidos: texto(80), tipoDocumento: texto(20), tipoDocumentoOtro: texto(60), documento: texto(30),
  fechaNacimiento: texto(10), correo: texto(120), whatsapp: texto(30), telefonoAlterno: texto(30),
  acudienteNombres: texto(80), acudienteApellidos: texto(80), acudienteCorreo: texto(120), acudienteTelefono: texto(30),
  acudienteRelacion: texto(20), acudienteRelacionOtra: texto(60),
  grado: texto(20), anioEgreso: texto(4), promedio: texto(6), institucion: texto(120), internet: texto(4), computadora: texto(20),
  autonomia: texto(20), horas: texto(20),
  ocupacion: lista, ocupacionOtra: texto(80), emprendimiento: texto(20), otrasPostulaciones: texto(20), aplicoAntes: texto(4), seleccionadoAntes: texto(4),
  genero: texto(20), poblaciones: lista, poblacionOtra: texto(80), ingresos: texto(20), talla: texto(4),
  canal: texto(20), canalOtro: texto(80), embajador: texto(120),
  aceptaDatos: z.boolean().optional().default(false), autorizaAcudiente: z.boolean().optional().default(false),
});
export type EntradaInscripcion = z.infer<typeof Entrada>;
/** Lo que el formulario guarda mientras se llena (todo opcional). */
export type Borrador = Partial<z.input<typeof Entrada>>;

// ---------- Datos normalizados (lo que se guarda) ----------
export type DatosInscripcion = {
  sede: string; ciudad: string; ciudadOtra?: string; direccion: string;
  nombres: string; apellidos: string; tipoDocumento: string; tipoDocumentoOtro?: string; documento: string;
  fechaNacimiento: string; edad: number; correo: string; whatsapp: string; telefonoAlterno: string;
  acudiente?: { nombres: string; apellidos: string; correo: string; telefono: string; relacion: string; relacionOtra?: string };
  grado: string; anioEgreso?: number; promedio: number; institucion: string; internet: boolean; computadora: string; autonomia: string; horas: string;
  ocupacion: string[]; ocupacionOtra?: string; emprendimiento: string; otrasPostulaciones: string; aplicoAntes: boolean; seleccionadoAntes?: boolean;
  genero: string; poblaciones: string[]; poblacionOtra?: string; ingresos: string; talla: string;
  canal: string; canalOtro?: string; embajador?: string;
  aceptaDatos: true; autorizaAcudiente?: true;
};

// ---------- 2. Condiciones: qué se pregunta a quién ----------
export function edadDe(d: Pick<Borrador, "fechaNacimiento">, hoy: string): number | null {
  return d.fechaNacimiento && fechaValida(d.fechaNacimiento) && d.fechaNacimiento <= hoy ? calcularEdad(d.fechaNacimiento, hoy) : null;
}

export function esMenor(cfg: ConfigPaisInscripcion, d: Borrador, hoy: string): boolean {
  const e = edadDe(d, hoy);
  return e !== null && e < cfg.edad.mayoriaDeEdad;
}

/** Campos que se muestran (y se validan) con lo que se lleva respondido. */
export function camposVisibles(cfg: ConfigPaisInscripcion, d: Borrador, hoy: string): Set<IdCampo> {
  const ocultos = new Set<IdCampo>();
  if (cfg.sedes.length <= 1) ocultos.add("sede");
  if (d.ciudad !== CIUDAD_OTRA) ocultos.add("ciudadOtra");
  if (!cfg.tiposDocumento.find((t) => t.id === d.tipoDocumento)?.conTexto) ocultos.add("tipoDocumentoOtro");
  if (d.acudienteRelacion !== "otro") ocultos.add("acudienteRelacionOtra");
  if (d.grado !== "egresado") ocultos.add("anioEgreso");
  if (!d.ocupacion?.includes("otro")) ocultos.add("ocupacionOtra");
  if (d.aplicoAntes !== "si") ocultos.add("seleccionadoAntes");
  if (!d.poblaciones?.includes("otra")) ocultos.add("poblacionOtra");
  if (d.canal !== "otro") ocultos.add("canalOtro");
  if (d.canal !== "embajador") ocultos.add("embajador");
  const menor = esMenor(cfg, d, hoy);
  if (!menor) {
    for (const c of PASOS.find((p) => p.id === "acudiente")!.campos) ocultos.add(c);
    ocultos.add("autorizaAcudiente");
  }
  return new Set(PASOS.flatMap((p) => p.campos).filter((c) => !ocultos.has(c)));
}

/** Pasos que se muestran: el del acudiente solo a menores de edad. */
export function pasosVisibles(cfg: ConfigPaisInscripcion, d: Borrador, hoy: string): Paso[] {
  return PASOS.filter((p) => p.id !== "acudiente" || esMenor(cfg, d, hoy));
}

/** Sede efectiva: la elegida, o la única del país. */
export function sedeDe(cfg: ConfigPaisInscripcion, d: Borrador): string | undefined {
  return cfg.sedes.length === 1 ? cfg.sedes[0]!.id : d.sede || undefined;
}

// ---------- Reglas ----------
/** Documento tal como se guarda: texto sin espacios en los extremos y, si admite letras, en mayúsculas. */
export function documentoNormalizado(regla: ReglaDocumento, valor: string): string {
  const d = valor.trim();
  return regla.formato === "alfanumerico" ? d.toUpperCase() : d;
}

/** Lo que el campo deja escribir: descarta al vuelo los caracteres que el formato no admite. */
export function documentoAlEscribir(regla: ReglaDocumento | undefined, valor: string): string {
  if (regla?.formato === "alfanumerico") return valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  return valor.replace(/\D/g, "");
}

/** Solo dígitos (o letras y números), con la longitud del tipo y sin repetir un único carácter (111111). */
function documentoValido(regla: ReglaDocumento, valor: string): boolean {
  const d = documentoNormalizado(regla, valor);
  const forma = regla.formato === "alfanumerico" ? /^[0-9A-Z]+$/ : /^\d+$/;
  return forma.test(d) && d.length >= regla.min && d.length <= regla.max && !/^(.)\1+$/.test(d);
}

const opcionValida = (opciones: Opcion[], id: string) => opciones.some((o) => o.id === id);

export type Errores = Partial<Record<IdCampo, string>>;
export type Revision = { errores: Errores; datos?: DatosInscripcion };

/**
 * Revisa una inscripción con las reglas del país. Solo revisa los campos visibles.
 * @param hoy  fecha de referencia "AAAA-MM-DD" (para la edad y el año de egreso)
 */
export function revisar(cfg: ConfigPaisInscripcion, d: EntradaInscripcion, hoy: string): Revision {
  const tr = cfg.trato;
  const m = (k: keyof typeof MENSAJES, valores: Record<string, string | number> = {}) => plantilla(txt(MENSAJES[k], tr), valores);
  const visibles = camposVisibles(cfg, d, hoy);
  const errores: Errores = {};
  const error = (campo: IdCampo, mensaje: string) => {
    if (visibles.has(campo) && !errores[campo]) errores[campo] = mensaje;
  };
  const vacio = (v: string) => limpiarEspacios(v) === "";

  const unica = (campo: IdCampo, opciones: Opcion[]) => {
    const v = d[campo] as string;
    if (vacio(v)) error(campo, m("elegir"));
    else if (!opcionValida(opciones, v)) error(campo, m("elegir"));
  };
  const libre = (campo: IdCampo, min = 2) => {
    const v = d[campo] as string;
    if (vacio(v)) error(campo, m("cual"));
    else if (!textoConSentido(v, min)) error(campo, m("texto"));
  };
  const nombre = (campo: IdCampo) => {
    const v = d[campo] as string;
    if (vacio(v)) error(campo, m("obligatorio"));
    else if (!partesNombreValidas(v)) error(campo, m("nombre"));
  };
  const correo = (campo: IdCampo) => {
    const v = normalizarCorreo(d[campo] as string);
    if (!v) error(campo, m("obligatorio"));
    else if (!correoValido(v)) error(campo, m("correo"));
    return v;
  };
  const celular = (campo: IdCampo) => {
    const v = d[campo] as string;
    const r = validarCelular(v, cfg.telefono);
    if (vacio(v)) error(campo, m("obligatorio"));
    else if (!r.ok) error(campo, m("celular", { ejemplo: TELEFONOS[cfg.telefono].ejemplo }));
    return r.ok ? r.e164 : "";
  };

  // Paso 1 · Ubicación
  const sede = sedeDe(cfg, d);
  const sedeCfg = cfg.sedes.find((s) => s.id === sede);
  if (!sedeCfg) error("sede", m("elegir"));
  if (vacio(d.ciudad)) error("ciudad", m("elegir"));
  else if (d.ciudad !== CIUDAD_OTRA && !sedeCfg?.ciudades.includes(d.ciudad)) error("ciudad", m("elegir"));
  if (d.ciudad === CIUDAD_OTRA) libre("ciudadOtra");
  if (vacio(d.direccion)) error("direccion", m("obligatorio"));
  else if (!textoConSentido(d.direccion, 5)) error("direccion", m("direccion"));

  // Paso 2 · Datos personales
  nombre("nombres");
  nombre("apellidos");
  const tipo = cfg.tiposDocumento.find((t) => t.id === d.tipoDocumento);
  if (!tipo) error("tipoDocumento", m("elegir"));
  if (tipo?.conTexto) libre("tipoDocumentoOtro");
  if (vacio(d.documento)) error("documento", m("obligatorio"));
  else if (tipo && !documentoValido(tipo.regla, d.documento))
    error("documento", m(tipo.regla.formato === "alfanumerico" ? "documentoAlfanumerico" : "documento"));
  let edad: number | null = null;
  if (vacio(d.fechaNacimiento)) error("fechaNacimiento", m("obligatorio"));
  else if (!fechaValida(d.fechaNacimiento) || d.fechaNacimiento < "1940-01-01") error("fechaNacimiento", m("fecha"));
  else if (d.fechaNacimiento > hoy) error("fechaNacimiento", m("fechaFutura"));
  else {
    edad = calcularEdad(d.fechaNacimiento, hoy);
    if (edad < cfg.edad.minima) error("fechaNacimiento", m("edadMinima", { min: cfg.edad.minima }));
  }
  const correoN = correo("correo");
  const whatsapp = celular("whatsapp");
  const alterno = celular("telefonoAlterno");
  if (whatsapp && alterno && whatsapp === alterno) error("telefonoAlterno", m("alternoIgual"));

  // Paso 3 · Acudiente (solo menores)
  const menor = visibles.has("acudienteNombres");
  let acudiente: DatosInscripcion["acudiente"];
  if (menor) {
    nombre("acudienteNombres");
    nombre("acudienteApellidos");
    const c = correo("acudienteCorreo");
    const t = celular("acudienteTelefono");
    unica("acudienteRelacion", RELACION_ACUDIENTE);
    if (d.acudienteRelacion === "otro") libre("acudienteRelacionOtra");
    acudiente = {
      nombres: nombrePropio(d.acudienteNombres), apellidos: nombrePropio(d.acudienteApellidos), correo: c, telefono: t,
      relacion: d.acudienteRelacion, relacionOtra: d.acudienteRelacion === "otro" ? limpiarEspacios(d.acudienteRelacionOtra) : undefined,
    };
  }

  // Paso 4 · Estudios y disponibilidad
  unica("grado", cfg.grados);
  let anioEgreso: number | undefined;
  if (d.grado === "egresado") {
    const anioHoy = Number(hoy.slice(0, 4));
    const a = Number(d.anioEgreso);
    if (vacio(d.anioEgreso)) error("anioEgreso", m("obligatorio"));
    else if (!/^\d{4}$/.test(d.anioEgreso.trim()) || a < 1980 || a > anioHoy) error("anioEgreso", m("anio"));
    else anioEgreso = a;
  }
  let promedio = NaN;
  const p = d.promedio.trim().replace(",", ".");
  if (!p) error("promedio", m("obligatorio"));
  else {
    promedio = /^\d{1,2}(\.\d{1,2})?$/.test(p) ? Number(p) : NaN;
    if (!(promedio >= cfg.escalaNotas.min && promedio <= cfg.escalaNotas.max)) error("promedio", m("promedio", cfg.escalaNotas));
  }
  if (vacio(d.institucion)) error("institucion", m("obligatorio"));
  else if (!textoConSentido(d.institucion, 3)) error("institucion", m("texto"));
  unica("internet", SI_NO);
  unica("computadora", COMPUTADORA);
  unica("autonomia", AUTONOMIA);
  unica("horas", HORAS);

  // Paso 5 · Perfil
  if (!d.ocupacion.length) error("ocupacion", m("elegirAlMenosUna"));
  else if (!d.ocupacion.every((o) => opcionValida(OCUPACION, o))) error("ocupacion", m("elegir"));
  if (d.ocupacion.includes("otro")) libre("ocupacionOtra");
  unica("emprendimiento", EMPRENDIMIENTO);
  unica("otrasPostulaciones", OTRAS_POSTULACIONES);
  unica("aplicoAntes", SI_NO);
  if (d.aplicoAntes === "si") unica("seleccionadoAntes", SI_NO);

  // Paso 6 · Sociodemográficos
  unica("genero", GENERO);
  if (!d.poblaciones.length) error("poblaciones", m("elegirAlMenosUna"));
  else if (!d.poblaciones.every((o) => opcionValida(POBLACIONES, o))) error("poblaciones", m("elegir"));
  else if (d.poblaciones.includes(POBLACION_NINGUNA) && d.poblaciones.length > 1) error("poblaciones", m("elegir"));
  if (d.poblaciones.includes("otra")) libre("poblacionOtra");
  unica("ingresos", INGRESOS);
  unica("talla", TALLAS);

  // Paso 7 · Cierre
  unica("canal", CANALES);
  if (d.canal === "otro") libre("canalOtro");
  if (d.canal === "embajador") libre("embajador");
  if (!d.aceptaDatos) error("aceptaDatos", m("aceptar"));
  if (menor && !d.autorizaAcudiente) error("autorizaAcudiente", m("acudienteAutoriza"));

  if (Object.keys(errores).length || !tipo || !sedeCfg || edad === null) return { errores };

  const opcional = (cond: boolean, v: string) => (cond ? limpiarEspacios(v) : undefined);
  return {
    errores,
    datos: {
      sede: sedeCfg.id, ciudad: d.ciudad, ciudadOtra: opcional(d.ciudad === CIUDAD_OTRA, d.ciudadOtra), direccion: limpiarEspacios(d.direccion),
      nombres: nombrePropio(d.nombres), apellidos: nombrePropio(d.apellidos), tipoDocumento: tipo.id,
      tipoDocumentoOtro: opcional(!!tipo.conTexto, d.tipoDocumentoOtro), documento: documentoNormalizado(tipo.regla, d.documento),
      fechaNacimiento: d.fechaNacimiento, edad, correo: correoN, whatsapp, telefonoAlterno: alterno, acudiente,
      grado: d.grado, anioEgreso, promedio, institucion: limpiarEspacios(d.institucion), internet: d.internet === "si",
      computadora: d.computadora, autonomia: d.autonomia, horas: d.horas,
      ocupacion: [...new Set(d.ocupacion)], ocupacionOtra: opcional(d.ocupacion.includes("otro"), d.ocupacionOtra),
      emprendimiento: d.emprendimiento, otrasPostulaciones: d.otrasPostulaciones, aplicoAntes: d.aplicoAntes === "si",
      seleccionadoAntes: d.aplicoAntes === "si" ? d.seleccionadoAntes === "si" : undefined,
      genero: d.genero, poblaciones: [...new Set(d.poblaciones)], poblacionOtra: opcional(d.poblaciones.includes("otra"), d.poblacionOtra),
      ingresos: d.ingresos, talla: d.talla, canal: d.canal, canalOtro: opcional(d.canal === "otro", d.canalOtro),
      embajador: opcional(d.canal === "embajador", d.embajador), aceptaDatos: true, autorizaAcudiente: menor ? true : undefined,
    },
  };
}

/** Errores solo de los campos de un paso (para validar al pulsar "Siguiente"). */
export function erroresDelPaso(errores: Errores, paso: Paso): Errores {
  return Object.fromEntries(Object.entries(errores).filter(([c]) => paso.campos.includes(c as IdCampo))) as Errores;
}

/** Primer paso (en orden) que tiene errores, o undefined. */
export function primerPasoConErrores(errores: Errores, pasos: Paso[]): Paso | undefined {
  return pasos.find((p) => Object.keys(erroresDelPaso(errores, p)).length > 0);
}

// ---------- 3. Esquema zod completo (servidor) ----------
export function esquemaInscripcion(pais: PaisSlug, hoy: string) {
  const cfg = CONFIG_PAISES[pais];
  return Entrada.transform((d, ctx) => {
    const r = revisar(cfg, d, hoy);
    if (!r.datos) {
      for (const [campo, mensaje] of Object.entries(r.errores)) ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
      if (!Object.keys(r.errores).length) ctx.addIssue({ code: "custom", path: [], message: "Datos incompletos" });
      return z.NEVER;
    }
    return r.datos;
  });
}

/** Revisión rápida desde un borrador del navegador (completa con valores vacíos lo que falte). */
export function revisarBorrador(pais: PaisSlug, borrador: Borrador, hoy: string): Revision {
  const forma = Entrada.safeParse(borrador);
  if (!forma.success) return { errores: {} };
  return revisar(CONFIG_PAISES[pais], forma.data, hoy);
}
