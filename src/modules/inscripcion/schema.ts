// Validador de la inscripción: el MISMO código valida en el navegador (paso a paso) y en el servidor (todo junto).
// No conoce países: recibe la definición del país (paises/<pais>.ts) y la aplica. No importa ninguna definición,
// así que el servidor carga solo la del país que llega y un país con problemas no afecta a los demás.
// 1) `Entrada` (zod) fija la forma: textos acotados, listas acotadas, booleanos; descarta claves desconocidas.
// 2) `revisar()` aplica las reglas de cada campo visible (qué se pregunta a quién) y normaliza.
// 3) `esquemaInscripcion()` une las dos cosas en un esquema zod que devuelve los datos listos para guardar.
import { z } from "zod";
import { TELEFONOS } from "@/shared/config/paises";
import { correoValido, normalizarCorreo } from "@/shared/validation/correo";
import { cedulaPanama } from "@/shared/validation/documento";
import { edad as calcularEdad, fechaValida } from "@/shared/validation/fechas";
import { validarCelular } from "@/shared/validation/telefono";
import { limpiarEspacios, nombrePropio, partesNombreValidas, textoConSentido } from "@/shared/validation/textos";
import {
  AUTONOMIA, CONDICIONES_LABORALES, CONOCIMIENTO, ELEMENTOS, EMPRENDIMIENTO, ESTRATO, HORAS, INGLES, NUCLEO, OTRAS_POSTULACIONES, POBLACION_NINGUNA, PREFIERO_NO,
  RELACION_ACUDIENTE, SERVICIOS, SI_NO, VIVIENDA,
} from "./config/preguntas";
import { MENSAJES, plantilla, txt } from "./config/textos";
import type { ClaveConsentimiento, DefinicionPais, Opcion, PasoDef, ReglaDocumento, Sede } from "./config/tipos";

/** Valor de la sede (ubicación "libre") o de la ciudad (ubicación "lista") cuando no está en la lista. */
export const CIUDAD_OTRA = "__otra__";

// ---------- 1. Forma ----------
const texto = (max = 120) => z.string().max(max).optional().default("");
const lista = z.array(z.string().max(40)).max(16).optional().default([]);
const casilla = z.boolean().optional().default(false);

export const Entrada = z.object({
  sede: texto(40), sedeCercana: texto(40), ciudad: texto(80), ciudadOtra: texto(80), direccion: texto(160),
  nombres: texto(80), apellidos: texto(80), tipoDocumento: texto(20), tipoDocumentoOtro: texto(60), documento: texto(30),
  fechaNacimiento: texto(10), correo: texto(120), whatsapp: texto(30), telefonoAlterno: texto(30),
  acudienteNombres: texto(80), acudienteApellidos: texto(80), acudienteCorreo: texto(120), acudienteTelefono: texto(30),
  acudienteRelacion: texto(20), acudienteRelacionOtra: texto(60),
  grado: texto(20), anioEgreso: texto(4), promedio: texto(6), institucion: texto(120), internet: texto(4), computadora: texto(20),
  autonomia: texto(20), horas: texto(20),
  ocupacion: lista, ocupacionOtra: texto(80), emprendimiento: texto(20), laboral: texto(30), otrasPostulaciones: texto(20), aplicoAntes: texto(4), seleccionadoAntes: texto(4),
  genero: texto(20), poblaciones: lista, poblacionOtra: texto(80), ingresos: texto(20), talla: texto(4),
  vivienda: texto(20), estrato: texto(2), nucleo: texto(5), elementos: lista, servicios: lista,
  conocimiento: texto(20), lenguajes: texto(120), ingles: texto(20),
  canal: texto(20), canalOtro: texto(80), embajador: texto(120),
  // Formato anterior (una sola casilla) y formato nuevo (casillas separadas). Ninguna llega marcada por defecto.
  aceptaDatos: casilla, autorizaAcudiente: casilla, aceptaPrivacidad: casilla, autorizaDatos: casilla,
});
export type EntradaInscripcion = z.infer<typeof Entrada>;
export type IdCampoEntrada = keyof EntradaInscripcion;
/** Lo que el formulario guarda mientras se llena (todo opcional). */
export type Borrador = Partial<z.input<typeof Entrada>>;

