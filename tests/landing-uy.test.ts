// Landing de Uruguay renderizada a HTML (como la entrega el servidor): voseo en TODO el texto visible, la reforma
// del 12-nov presente y los botones "Postulate" conectados al formulario propio según CONVOCATORIA_CONFIG.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import ConvocatoriaPagina from "@/modules/convocatoria/components/ConvocatoriaPagina";
import { CIERRE_PRIMERA_ETAPA, PAISES, fechasClave, preguntas } from "@/modules/convocatoria/content/contenido";
import type { PaisSlug } from "@/shared/config/paises";

const env = process.env as Record<string, string | undefined>;
const original = env.CONVOCATORIA_CONFIG;
afterEach(() => {
  if (original === undefined) delete env.CONVOCATORIA_CONFIG;
  else env.CONVOCATORIA_CONFIG = original;
});

/** Palabra completa, también con tildes (\b de JavaScript no reconoce "á" como letra). */
const palabra = (p: string, flags = "u") => new RegExp(`(?<!\\p{L})${p}(?!\\p{L})`, flags);

/** HTML de la landing y su texto visible (sin etiquetas ni atributos). */
function landing(pais: PaisSlug, config?: object) {
  if (config) env.CONVOCATORIA_CONFIG = JSON.stringify(config);
  else delete env.CONVOCATORIA_CONFIG;
  const html = renderToStaticMarkup(createElement(ConvocatoriaPagina, { pais }));
  const texto = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
  return { html, texto };
}

describe("landing /uy", () => {
  it("todo el texto va en voseo: falla si aparece una forma de tuteo", () => {
    const { texto: visible } = landing("uy", { uy: { estado: "abierta", cierra: "2026-12-18" } });
    // Las respuestas cerradas de la FAQ no van en el HTML inicial: se suman desde el contenido de la página.
    // "Toca una Vida" es el nombre de la Fundación, no un verbo.
    const texto = `${visible} ${preguntas(PAISES.uy).map((f) => `${f.q} ${f.a}`).join(" ")}`.replaceAll("Toca una Vida", "");
    // "necesitas" (tuteo) en vez de "Necesitás": la prueba que pidió coordinación.
    expect(texto).toContain("Necesitás");
    expect(texto).not.toMatch(palabra("necesitas", "iu"));
    for (const tuteo of ["Postúlate", "Conviértete", "puedes", "vives", "cumples", "quieres", "Elige", "Toca", "toca", "aprendes", "Escríbenos", "tienes", "Pasa"]) {
      expect(texto, `tuteo: ${tuteo}`).not.toMatch(palabra(tuteo));
    }
    for (const voseo of ["Convertite", "Postulate", "Elegí lo que más te llame", "Tocá para ver qué aprendés", "Pasá el mouse o tocá", "tenés monitores", "Escribinos"]) {
      expect(texto, voseo).toContain(voseo);
    }
    // "Convertite" sin tilde (la página anterior escribía "Convertíte").
    expect(texto).not.toContain("Convertíte");
  });

  it("trae la reforma: fechas clave, intereses, tarjetas que se voltean, 80/20, monitores y sin 'Ver la ruta'", () => {
    const { html, texto } = landing("uy", { uy: { estado: "abierta", cierra: "2026-12-18" } });
    expect(texto).toContain("1.ª etapa de inscripciones");
    expect(texto).toContain("Hasta el 18 de diciembre de 2026");
    expect(texto).toContain("Hablar en público sin nervios");
    expect(texto).toContain("Confianza para liderar y comunicar");
    expect(html).toContain('aria-label="80 % virtual y 20 % presencial"');
    expect(texto).toContain("Apoyo y acompañamiento");
    expect(texto).not.toContain("salud mental");
    expect(texto).toContain("Monitores que te acompañan en cada etapa");
    expect(html).toContain("/convocatoria/uy/monitor-1.webp");
    expect(html).toContain("/convocatoria/uy/hero-2.webp");
    expect(texto).not.toContain("Ver la ruta");
    expect(texto).not.toContain("Encuentros presenciales en");
  });

  it("la fecha de la 1.ª etapa sale de CONVOCATORIA_CONFIG.cierra (con respaldo)", () => {
    expect(CIERRE_PRIMERA_ETAPA).toBe("2026-12-18");
    expect(fechasClave()[0]!.fecha).toBe("Hasta el 18 de diciembre de 2026");
    const { texto } = landing("uy", { uy: { estado: "abierta", cierra: "2027-01-31" } });
    expect(texto).toContain("Hasta el 31 de enero de 2027");
    expect(texto).not.toContain("18 de diciembre de 2026");
  });

  it("abierta: todos los 'Postulate' llevan al formulario propio /inscripcion/uy", () => {
    const { html } = landing("uy", { uy: { estado: "abierta", cierra: "2099-12-31" } });
    for (const boton of ["postular-hero", "postular-requisitos", "postular-cierre", "postular-barra"]) {
      expect(html, boton).toMatch(new RegExp(`<a [^>]*data-convocatoria-boton="${boton}"[^>]*href="/inscripcion/uy"|<a [^>]*href="/inscripcion/uy"[^>]*data-convocatoria-boton="${boton}"`));
    }
    expect(html).not.toContain("data-pendiente");
  });

  it("muy pronto: botones apagados en naranja; cerrada: grises", () => {
    const pronto = landing("uy", { uy: { estado: "proxima" } }).html;
    expect(pronto).toContain("Inscripciones muy pronto");
    expect(pronto).not.toContain('href="/inscripcion/uy"');
    expect(pronto).not.toMatch(/botonCerrado/);

    const cerrada = landing("uy", { uy: { estado: "cerrada" } }).html;
    expect(cerrada).toContain("Inscripciones cerradas");
    expect(cerrada).not.toContain('href="/inscripcion/uy"');
    expect(cerrada).toMatch(/botonCerrado/);
  });

  it("los demás países quedan en tuteo y sin la sección de monitores", () => {
    for (const pais of ["col", "pan", "ecu"] as const) {
      const { texto } = landing(pais);
      expect(texto).toContain("Toca para ver qué aprendes");
      expect(texto).not.toContain("Monitores que te acompañan");
      expect(PAISES[pais].fotos.monitores).toEqual([]);
    }
  });
});
