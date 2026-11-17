// Convierte las cifras crudas del tablero (ids de la base) en series con etiquetas legibles. Función pura.
import { NOMBRE_PAIS, PAISES, type PaisSlug } from "@/shared/config/paises";
import type { IdCampo } from "../config/preguntas";
import type { Conteo, ConteoPais, Estadisticas } from "./consultas";
import { etiquetaOpcion, nombreSede, textoAlerta } from "./presentacion";

export type Barra = { etiqueta: string; n: number };
export type Dia = { dia: string; n: number; acumulado: number };

export type SeriesTablero = {
  porDia: Dia[];
  porPais: Barra[];
  porSede: Barra[];
  porCiudad: Barra[];
  porHora: { dia: number; hora: number; n: number }[];
  edad: Barra[];
  genero: Barra[];
  grado: Barra[];
  horas: Barra[];
  computadora: Barra[];
  internet: Barra[];
  ocupacion: Barra[];
  poblaciones: Barra[];
  ingresos: Barra[];
  talla: Barra[];
  canal: Barra[];
  utm: Barra[];
  embajadores: Barra[];
  alertas: Barra[];
};

/** Algunas opciones cambian de id según el país (ocupación, poblaciones...): se busca en el que la tenga. */
function etiquetaEnAlgunPais(campo: IdCampo, id: string): string {
  for (const p of PAISES) {
    const t = etiquetaOpcion(campo, id, p);
    if (t !== id) return t;
  }
  return id;
}

const opcion = (campo: IdCampo, datos: Conteo[]): Barra[] => datos.map((d) => ({ etiqueta: etiquetaEnAlgunPais(campo, d.id), n: d.n }));

/** Si se mira más de un país, la etiqueta lleva el país para no confundir sedes o grados con el mismo nombre. */
function conPais(datos: ConteoPais[], etiqueta: (d: ConteoPais) => string): Barra[] {
  const varios = new Set(datos.map((d) => d.pais)).size > 1;
  return datos.map((d) => ({ etiqueta: varios ? `${etiqueta(d)} · ${NOMBRE_PAIS[d.pais] ?? d.pais}` : etiqueta(d), n: d.n }));
}

/** Días seguidos (los días sin inscripciones cuentan 0) con el acumulado. */
export function serieDiaria(porDia: Conteo[]): Dia[] {
  if (!porDia.length) return [];
  const mapa = new Map(porDia.map((d) => [d.id, d.n]));
  const inicio = new Date(`${porDia[0]!.id}T00:00:00Z`);
  const fin = new Date(`${porDia[porDia.length - 1]!.id}T00:00:00Z`);
  const salida: Dia[] = [];
  let acumulado = 0;
  for (let t = inicio.getTime(); t <= fin.getTime() && salida.length < 400; t += 864e5) {
    const dia = new Date(t).toISOString().slice(0, 10);
    const n = mapa.get(dia) ?? 0;
    acumulado += n;
    salida.push({ dia, n, acumulado });
  }
  return salida;
}

export function seriesTablero(e: Estadisticas): SeriesTablero {
  return {
    porDia: serieDiaria(e.porDia),
    porPais: e.porPais.map((d) => ({ etiqueta: NOMBRE_PAIS[d.id as PaisSlug] ?? d.id, n: d.n })),
    porSede: conPais(e.porSede, (d) => (d.id ? nombreSede(d.pais, d.id) : "Sin sede (otra ciudad)")),
    porCiudad: e.porCiudad.map((d) => ({ etiqueta: `${d.id} (${nombreSede(d.pais, d.sede)})`, n: d.n })),
    porHora: e.porHora,
    edad: e.edad.map((d) => ({ etiqueta: d.id, n: d.n })),
    genero: opcion("genero", e.genero),
    grado: conPais(e.grado, (d) => etiquetaOpcion("grado", d.id, d.pais)),
    horas: opcion("horas", e.horas),
    computadora: opcion("computadora", e.computadora),
    internet: opcion("internet", e.internet),
    ocupacion: opcion("ocupacion", e.ocupacion),
    poblaciones: opcion("poblaciones", e.poblaciones),
    ingresos: opcion("ingresos", e.ingresos),
    talla: opcion("talla", e.talla),
    canal: opcion("canal", e.canal),
    utm: e.utm.map((d) => ({ etiqueta: d.id, n: d.n })),
    embajadores: e.embajadores.map((d) => ({ etiqueta: d.id, n: d.n })),
    alertas: e.alertas.map((d) => ({ etiqueta: textoAlerta(d.id), n: d.n })),
  };
}
