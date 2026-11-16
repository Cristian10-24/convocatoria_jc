// Landings de convocatoria: contenido completo por país, voseo en Uruguay, fotos existentes y botones configurables.
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ACCIONES_POR_DEFECTO, PAISES_SLUG, conUtm, leerConfigEntorno, resolverAccion } from "@/modules/convocatoria/content/acciones";
import { SEGMENTO_URL } from "@/shared/config/paises";
import { COHORTE, PAISES, preguntas, requisitos, testimoniosPara } from "@/modules/convocatoria/content/contenido";

describe("contenido por país", () => {
  it("los 4 países tienen datos completos y rutas /col, /panama, /ecu, /uy", () => {
    for (const slug of PAISES_SLUG) {
      const p = PAISES[slug];
      expect(p.slug).toBe(slug);
      expect(p.ruta).toBe(`/${SEGMENTO_URL[slug]}`);
      expect(p.sedes.length).toBeGreaterThan(0);
      expect(p.fotos.galeria.length).toBeGreaterThanOrEqual(6);
      expect(requisitos(p)).toHaveLength(4);
    }
  });

  it("todas las fotos existen en public/ en las dos resoluciones", () => {
    for (const p of Object.values(PAISES)) {
      for (const foto of [p.fotos.hero, ...p.fotos.galeria, ...p.fotos.monitores]) {
        for (const suf of [".webp", "-800.webp"]) {
          expect(existsSync(path.join(process.cwd(), "public", `${foto.src}${suf}`)), `${foto.src}${suf}`).toBe(true);
        }
        expect(foto.alt.length).toBeGreaterThan(10);
      }
    }
  });

  it("Uruguay en voseo y el resto en tuteo", () => {
    expect(PAISES.uy.voz.convierte).toBe("Convertite");
    expect(PAISES.uy.voz.postulate).toBe("Postulate");
    for (const s of ["col", "pan", "ecu"] as const) expect(PAISES[s].voz.convierte).toBe("Conviértete");
    const faqUy = preguntas(PAISES.uy).map((f) => f.q + f.a).join(" ");
    expect(faqUy).toContain("Necesitás");
    expect(faqUy).not.toMatch(/\bnecesitas\b/i);
  });

  it("la cohorte convocada es posterior a 2026 y aparece en las preguntas", () => {
    expect(COHORTE.anio).toBeGreaterThan(2026);
    expect(preguntas(PAISES.col).find((f) => f.q.includes("dura"))?.a).toContain(COHORTE.inicio);
  });

  it("los testimonios del país salen primero", () => {
    expect(testimoniosPara("ecu").slice(0, 2).every((t) => t.pais === "ecu")).toBe(true);
    expect(testimoniosPara("pan")).toHaveLength(8);
  });
});

describe("acciones de los botones", () => {
  it("sin configuración, postular queda pendiente (no lleva a formularios cerrados)", () => {
    for (const p of ["col", "pan", "ecu"] as const) expect(resolverAccion("postular-hero", PAISES[p].config, undefined)).toEqual(ACCIONES_POR_DEFECTO.postular);
    expect(resolverAccion("ver-ruta", undefined, undefined)).toEqual({ tipo: "ancla", id: "ruta" });
  });

  it("Uruguay lleva a su formulario propio (que la landing apaga mientras no esté abierta)", () => {
    expect(resolverAccion("postular-hero", PAISES.uy.config, undefined)).toEqual({ tipo: "ruta", ruta: "/inscripcion/uy" });
  });

  it("los postular-* heredan de postular; el botón propio gana; el entorno gana al país", () => {
    const pais = { acciones: { postular: { tipo: "ruta" as const, ruta: "/inscripcion/uy" } } };
    const entorno = { acciones: { "postular-barra": { tipo: "evento" as const, nombre: "abrir-formulario" } } };
    expect(resolverAccion("postular-cierre", pais, entorno)).toEqual(pais.acciones.postular);
    expect(resolverAccion("postular-barra", pais, entorno)).toEqual(entorno.acciones["postular-barra"]);
  });

  it("lee CONVOCATORIA_CONFIG y descarta un JSON inválido sin romper", () => {
    const ok = leerConfigEntorno(JSON.stringify({ uy: { estado: "abierta", cierra: "2027-01-31", acciones: { postular: { tipo: "enlace", url: "https://forms.gle/abc", conUtm: true } } } }));
    expect(ok.uy?.estado).toBe("abierta");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(leerConfigEntorno("{no es json")).toEqual({});
    expect(leerConfigEntorno(JSON.stringify({ uy: { acciones: { postular: { tipo: "enlace", url: "http://inseguro.com" } } } }))).toEqual({});
    expect(leerConfigEntorno(JSON.stringify({ xx: {} }))).toEqual({});
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("conUtm agrega los utm_* de la visita sin pisar los del destino", () => {
    const url = conUtm("https://forms.gle/abc?utm_source=web", "?utm_source=wa&utm_campaign=jc27&otra=1");
    expect(url).toContain("utm_source=web");
    expect(url).toContain("utm_campaign=jc27");
    expect(url).not.toContain("otra=1");
  });
});

describe("rutas y SEO", () => {
  it("las rutas /conv_* y /convocatoria redirigen de forma permanente a las nuevas", async () => {
    const { default: config } = await import("../next.config");
    const redirecciones = await config.redirects!();
    const mapa = Object.fromEntries(redirecciones.map((r) => [r.source, r.destination]));
    expect(mapa).toMatchObject({ "/conv_col": "/col", "/conv_pan": "/panama", "/conv_ecu": "/ecu", "/conv_uy": "/uy", "/convocatoria": "/" });
    expect(redirecciones.every((r) => "permanent" in r && r.permanent)).toBe(true);
  });

  it("formulario, panel y API llevan noindex; las landings no", async () => {
    const { default: config } = await import("../next.config");
    const reglas = await config.headers!();
    const noindex = reglas.filter((r) => r.headers.some((h) => h.key === "X-Robots-Tag")).map((r) => r.source);
    expect(noindex).toEqual(expect.arrayContaining(["/inscripcion/:path*", "/admin/:path*", "/api/:path*"]));
    expect(noindex.some((s) => s === "/:path*")).toBe(false);
  });
});
