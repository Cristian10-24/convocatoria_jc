// Landing 2027 renderizada a HTML (como la entrega el servidor): voseo en Uruguay, estados por país desde
// CONVOCATORIA_CONFIG (abierta, muy pronto, cerrada, mantenimiento), botones con sus atributos de medición y
// el correo de contacto único.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import Landing from "@/modules/convocatoria/components/Landing";
import type { PaisSlug } from "@/shared/config/paises";

const env = process.env as Record<string, string | undefined>;
const original = env.CONVOCATORIA_CONFIG;
afterEach(() => {
  if (original === undefined) delete env.CONVOCATORIA_CONFIG;
  else env.CONVOCATORIA_CONFIG = original;
});

/** Palabra completa, también con tildes (el límite de palabra de JavaScript no reconoce "á" como letra). */
const palabra = (p: string) => new RegExp(`(?<!\\p{L})${p}(?!\\p{L})`, "u");

function landing(pais: PaisSlug | null, config?: object) {
  if (config) env.CONVOCATORIA_CONFIG = JSON.stringify(config);
  else delete env.CONVOCATORIA_CONFIG;
  const html = renderToStaticMarkup(createElement(Landing, { pais }));
  const texto = html.replace(/<style[^>]*>.*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
  return { html, texto };
}
const PRODUCCION = { uy: { estado: "abierta", cierra: "2026-12-18" } };

describe("landing principal", () => {
  it("la marca se escribe siempre «Jóvenes creaTIvos» (también en singular: «Joven creaTIvo/a»)", () => {
    for (const pais of [null, "col", "ecu", "pan", "uy"] as const) {
      const { html } = landing(pais, PRODUCCION);
      const formas = [...html.replace(/jovenescreativos@/g, "").matchAll(/j[oó]ven(es)?\s+crea\s*t[ií]v[oa]s?/gi)].map((m) => m[0]);
      expect(formas.length, pais ?? "principal").toBeGreaterThan(0);
      for (const f of formas) expect(f, pais ?? "principal").toMatch(/^(Jóvenes creaTIvos|Joven creaTIv[oa])$/);
    }
  });

  it("trae las secciones del diseño y lleva al paso 0 del formulario", () => {
    const { html, texto } = landing(null, PRODUCCION);
    const secciones = [
      "Formando talento en las TIC", "Inscríbete desde tu país", "Impacto regional", "Rutas de aprendizaje", "8 meses que combinan lo virtual y lo presencial",
      "Beneficios de ser Joven creaTIvo", "¿Qué necesitas para aplicar?", "Así se vive el programa", "Acerca del programa", "Testimonios", "Preguntas frecuentes",
    ];
    for (const t of secciones) expect(texto, t).toContain(t);
    // "Inscribirme" en la principal baja a la franja de países (misma página); ahí cada país abierto va a su formulario.
    expect(html).toContain('href="#paises"');
    expect(html).not.toContain('target="_blank" rel="noopener" data-track="cta_inscribirme"');
    for (const ruta of ["/colombia", "/ecuador", "/panama"]) expect(html).toContain(`href="${ruta}"`);
    expect(html).toContain('href="/inscripcion/uruguay?origen=landing_principal&amp;ubicacion=franja_paises"');
    expect(html).toContain('data-ubicacion="franja_paises"');
    expect(html).toContain('data-pais="sin_definir"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("fechas clave: «Preinscripciones en Uruguay», hasta el 18 de diciembre de 2026, sin [CONFIRMAR]", () => {
    const { texto } = landing(null, PRODUCCION);
    expect(texto).toContain("Preinscripciones en Uruguay Hasta el 18 de diciembre de 2026");
    expect(texto).not.toContain("[CONFIRMAR]");
    expect(texto).not.toMatch(/primera etapa de inscripciones/i);
  });

  it("requisitos: 4, sin edad, y en ninguna landing aparece «salud mental»", () => {
    const { texto } = landing(null, PRODUCCION);
    expect(texto).toContain("0 de 4 requisitos");
    expect(texto).not.toContain("RANGO 2027");
    for (const p of [null, "uy", "col", "ecu", "pan"] as const) expect(landing(p, PRODUCCION).texto).not.toMatch(/salud mental/i);
    expect(landing("uy", PRODUCCION).texto).toContain("Apoyo y acompañamiento.");
  });

  it("no depende del estado de ningún país: se ve igual con una configuración rota", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    env.CONVOCATORIA_CONFIG = "{roto";
    const html = renderToStaticMarkup(createElement(Landing, { pais: null }));
    expect(html).toContain("Inscribirme");
    err.mockRestore();
  });
});

describe("landing de Uruguay", () => {
  it("todo el texto va en voseo: falla si aparece una forma de tuteo", () => {
    const { texto } = landing("uy", PRODUCCION);
    for (const t of ["Aprendé a programar", "¿Qué necesitás", "Marcá lo que ya cumplís", "Fortalecé tus competencias", "Tenés apoyo cercano", "Pasá las fotos", "elegí una miniatura"]) expect(texto, t).toContain(t);
    for (const tuteo of ["Aprende", "necesitas", "Marca", "cumples", "Fortalece", "Tienes", "Pasa", "elige", "Avísame", "puedes", "Conviértete", "Inscríbete"]) {
      expect(texto, tuteo).not.toMatch(palabra(tuteo));
    }
  });

  it("abierta: los botones llevan al formulario propio en la misma pestaña, con país y ubicación, y sale el cierre", () => {
    const { html, texto } = landing("uy", PRODUCCION);
    const ubicaciones = ["nav", "hero_slide_1", "rutas", "requisitos", "sticky_movil", "footer"];
    for (const u of ubicaciones) expect(html, u).toContain(`href="/inscripcion/uruguay?origen=landing_pais&amp;ubicacion=${u}"`);
    expect(html.match(/data-track="cta_inscribirme"/g)?.length).toBe(ubicaciones.length);
    expect(html).toContain('data-pais="uy"');
    expect(html).not.toMatch(/target="_blank"[^>]*data-track="cta_inscribirme"/);
    expect(texto).toContain("Las preinscripciones en Uruguay cierran el 18 de diciembre de 2026");
    expect(html).toContain('aria-label="Tiempo para el cierre de las preinscripciones"');
    expect(texto).not.toContain("[CONFIRMAR FECHAS POR PAÍS]"); // la fecha viene confirmada en la configuración
    expect(texto).toContain("Qué no incluye");
    expect(texto).not.toContain("Beneficios de ser Joven creaTIvo"); // solo en la principal
  });

  it("muy pronto: sin enlaces al formulario, con el aviso de apertura", () => {
    const { html, texto } = landing("uy", {});
    expect(html).not.toContain("/inscripcion/uruguay");
    expect(texto).toContain("Muy pronto abrimos las preinscripciones en Uruguay.");
    expect(texto).toContain("Avisame cuando abran");
    expect(html).toContain('id="aviso"');
    expect(html).toContain('href="#aviso"');
    expect(texto).not.toContain("cierran el");
  });

  it("cerrada: sin enlaces al formulario y con la invitación a las redes", () => {
    const { html, texto } = landing("uy", { uy: { estado: "cerrada" } });
    expect(html).not.toContain("/inscripcion/uruguay");
    expect(texto).toContain("Las preinscripciones en Uruguay ya cerraron.");
    expect(texto).toContain("Entérate en redes de la próxima etapa");
    expect(html).toContain('data-track="cta_redes"');
  });

  it("la fecha de cierre pasada cierra la landing aunque la configuración diga abierta", () => {
    const { html } = landing("uy", { uy: { estado: "abierta", cierra: "2020-01-01" } });
    expect(html).not.toContain("/inscripcion/uruguay");
  });
});

describe("etapa y fechas por país", () => {
  it("la principal solo nombra como abierto lo que está abierto (con el valor de producción, Uruguay)", () => {
    const { texto } = landing(null, PRODUCCION);
    expect(texto).toContain("Preinscripciones abiertas en Uruguay.");
    expect(texto).not.toContain("Inscripciones 2027 abiertas");
    for (const p of ["Colombia", "Ecuador", "Panamá"]) expect(texto).not.toMatch(new RegExp(`(abiertas|Hasta el)[^.]*${p}`));
  });

  it("Colombia, Ecuador y Panamá (muy pronto): sin fecha ni [CONFIRMAR]; «Muy pronto» y el aviso, con «inscripciones»", () => {
    for (const p of ["col", "ecu", "pan"] as const) {
      const { html, texto } = landing(p, PRODUCCION);
      expect(texto, p).not.toMatch(/18 de diciembre|\[CONFIRMAR|preinscripciones|cierran el/i);
      expect(texto, p).toContain("Inscripciones Muy pronto");
      expect(html, p).toContain('data-ubicacion="fechas_clave"');
      expect(texto, p).toMatch(/Muy pronto abrimos las inscripciones en/);
    }
  });

  it("Uruguay: «Preinscripciones · Hasta el 18 de diciembre de 2026» en las fechas clave", () => {
    expect(landing("uy", PRODUCCION).texto).toContain("Preinscripciones Hasta el 18 de diciembre de 2026");
  });

  it("el término de la etapa se cambia por país en CONVOCATORIA_CONFIG, sin tocar código", () => {
    const config = { ...PRODUCCION, col: { estado: "abierta", cierra: "2027-02-15", etapa: "preinscripciones" } };
    const col = landing("col", config).texto;
    expect(col).toContain("Las preinscripciones en Colombia cierran el 15 de febrero de 2027");
    expect(landing(null, config).texto).toContain("Preinscripciones abiertas en Colombia y Uruguay.");
    // Con etapas distintas abiertas, la principal usa el término genérico.
    const mezcla = { ...PRODUCCION, col: { estado: "abierta" } };
    expect(landing(null, mezcla).texto).toContain("Inscripciones abiertas en Colombia y Uruguay.");
    expect(landing("col", mezcla).texto).toContain("Inscripciones Abiertas"); // abierta sin fecha: no inventa una
  });
});

describe("aislamiento por país", () => {
  it("mantenimiento apaga solo a ese país: los demás siguen con su estado", () => {
    const config = { uy: { estado: "mantenimiento" }, col: { estado: "abierta" } };
    const uy = landing("uy", config);
    expect(uy.texto).toContain("Estamos haciendo mejoras en Uruguay.");
    expect(uy.html).not.toContain("/inscripcion/uruguay");
    const col = landing("col", config);
    expect(col.html).toContain('href="/inscripcion/colombia?origen=landing_pais&amp;ubicacion=nav"');
    expect(landing("pan", config).texto).toContain("Muy pronto abrimos las inscripciones en Panamá.");
  });

  it("la configuración inválida de un país lo deja en muy pronto sin afectar a Uruguay", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = { ...PRODUCCION, col: { estado: "no-existe" } };
    expect(landing("col", config).texto).toContain("Muy pronto abrimos las inscripciones en Colombia.");
    expect(landing("uy", config).html).toContain("/inscripcion/uruguay?origen=landing_pais");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("los demás países van en tuteo y con su propio contenido", () => {
    const col = landing("col", { col: { estado: "abierta" } });
    expect(col.texto).toContain("¿Qué necesitas para aplicar?");
    expect(col.texto).toContain("Computadores ni otros equipos.");
    expect(col.texto).toContain("Estar en 10.° u 11.°, o ser bachiller.");
    expect(landing("ecu", {}).texto).toContain("Computadoras ni otros equipos.");
  });
});

describe("contacto", () => {
  it("el único correo de contacto es jovenescreativos@tocaunavida.org", () => {
    for (const html of [landing(null, PRODUCCION).html, landing("uy", { uy: { estado: "mantenimiento" } }).html]) {
      const correos = html.match(/[\w.+-]+@tocaunavida\.org/g) ?? [];
      expect(correos.length).toBeGreaterThan(0);
      expect(new Set(correos)).toEqual(new Set(["jovenescreativos@tocaunavida.org"]));
    }
  });
});