/**
 * Formato del envío. 1 = formulario anterior: una casilla ("aceptaDatos"). 2 = formulario 2027: casillas separadas
 * ("aceptaPrivacidad" y "autorizaDatos"). La API acepta los dos mientras haya pestañas abiertas con el anterior.
 */
export type Formato = 1 | 2;
export function formatoDe(crudo: unknown): Formato {
  return typeof crudo === "object" && crudo !== null && ("aceptaPrivacidad" in crudo || "autorizaDatos" in crudo) ? 2 : 1;
}

// ---------- Datos normalizados (lo que se guarda) ----------
export type DatosInscripcion = {
  sede: string; ciudad: string; ciudadOtra?: string; direccion: string;
  /** true si vive en la ciudad sede; false si vive en otra ciudad y asistiría a esa sede. */
  viveEnSede?: boolean;
  nombres: string; apellidos: string; tipoDocumento: string; tipoDocumentoOtro?: string; documento: string;
  fechaNacimiento: string; edad: number; correo: string; whatsapp: string; telefonoAlterno: string;
  acudiente?: { nombres: string; apellidos: string; correo: string; telefono: string; relacion: string; relacionOtra?: string };
  grado: string; anioEgreso?: number; promedio?: number; institucion: string; internet: boolean; computadora: string; autonomia: string; horas: string;
  ocupacion: string[]; ocupacionOtra?: string; emprendimiento: string; laboral?: string; otrasPostulaciones: string; aplicoAntes?: boolean; seleccionadoAntes?: boolean;
  genero: string; poblaciones: string[]; poblacionOtra?: string; ingresos: string; talla?: string;
  vivienda?: string; estrato?: string; nucleo?: string; elementos?: string[]; servicios?: string[];
  conocimiento?: string; lenguajes?: string; ingles?: string;
  canal: string; canalOtro?: string; embajador?: string;
  aceptaDatos: true; autorizaAcudiente?: true;
};

// ---------- 2. Condiciones: qué se pregunta a quién ----------
export function edadDe(d: Pick<Borrador, "fechaNacimiento">, hoy: string): number | null {
  return d.fechaNacimiento && fechaValida(d.fechaNacimiento) && d.fechaNacimiento <= hoy ? calcularEdad(d.fechaNacimiento, hoy) : null;
}

export function esMenor(def: DefinicionPais, d: Borrador, hoy: string): boolean {
  const e = edadDe(d, hoy);
  return e !== null && e < def.config.edad.mayoriaDeEdad;
}

/** Sedes de verdad (las que no son parte de otra): a una de ellas se asiste a los encuentros. */
export const sedesReales = (def: DefinicionPais): Sede[] => def.config.sedes.filter((s) => !s.sede);

const CAMPOS_ACUDIENTE = ["acudienteNombres", "acudienteApellidos", "acudienteCorreo", "acudienteTelefono", "acudienteRelacion", "acudienteRelacionOtra"];

/** Casillas de consentimiento que aplican: las del formato del envío y, si es menor, la del adulto responsable. */
export function casillasConsentimiento(def: DefinicionPais, d: Borrador, hoy: string, formato: Formato): string[] {
  const propias = formato === 2 ? ["aceptaPrivacidad", "autorizaDatos"] : ["aceptaDatos"];
  return esMenor(def, d, hoy) ? [...propias, "autorizaAcudiente"] : propias;
}

