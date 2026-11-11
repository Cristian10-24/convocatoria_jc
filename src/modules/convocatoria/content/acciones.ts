// Botones de la convocatoria: QUÉ hace cada botón vive aquí, no en los componentes.
// Se cambia sin tocar código con la variable CONVOCATORIA_CONFIG (esquema en src/shared/config/convocatoria.ts).
// Orden de prioridad: CONVOCATORIA_CONFIG (env) → configuración del país (contenido.ts) → valores por defecto de abajo.
// Además, mientras el país no esté "abierta", los botones de postular quedan apagados.
import { PAISES, type PaisSlug } from "@/shared/config/paises";
import type { Accion, ConfigPais, EstadoConvocatoria, IdBoton } from "@/shared/config/convocatoria";

export { Accion, BOTONES, ConfigEntorno, ConfigPais, EstadoConvocatoria, leerConfigEntorno } from "@/shared/config/convocatoria";
export type { IdBoton } from "@/shared/config/convocatoria";
export const PAISES_SLUG = PAISES;
export type { PaisSlug };

/** Lo que hace cada botón si nadie dice otra cosa. */
export const ACCIONES_POR_DEFECTO: Record<IdBoton, Accion> = {
  postular: { tipo: "pendiente", texto: "Inscripciones muy pronto" },
  "postular-hero": { tipo: "pendiente" },
  "postular-requisitos": { tipo: "pendiente" },
  "postular-cierre": { tipo: "pendiente" },
  "postular-barra": { tipo: "pendiente" },
  "ver-ruta": { tipo: "ancla", id: "ruta" },
  contacto: { tipo: "enlace", url: "https://tocaunavida.org/contactanos/", nuevaPestana: true },
};
const HEREDAN_DE_POSTULAR = new Set<IdBoton>(["postular-hero", "postular-requisitos", "postular-cierre", "postular-barra"]);
const ES_POSTULAR = new Set<IdBoton>(["postular", ...HEREDAN_DE_POSTULAR]);

/** Texto del botón de postular apagado, según el estado. */
export const TEXTO_POSTULAR_APAGADO: Record<Exclude<EstadoConvocatoria, "abierta">, string> = {
  proxima: "Inscripciones muy pronto",
  cerrada: "Inscripciones cerradas",
};

/** Acción final de un botón: entorno → país → por defecto (con la herencia de "postular"). */
export function resolverAccion(id: IdBoton, delPais: ConfigPais | undefined, delEntorno: ConfigPais | undefined): Accion {
  const buscar = (k: IdBoton) => delEntorno?.acciones?.[k] ?? delPais?.acciones?.[k];
  const propia = buscar(id);
  if (propia) return propia;
  if (HEREDAN_DE_POSTULAR.has(id)) return buscar("postular") ?? ACCIONES_POR_DEFECTO.postular;
  return ACCIONES_POR_DEFECTO[id];
}

/** Con la convocatoria sin abrir (o ya cerrada), los botones de postular no llevan a ninguna parte. */
export function segunEstado(id: IdBoton, accion: Accion, estado: EstadoConvocatoria): Accion {
  if (estado === "abierta" || !ES_POSTULAR.has(id)) return accion;
  return { tipo: "pendiente", texto: TEXTO_POSTULAR_APAGADO[estado] };
}

/** Agrega los utm_* de la visita a una URL (absoluta o interna) sin pisar los que ya traiga. */
export function conUtm(url: string, busquedaActual: string): string {
  const interna = url.startsWith("/");
  const destino = new URL(url, "https://interno.invalid");
  new URLSearchParams(busquedaActual).forEach((v, k) => {
    if (k.startsWith("utm_") && !destino.searchParams.has(k)) destino.searchParams.set(k, v);
  });
  return interna ? `${destino.pathname}${destino.search}${destino.hash}` : destino.toString();
}
