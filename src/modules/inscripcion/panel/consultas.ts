// Consultas del panel sobre insc_inscripciones. TODAS pasan por `filtroBase`, que aplica el alcance del usuario
// (países visibles) en el servidor, encima de lo que pida la URL: un coordinador de Uruguay que escriba ?pais=col
// recibe una lista vacía, no los datos de Colombia.
import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { entorno } from "@/shared/config/env";
import { esPais, type PaisSlug } from "@/shared/config/paises";
import { MAX_EXPORTACION, TAM_PAGINA, ZONA_VARIOS_PAISES, ZONAS } from "../config/panel";
import { DEFINICIONES } from "../config/paises";
import { ciudadSede, sedesReales } from "../schema";
import { coleccion, type Inscripcion } from "../repository";
import type { AlcancePanel, Filtros } from "./filtros";

/** Países que de verdad se consultan: los pedidos ∩ los permitidos. Vacío = no ve nada. */
export function paisesConsultados(alcance: AlcancePanel, f: Pick<Filtros, "pais">): PaisSlug[] {
  const permitidos = alcance.paises.filter(esPais);
  if (!f.pais) return [...permitidos];
  return permitidos.includes(f.pais) ? [f.pais] : [];
}

/** Zona horaria de la consulta: la del país si es uno solo; si no, la de Bogotá. */
export function zonaDe(paises: readonly PaisSlug[]) {
  return paises.length === 1 ? ZONAS[paises[0]!] : ZONA_VARIOS_PAISES;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Búsqueda por nombre sin importar tildes ni mayúsculas: "jose" encuentra "José".
const VARIANTES: Record<string, string> = { a: "aáàä", e: "eéèë", i: "iíìï", o: "oóòö", u: "uúùü", n: "nñ" };
function regexSinTildes(palabra: string): RegExp {
  const base = palabra.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const patron = [...base].map((c) => (VARIANTES[c] ? `[${VARIANTES[c]}]` : escapar(c))).join("");
  return new RegExp(patron, "i");
}

/** Filtro de la búsqueda libre: radicado, documento, correo o palabras del nombre. */
function filtroBusqueda(q: string): Filter<Inscripcion> {
  const texto = q.trim();
  if (/^JC\d{2}-/i.test(texto)) return { radicado: texto.toUpperCase() };
  if (texto.includes("@")) return { correo: new RegExp(`^${escapar(texto)}$`, "i") };
  if (/^[0-9A-Za-z-]{5,}$/.test(texto) && /\d/.test(texto)) {
    const doc = texto.replace(/-/g, "").toUpperCase();
    return { $or: [{ documento: doc }, { documento: texto.toUpperCase() }] };
  }
  const palabras = texto.split(/\s+/).filter(Boolean).slice(0, 5);
  return { $and: palabras.map((p) => ({ $or: [{ nombres: regexSinTildes(p) }, { apellidos: regexSinTildes(p) }] })) };
}

/**
 * Ciudades sede de todos los países. Las inscripciones anteriores al formulario 2027 no guardan `viveEnSede`: para
 * ellas se deduce de la ciudad.
 */
const CIUDADES_SEDE = [...new Set(Object.values(DEFINICIONES).flatMap((def) => sedesReales(def).map((s) => ciudadSede(def, s))))];
/** ¿Vive en una ciudad sede? Para documentos ya leídos (misma regla que VIVE_EN_SEDE). */
export const viveEnSede = (d: Pick<Inscripcion, "viveEnSede" | "ciudad">): boolean => (typeof d.viveEnSede === "boolean" ? d.viveEnSede : CIUDADES_SEDE.includes(d.ciudad));
const VIVE_EN_SEDE = { $cond: [{ $eq: [{ $type: "$viveEnSede" }, "bool"] }, "$viveEnSede", { $in: ["$ciudad", CIUDADES_SEDE] }] };

/** Filtro de Mongo con el alcance aplicado. Siempre fija convocatoria y país (`$in`, nunca "todos" implícito). */
export function filtroBase(alcance: AlcancePanel, f: Filtros): Filter<Inscripcion> {
  const paises = paisesConsultados(alcance, f);
  const zona = zonaDe(paises);
  const filtro: Filter<Inscripcion> = { convocatoria: entorno().CONVOCATORIA_ID, pais: { $in: paises } };
  if (f.sede) filtro.sede = f.sede;
  if (f.ciudad) filtro.ciudad = f.ciudad;
  if (f.desde || f.hasta) {
    filtro.creadoEn = {
      ...(f.desde ? { $gte: new Date(`${f.desde}T00:00:00${zona.desfase}`) } : {}),
      ...(f.hasta ? { $lte: new Date(`${f.hasta}T23:59:59.999${zona.desfase}`) } : {}),
    };
  }
  if (f.menor === "si") filtro.acudiente = { $exists: true };
  if (f.menor === "no") filtro.acudiente = { $exists: false };
  if (f.vive) {
    const enSede = { $or: [{ viveEnSede: true }, { viveEnSede: { $exists: false }, ciudad: { $in: CIUDADES_SEDE } }] };
    const otra = { $or: [{ viveEnSede: false }, { viveEnSede: { $exists: false }, ciudad: { $nin: CIUDADES_SEDE } }] };
    filtro.$and = [...((filtro.$and as object[]) ?? []), f.vive === "sede" ? enSede : otra] as Filter<Inscripcion>[];
  }
  if (f.alerta === "con") filtro["alertas.0"] = { $exists: true };
  else if (f.alerta === "sin") filtro["alertas.0"] = { $exists: false };
  else if (f.alerta) filtro["alertas.codigo"] = f.alerta;
  if (f.q?.trim()) filtro.$and = [...((filtro.$and as object[]) ?? []), filtroBusqueda(f.q)] as Filter<Inscripcion>[];
  return filtro;
}

// ---------- Lista ----------

export type FilaInscrito = {
  id: string;
  radicado: string;
  creadoEn: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  pais: PaisSlug;
  sede: string;
  ciudad: string;
  ciudadOtra?: string;
  edad: number;
  menor: boolean;
  enSede: boolean;
  alertas: string[];
};

const ORDEN = {
  recientes: { creadoEn: -1, _id: -1 },
  antiguos: { creadoEn: 1, _id: 1 },
  apellido: { apellidos: 1, nombres: 1, _id: 1 },
} as const;

export async function listarInscritos(
  alcance: AlcancePanel,
  f: Filtros,
  tam = TAM_PAGINA,
): Promise<{ filas: FilaInscrito[]; total: number; pagina: number; paginas: number }> {
  const col = await coleccion();
  const filtro = filtroBase(alcance, f);
  const total = await col.countDocuments(filtro);
  const paginas = Math.max(1, Math.ceil(total / tam));
  const pagina = Math.min(f.pagina, paginas);
  const docs = await col
    .find(filtro, {
      projection: { radicado: 1, creadoEn: 1, nombres: 1, apellidos: 1, tipoDocumento: 1, documento: 1, pais: 1, sede: 1, ciudad: 1, ciudadOtra: 1, viveEnSede: 1, edad: 1, acudiente: 1, alertas: 1 },
    })
    .sort(ORDEN[f.orden])
    .skip((pagina - 1) * tam)
    .limit(tam)
    .toArray();
  const filas = docs.map((d) => ({
    id: d._id.toHexString(),
    radicado: d.radicado,
    creadoEn: d.creadoEn.toISOString(),
    nombres: d.nombres,
    apellidos: d.apellidos,
    tipoDocumento: d.tipoDocumento,
    documento: d.documento,
    pais: d.pais,
    sede: d.sede,
    ciudad: d.ciudad,
    ...(d.ciudadOtra ? { ciudadOtra: d.ciudadOtra } : {}),
    edad: d.edad,
    menor: !!d.acudiente,
    enSede: viveEnSede(d),
    alertas: (d.alertas ?? []).map((a) => a.codigo),
  }));
  return { filas, total, pagina, paginas };
}

/** Una inscripción, solo si está dentro del alcance. Fuera de él responde null (igual que si no existiera). */
export async function buscarInscripcion(alcance: AlcancePanel, id: string): Promise<Inscripcion | null> {
  if (!ObjectId.isValid(id) || id.length !== 24) return null;
  const paises = alcance.paises.filter(esPais);
  return (await coleccion()).findOne(
    { _id: new ObjectId(id), convocatoria: entorno().CONVOCATORIA_ID, pais: { $in: paises } },
    { projection: { ipHash: 0, userAgent: 0, idempotencia: 0 } },
  );
}

/** Documentos para exportar (con tope). Ordenados del más antiguo al más reciente. */
export async function inscripcionesParaExportar(alcance: AlcancePanel, f: Filtros): Promise<Inscripcion[]> {
  return (await coleccion())
    .find(filtroBase(alcance, f), { projection: { ipHash: 0, userAgent: 0, idempotencia: 0 } })
    .sort({ creadoEn: 1, _id: 1 })
    .limit(MAX_EXPORTACION)
    .toArray();
}

// ---------- Estadísticas del tablero ----------

export type Conteo = { id: string; n: number };
export type ConteoPais = { pais: PaisSlug; id: string; n: number };

export type Estadisticas = {
  total: number;
  hoy: number;
  semana: number;
  /** Los 7 días anteriores a `semana`, para comparar. */
  semanaAnterior: number;
  menores: number;
  conAlertas: number;
  porDia: Conteo[];
  porPais: Conteo[];
  porSede: ConteoPais[];
  porCiudad: (ConteoPais & { sede: string })[];
  /** Por país: cuántos viven en una ciudad sede y cuántos en otra ciudad. */
  sedeVsOtra: { pais: PaisSlug; sede: number; otra: number }[];
  porHora: { dia: number; hora: number; n: number }[];
  edad: Conteo[];
  genero: Conteo[];
  grado: ConteoPais[];
  horas: Conteo[];
  computadora: Conteo[];
  internet: Conteo[];
  ocupacion: Conteo[];
  poblaciones: Conteo[];
  ingresos: Conteo[];
  talla: Conteo[];
  canal: Conteo[];
  utm: Conteo[];
  embajadores: Conteo[];
  alertas: Conteo[];
  zona: string;
};

const contar = (campo: unknown, extra: object[] = []) => [
  ...extra,
  { $group: { _id: campo, n: { $sum: 1 } } },
  { $sort: { n: -1, _id: 1 } },
];

/** Todas las cifras del tablero en una sola agregación ($facet) sobre los documentos filtrados. */
export async function estadisticas(alcance: AlcancePanel, f: Filtros, ahora = new Date()): Promise<Estadisticas> {
  const paises = paisesConsultados(alcance, f);
  const zona = zonaDe(paises);
  const hoyLocal = new Intl.DateTimeFormat("en-CA", { timeZone: zona.iana, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  const inicioHoy = new Date(`${hoyLocal}T00:00:00${zona.desfase}`);
  const hace7 = new Date(inicioHoy.getTime() - 6 * 864e5);
  const hace14 = new Date(inicioHoy.getTime() - 13 * 864e5);
  const tz = zona.iana;

  const [r] = await (await coleccion())
    .aggregate<Record<string, { _id: unknown; n: number }[]>>([
      { $match: filtroBase(alcance, f) },
      {
        $facet: {
          total: [{ $count: "n" }],
          hoy: [{ $match: { creadoEn: { $gte: inicioHoy } } }, { $count: "n" }],
          semana: [{ $match: { creadoEn: { $gte: hace7 } } }, { $count: "n" }],
          semanaAnterior: [{ $match: { creadoEn: { $gte: hace14, $lt: hace7 } } }, { $count: "n" }],
          sedeVsOtra: [{ $group: { _id: { pais: "$pais", enSede: VIVE_EN_SEDE }, n: { $sum: 1 } } }],
          menores: [{ $match: { acudiente: { $exists: true } } }, { $count: "n" }],
          conAlertas: [{ $match: { "alertas.0": { $exists: true } } }, { $count: "n" }],
          porDia: [{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$creadoEn", timezone: tz } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }],
          porPais: contar("$pais"),
          porSede: contar({ pais: "$pais", id: "$sede" }),
          porCiudad: [...contar({ pais: "$pais", sede: "$sede", id: { $cond: [{ $eq: ["$ciudad", "__otra__"] }, { $concat: [{ $ifNull: ["$ciudadOtra", "Otra"] }, " (otra)"] }, "$ciudad"] } }), { $limit: 10 }],
          porHora: [{ $group: { _id: { dia: { $isoDayOfWeek: { date: "$creadoEn", timezone: tz } }, hora: { $hour: { date: "$creadoEn", timezone: tz } } }, n: { $sum: 1 } } }],
          edad: [...contar("$edad"), { $sort: { _id: 1 } }],
          genero: contar("$genero"),
          grado: contar({ pais: "$pais", id: "$grado" }),
          horas: contar("$horas"),
          computadora: contar("$computadora"),
          internet: contar("$internet"),
          ocupacion: contar("$ocupacion", [{ $unwind: "$ocupacion" }]),
          poblaciones: contar("$poblaciones", [{ $unwind: "$poblaciones" }]),
          ingresos: contar("$ingresos"),
          talla: contar("$talla"),
          canal: contar("$canal"),
          utm: contar({ $ifNull: ["$origen.utm_source", "(directo)"] }),
          // Embajadores: el texto libre se agrupa en minúsculas y sin espacios de sobra.
          embajadores: [
            ...contar({ $trim: { input: { $toLower: "$embajador" } } }, [{ $match: { canal: "embajador", embajador: { $type: "string", $ne: "" } } }]),
            { $limit: 15 },
          ],
          alertas: contar("$alertas.codigo", [{ $unwind: "$alertas" }]),
        },
      },
    ])
    .toArray();

  const cifra = (k: string) => r?.[k]?.[0]?.n ?? 0;
  const simple = (k: string): Conteo[] => (r?.[k] ?? []).map((x) => ({ id: String(x._id), n: x.n }));
  const porPais = (k: string): ConteoPais[] =>
    (r?.[k] ?? []).map((x) => {
      const id = x._id as { pais: PaisSlug; id: unknown };
      return { pais: id.pais, id: String(id.id), n: x.n };
    });

  return {
    total: cifra("total"),
    hoy: cifra("hoy"),
    semana: cifra("semana"),
    semanaAnterior: cifra("semanaAnterior"),
    menores: cifra("menores"),
    conAlertas: cifra("conAlertas"),
    porDia: simple("porDia"),
    porPais: simple("porPais"),
    porSede: porPais("porSede"),
    porCiudad: (r?.porCiudad ?? []).map((x) => {
      const id = x._id as { pais: PaisSlug; sede: string; id: string };
      return { pais: id.pais, sede: id.sede, id: id.id, n: x.n };
    }),
    sedeVsOtra: Object.values(
      (r?.sedeVsOtra ?? []).reduce<Record<string, { pais: PaisSlug; sede: number; otra: number }>>((acc, x) => {
        const id = x._id as { pais: PaisSlug; enSede: boolean };
        const fila = (acc[id.pais] ??= { pais: id.pais, sede: 0, otra: 0 });
        if (id.enSede) fila.sede += x.n;
        else fila.otra += x.n;
        return acc;
      }, {}),
    ).sort((a, b) => b.sede + b.otra - (a.sede + a.otra)),
    porHora: (r?.porHora ?? []).map((x) => ({ ...(x._id as { dia: number; hora: number }), n: x.n })),
    edad: simple("edad"),
    genero: simple("genero"),
    grado: porPais("grado"),
    horas: simple("horas"),
    computadora: simple("computadora"),
    internet: simple("internet"),
    ocupacion: simple("ocupacion"),
    poblaciones: simple("poblaciones"),
    ingresos: simple("ingresos"),
    talla: simple("talla"),
    canal: simple("canal"),
    utm: simple("utm"),
    embajadores: simple("embajadores"),
    alertas: simple("alertas"),
    zona: tz,
  };
}