/** Campos que se muestran (y se validan) con lo que se lleva respondido. */
export function camposVisibles(def: DefinicionPais, d: Borrador, hoy: string, formato: Formato = 2): Set<string> {
  const { config: cfg, reglas } = def;
  const ocultos = new Set<string>();
  if (reglas.ubicacion === "lista") {
    if (cfg.sedes.length <= 1) ocultos.add("sede");
    if (d.ciudad !== CIUDAD_OTRA) ocultos.add("ciudadOtra");
    ocultos.add("sedeCercana");
  } else {
    if (d.sede !== CIUDAD_OTRA) ocultos.add("ciudadOtra").add("sedeCercana");
    if (sedesReales(def).length <= 1) ocultos.add("sedeCercana");
  }
  if (!cfg.tiposDocumento.find((t) => t.id === d.tipoDocumento)?.conTexto) ocultos.add("tipoDocumentoOtro");
  if (d.acudienteRelacion !== "otro") ocultos.add("acudienteRelacionOtra");
  if (d.grado !== "egresado") ocultos.add("anioEgreso");
  if (!d.ocupacion?.includes("otro")) ocultos.add("ocupacionOtra");
  if (!d.ocupacion?.includes("trabajo")) ocultos.add("laboral");
  if (!reglas.seleccionadoSiempre && d.aplicoAntes !== "si") ocultos.add("seleccionadoAntes");
  if (!d.poblaciones?.includes("otra")) ocultos.add("poblacionOtra");
  if (d.canal !== "otro") ocultos.add("canalOtro");
  if (d.canal !== "embajador") ocultos.add("embajador");
  if (!esMenor(def, d, hoy)) for (const c of CAMPOS_ACUDIENTE) ocultos.add(c);
  const delFormulario = def.pasos.flatMap((p) => p.campos).filter((c) => !ocultos.has(c));
  return new Set([...delFormulario, ...casillasConsentimiento(def, d, hoy, formato)]);
}

/** Pasos que se muestran: el del adulto responsable solo a menores de edad. */
export function pasosVisibles(def: DefinicionPais, d: Borrador, hoy: string): PasoDef[] {
  return def.pasos.filter((p) => p.id !== "acudiente" || esMenor(def, d, hoy));
}

// ---------- Reglas ----------
/** Documento tal como se guarda: sin espacios y, si admite letras, en mayúsculas. */
export function documentoNormalizado(regla: ReglaDocumento, valor: string): string {
  const d = valor.trim();
  if (regla.formato === "cedula_pa") return d.toUpperCase().replace(/\s+/g, "");
  return regla.formato === "alfanumerico" ? d.toUpperCase() : d;
}

/** Lo que el campo deja escribir: descarta al vuelo los caracteres que el formato no admite. */
export function documentoAlEscribir(regla: ReglaDocumento | undefined, valor: string): string {
  if (regla?.formato === "cedula_pa") return valor.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
  if (regla?.formato === "alfanumerico") return valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  return valor.replace(/\D/g, "");
}

/** Forma y longitud del tipo de documento, sin repetir un único carácter (111111). */
function documentoValido(regla: ReglaDocumento, valor: string): boolean {
  const d = documentoNormalizado(regla, valor);
  if (regla.formato === "cedula_pa") return cedulaPanama(d);
  const forma = regla.formato === "alfanumerico" ? /^[0-9A-Z]+$/ : /^\d+$/;
  return forma.test(d) && d.length >= regla.min && d.length <= regla.max && !/^(.)\1+$/.test(d);
}

const opcionValida = (opciones: Opcion[], id: string) => opciones.some((o) => o.id === id);
/** Opciones que no se pueden combinar con otras ("Ninguna de las anteriores", "Prefiero no responder"). */
const EXCLUYENTES = [POBLACION_NINGUNA, PREFIERO_NO.id];

export type Errores = Record<string, string>;
export type Revision = {
  errores: Errores;
  datos?: DatosInscripcion;
  /** Consentimientos aceptados en este envío (claves), para guardarlos con versión y fecha. */
  consentimientos?: ClaveConsentimiento[];
};

/**
 * Revisa una inscripción con la definición del país. Solo revisa los campos visibles.
 * @param hoy      fecha de referencia "AAAA-MM-DD" (para la edad y el año de egreso)
 * @param formato  1 = formulario anterior (una casilla), 2 = formulario 2027 (casillas separadas)
 */
