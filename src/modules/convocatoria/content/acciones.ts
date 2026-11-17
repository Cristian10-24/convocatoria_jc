// A dónde llevan los botones "Inscribirme" de una landing. En una landing de país, directo a su formulario; en la
// principal, bajan a la franja de países de la misma página (#paises). Siempre en la misma pestaña. CONVOCATORIA_CONFIG puede cambiar el destino de un país con `acciones.postular`
// (un enlace externo o una ruta interna), sin tocar código: el formato es el mismo de siempre.
import { SEGMENTO_URL, type PaisSlug } from "@/shared/config/paises";
import type { ConfigPais } from "@/shared/config/convocatoria";

export type Destino = { href: string; nuevaPestana: boolean };

/** Ruta del formulario: /inscripcion (elige país) o /inscripcion/<país>. */
export const rutaFormulario = (pais: PaisSlug | null) => (pais ? `/inscripcion/${SEGMENTO_URL[pais]}` : "/inscripcion");

/** Ancla de la franja de países en la landing principal. */
export const ANCLA_PAISES = "#paises";

/**
 * Destino del botón según su ubicación. Abre en la misma pestaña; el origen viaja en la dirección
 * (?origen=landing_pais&ubicacion=hero_slide_1), como pide el plan de medición, y los utm_* de la visita se agregan
 * al hacer clic (ConservarUtm). La landing principal no lleva al formulario: baja a elegir país.
 */
export function destinoInscripcion(pais: PaisSlug | null, ubicacion: string, entorno?: ConfigPais): Destino {
  if (!pais) return { href: ANCLA_PAISES, nuevaPestana: false };
  const accion = entorno?.acciones?.postular;
  if (accion?.tipo === "enlace") return { href: accion.url, nuevaPestana: accion.nuevaPestana ?? false };
  const base = accion?.tipo === "ruta" ? accion.ruta : rutaFormulario(pais);
  const consulta = new URLSearchParams({ origen: pais ? "landing_pais" : "landing_principal", ubicacion });
  return { href: `${base}${base.includes("?") ? "&" : "?"}${consulta}`, nuevaPestana: false };
}

/** Agrega los utm_* y el fbclid de la visita a una URL (absoluta o interna) sin pisar los que ya traiga. */
export function conUtm(url: string, busquedaActual: string): string {
  const interna = url.startsWith("/");
  const destino = new URL(url, "https://interno.invalid");
  new URLSearchParams(busquedaActual).forEach((v, k) => {
    if ((k.startsWith("utm_") || k === "fbclid") && !destino.searchParams.has(k)) destino.searchParams.set(k, v);
  });
  return interna ? `${destino.pathname}${destino.search}${destino.hash}` : destino.toString();
}