export function revisar(def: DefinicionPais, d: EntradaInscripcion, hoy: string, formato: Formato = 2): Revision {
  const { config: cfg, reglas, opciones: ops } = def;
  const tr = cfg.trato;
  const m = (k: keyof typeof MENSAJES, valores: Record<string, string | number> = {}) => plantilla(txt(MENSAJES[k], tr), valores);
  const visibles = camposVisibles(def, d, hoy, formato);
  const ve = (campo: string) => visibles.has(campo);
  const errores: Errores = {};
  const error = (campo: string, mensaje: string) => {
    if (ve(campo) && !errores[campo]) errores[campo] = mensaje;
  };
  const vacio = (v: string) => limpiarEspacios(v) === "";

  type CampoTexto = { [K in IdCampoEntrada]: EntradaInscripcion[K] extends string ? K : never }[IdCampoEntrada];
  type CampoLista = { [K in IdCampoEntrada]: EntradaInscripcion[K] extends string[] ? K : never }[IdCampoEntrada];

  /** Una opción de la lista. `obligatoria: false` deja pasar el vacío. Devuelve el valor si es válido y visible. */
  const unica = (campo: CampoTexto, opciones: Opcion[], obligatoria = true): string | undefined => {
    if (!ve(campo)) return undefined;
    const v = d[campo];
    if (vacio(v)) {
      if (obligatoria) error(campo, m("elegir"));
      return undefined;
    }
    if (!opcionValida(opciones, v)) {
      error(campo, m("elegir"));
      return undefined;
    }
    return v;
  };
  /** Varias opciones de la lista (al menos una). */
  const varias = (campo: CampoLista, opciones: Opcion[]): string[] | undefined => {
    if (!ve(campo)) return undefined;
    const v = d[campo];
    if (!v.length) error(campo, m("elegirAlMenosUna"));
    else if (!v.every((o) => opcionValida(opciones, o))) error(campo, m("elegir"));
    return [...new Set(v)];
  };
  const libre = (campo: CampoTexto, min = 2) => {
    const v = d[campo];
    if (vacio(v)) error(campo, m("cual"));
    else if (!textoConSentido(v, min)) error(campo, m("texto"));
  };
  const nombre = (campo: CampoTexto) => {
    const v = d[campo];
    if (vacio(v)) error(campo, m("obligatorio"));
    else if (!partesNombreValidas(v)) error(campo, m("nombre"));
  };
  const correo = (campo: CampoTexto) => {
    const v = normalizarCorreo(d[campo]);
    if (!v) error(campo, m("obligatorio"));
    else if (!correoValido(v)) error(campo, m("correo"));
    return v;
  };
  const celular = (campo: CampoTexto) => {
    const v = d[campo];
    const r = validarCelular(v, cfg.telefono);
    if (vacio(v)) error(campo, m("obligatorio"));
    else if (!r.ok) error(campo, m("celular", { ejemplo: TELEFONOS[cfg.telefono].ejemplo }));
    return r.ok ? r.e164 : "";
  };
  const opcional = (cond: boolean, v: string) => (cond ? limpiarEspacios(v) : undefined);

  // Ubicación
  let sede: string | undefined;
  let ciudad = "";
  let ciudadOtra: string | undefined;
  let viveEnSede = false;
  if (reglas.ubicacion === "lista") {
    const sedeCfg = cfg.sedes.find((s) => s.id === (cfg.sedes.length === 1 ? cfg.sedes[0]!.id : d.sede));
    if (!sedeCfg) error("sede", m("elegir"));
    if (vacio(d.ciudad)) error("ciudad", m("elegir"));
    else if (d.ciudad !== CIUDAD_OTRA && !sedeCfg?.ciudades.includes(d.ciudad)) error("ciudad", m("elegir"));
    if (d.ciudad === CIUDAD_OTRA) libre("ciudadOtra");
    sede = sedeCfg?.id;
    ciudad = d.ciudad;
    ciudadOtra = opcional(d.ciudad === CIUDAD_OTRA, d.ciudadOtra);
    viveEnSede = !!sedeCfg && d.ciudad === sedeCfg.ciudades[0];
  } else {
    const reales = sedesReales(def);
    if (d.sede === CIUDAD_OTRA) {
      libre("ciudadOtra");
      sede = reales.length === 1 ? reales[0]!.id : unica("sedeCercana", reales.map((s) => ({ id: s.id, etiqueta: s.nombre })));
    } else {
      const elegida = cfg.sedes.find((s) => s.id === d.sede);
      if (!elegida) error("sede", m("elegir"));
      sede = elegida ? (elegida.sede ?? elegida.id) : undefined;
      viveEnSede = !!elegida;
    }
    // La residencia se escribe aparte; quien eligió "Otra ciudad" ya la escribió en el primer paso.
    ciudad = limpiarEspacios(d.ciudad) || (d.sede === CIUDAD_OTRA ? limpiarEspacios(d.ciudadOtra) : "");
    if (!ciudad) error("ciudad", m("obligatorio"));
    else if (!textoConSentido(ciudad, 2)) error("ciudad", m("texto"));
  }
  if (vacio(d.direccion)) error("direccion", m("obligatorio"));
  else if (!textoConSentido(d.direccion, 5)) error("direccion", m("direccion"));

  // Datos personales
  nombre("nombres");
  nombre("apellidos");
  const tipo = cfg.tiposDocumento.find((t) => t.id === d.tipoDocumento);
  if (!tipo) error("tipoDocumento", m("elegir"));
  if (tipo?.conTexto) libre("tipoDocumentoOtro");
  if (vacio(d.documento)) error("documento", m("obligatorio"));
  else if (tipo && !documentoValido(tipo.regla, d.documento)) {
    error("documento", m(tipo.regla.formato === "numerico" ? "documento" : tipo.regla.formato === "cedula_pa" ? "documentoCedulaPa" : "documentoAlfanumerico"));
  }
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

  // Adulto responsable (solo menores)
  const menor = ve("acudienteNombres");
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

  // Estudios y disponibilidad
  unica("grado", cfg.grados);
  let anioEgreso: number | undefined;
  if (d.grado === "egresado") {
    const anioHoy = Number(hoy.slice(0, 4));
    const a = Number(d.anioEgreso);
    if (vacio(d.anioEgreso)) error("anioEgreso", m("obligatorio"));
    else if (!/^\d{4}$/.test(d.anioEgreso.trim()) || a < 1980 || a > anioHoy) error("anioEgreso", m("anio"));
    else anioEgreso = a;
  }
  let promedio: number | undefined;
  if (ve("promedio")) {
    const p = d.promedio.trim().replace(",", ".");
    if (!p) error("promedio", m("obligatorio"));
    else {
      const n = /^\d{1,2}(\.\d{1,2})?$/.test(p) ? Number(p) : NaN;
      if (!(n >= cfg.escalaNotas.min && n <= cfg.escalaNotas.max)) error("promedio", m("promedio", cfg.escalaNotas));
      else promedio = n;
    }
  }
  if (vacio(d.institucion)) error("institucion", m("obligatorio"));
  else if (!textoConSentido(d.institucion, 3)) error("institucion", m("texto"));
  unica("internet", SI_NO);
  unica("computadora", ops.computadora);
  unica("autonomia", AUTONOMIA);
  unica("horas", HORAS);

  // Perfil
  const ocupacion = varias("ocupacion", ops.ocupacion) ?? [];
  if (d.ocupacion.includes("otro")) libre("ocupacionOtra");
  unica("emprendimiento", EMPRENDIMIENTO);
  const laboral = unica("laboral", CONDICIONES_LABORALES, false);
  unica("otrasPostulaciones", OTRAS_POSTULACIONES);
  const aplicoAntes = unica("aplicoAntes", SI_NO);
  const seleccionadoAntes = unica("seleccionadoAntes", SI_NO);

  // Sociodemográficos
  unica("genero", ops.genero);
  const poblaciones = varias("poblaciones", ops.poblaciones) ?? [];
  if (reglas.poblacionUnica && poblaciones.length > 1) error("poblaciones", m("elegir"));
  else if (poblaciones.length > 1 && poblaciones.some((p) => EXCLUYENTES.includes(p))) error("poblaciones", m("elegir"));
  if (d.poblaciones.includes("otra")) libre("poblacionOtra");
  unica("ingresos", ops.ingresos);
  const talla = unica("talla", ops.tallas, reglas.tallaObligatoria);
  const vivienda = unica("vivienda", VIVIENDA);
  const estrato = unica("estrato", ESTRATO);
  const nucleo = unica("nucleo", NUCLEO);
  const elementos = varias("elementos", ELEMENTOS);
  const servicios = varias("servicios", SERVICIOS);

  // Información adicional
  const conocimiento = unica("conocimiento", CONOCIMIENTO);
  const lenguajes = ve("lenguajes") ? limpiarEspacios(d.lenguajes) || undefined : undefined;
  const ingles = unica("ingles", INGLES);
  unica("canal", ops.canales);
  if (d.canal === "otro") libre("canalOtro");
  if (d.canal === "embajador") libre("embajador");

  // Autorización. Cada casilla es independiente y ninguna llega marcada.
  if (formato === 2) {
    if (!d.aceptaPrivacidad) error("aceptaPrivacidad", m("aceptar"));
    if (!d.autorizaDatos) error("autorizaDatos", m("aceptar"));
  } else if (!d.aceptaDatos) error("aceptaDatos", m("aceptar"));
  if (menor && !d.autorizaAcudiente) error("autorizaAcudiente", m("acudienteAutoriza"));

  if (Object.keys(errores).length || !tipo || !sede || edad === null) return { errores };

  return {
    errores,
    consentimientos: [...(formato === 2 ? (["privacidad", "datos"] as const) : (["datos"] as const)), ...(menor ? (["acudiente"] as const) : [])],
    datos: {
      sede, ciudad, ciudadOtra, viveEnSede, direccion: limpiarEspacios(d.direccion),
      nombres: nombrePropio(d.nombres), apellidos: nombrePropio(d.apellidos), tipoDocumento: tipo.id,
      tipoDocumentoOtro: opcional(!!tipo.conTexto, d.tipoDocumentoOtro), documento: documentoNormalizado(tipo.regla, d.documento),
      fechaNacimiento: d.fechaNacimiento, edad, correo: correoN, whatsapp, telefonoAlterno: alterno, acudiente,
      grado: d.grado, anioEgreso, promedio, institucion: limpiarEspacios(d.institucion), internet: d.internet === "si",
      computadora: d.computadora, autonomia: d.autonomia, horas: d.horas,
      ocupacion, ocupacionOtra: opcional(d.ocupacion.includes("otro") && ve("ocupacionOtra"), d.ocupacionOtra),
      emprendimiento: d.emprendimiento, laboral, otrasPostulaciones: d.otrasPostulaciones,
      aplicoAntes: aplicoAntes === undefined ? undefined : aplicoAntes === "si",
      seleccionadoAntes: seleccionadoAntes === undefined ? undefined : seleccionadoAntes === "si",
      genero: d.genero, poblaciones, poblacionOtra: opcional(d.poblaciones.includes("otra"), d.poblacionOtra),
      ingresos: d.ingresos, talla, vivienda, estrato, nucleo, elementos, servicios, conocimiento, lenguajes, ingles,
      canal: d.canal, canalOtro: opcional(d.canal === "otro", d.canalOtro), embajador: opcional(d.canal === "embajador" && ve("embajador"), d.embajador),
      aceptaDatos: true, autorizaAcudiente: menor ? true : undefined,
    },
  };
}

/** Errores solo de los campos de un paso (para validar al pulsar "Siguiente"). */
export function erroresDelPaso(errores: Errores, paso: Pick<PasoDef, "campos">): Errores {
  return Object.fromEntries(Object.entries(errores).filter(([c]) => paso.campos.includes(c)));
}

/** Primer paso (en orden) que tiene errores, o undefined. */
export function primerPasoConErrores<P extends Pick<PasoDef, "campos">>(errores: Errores, pasos: P[]): P | undefined {
  return pasos.find((p) => Object.keys(erroresDelPaso(errores, p)).length > 0);
}

// ---------- 3. Esquema zod completo ----------
export function esquemaInscripcion(def: DefinicionPais, hoy: string, formato: Formato = 2) {
  return Entrada.transform((d, ctx) => {
    const r = revisar(def, d, hoy, formato);
    if (!r.datos) {
      for (const [campo, mensaje] of Object.entries(r.errores)) ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
      if (!Object.keys(r.errores).length) ctx.addIssue({ code: "custom", path: [], message: "Datos incompletos" });
      return z.NEVER;
    }
    return r.datos;
  });
}

/** Revisión desde un borrador del navegador (completa con valores vacíos lo que falte). */
export function revisarBorrador(def: DefinicionPais, borrador: Borrador, hoy: string, formato: Formato = 2): Revision {
  const forma = Entrada.safeParse(borrador);
  if (!forma.success) return { errores: {} };
  return revisar(def, forma.data, hoy, formato);
}
