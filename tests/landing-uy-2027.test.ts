// Landing de Uruguay 2027 (diseño entregado en HTML, portado a Next): textos del diseño, fotos que existen,
// botones según el estado de CONVOCATORIA_CONFIG y en la misma pestaña, cuenta regresiva solo abierta.
import { existsSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { LANDING_URUGUAY_2027 } from "@/modules/convocatoria/content/contenido";
import LandingUy2027 from "@/modules/convocatoria/uy2027/LandingUy2027";

const env = process.env as Record<string, string | undefined>;
const original = env.CONVOCATORIA_CONFIG;
afterEach(() => {
  if (original === undefined) delete env.CONVOCATORIA_CONFIG;
  else env.CONVOCATORIA_CONFIG = original;
});

function pagina(config: object) {
  env.CONVOCATORIA_CONFIG = JSON.stringify(config);
  const html = renderToStaticMarkup(createElement(LandingUy2027));
  const texto = html.replace(/<style[^>]*>.*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
  return { html, texto };
}
const ABIERTA = { uy: { estado: "abierta", cierra: "2026-12-18" } };

describe("landing de Uruguay 2027", () => {
  it("está activa y trae los textos del diseño nuevo", () => {
    expect(LANDING_URUGUAY_2027).toBe(true);
    const { texto } = pagina(ABIERTA);
    for (const t of ["Convertite en", "desarrollador de software", "de marzo a octubre de 2027", "70 % virtual", "30 % presencial", "Mentores que te acompañan",
      "Tres cursos, un mismo camino", "Habilidades esenciales", "Charlas de fortalecimiento", "¿Cumplís con esto?", "Preinscripciones hasta el 18 de diciembre de 2026",
      "Lo cuentan quienes ya pasaron por acá", "Lo que más nos preguntan", "¿Querés ser parte de la generación 2027?"]) expect(texto, t).toContain(t);
    expect(texto).not.toMatch(/FOTO PENDIENTE|\[[A-ZÁÉÍÓÚ]/);
  });

  it("todas las fotos existen en public/convocatoria/uy-2027 (en 1600 y 800 px)", () => {
    const { html } = pagina(ABIERTA);
    const fotos = [...new Set([...html.matchAll(/\/convocatoria\/uy-2027\/[\w-]+\.webp/g)].map((m) => m[0]))];
    expect(fotos.length).toBeGreaterThanOrEqual(20);
    for (const f of fotos) expect(existsSync(path.join("public", f)), f).toBe(true);
  });

  it("abierta: los botones van directo a /inscripcion/uruguay en la misma pestaña, con origen y ubicación; hay cuenta regresiva", () => {
    const { html } = pagina(ABIERTA);
    for (const u of ["nav", "hero", "requisitos", "cierre", "barra"]) expect(html, u).toContain(`href="/inscripcion/uruguay?origen=landing_pais&amp;ubicacion=${u}"`);
    expect(html).not.toContain('target="_blank" rel="noopener" data-track="cta_inscribirme"');
    expect(html).toContain("data-cuenta");
    expect(html).not.toContain("data-pendiente");
  });

  it("muy pronto y cerrada: sin cuenta regresiva y los botones no llevan a ningún lado", () => {
    const pronto = pagina({ uy: { estado: "proxima" } });
    expect(pronto.texto).toContain("Preinscripciones muy pronto");
    expect(pronto.html).not.toContain("data-cuenta");
    expect(pronto.html).not.toContain('href="/inscripcion/uruguay');
    expect(pronto.html).toContain("data-pendiente");
    const cerrada = pagina({ uy: { estado: "cerrada" } });
    expect(cerrada.texto).toContain("ya cerraron");
    expect(cerrada.html).not.toContain("data-cuenta");
  });

  it("conserva el menú y el pie del sitio (con redes) y no trae la barra de progreso ni el pie propio", () => {
    const { html } = pagina(ABIERTA);
    expect(html).toContain('class="nav"');
    expect(html).toContain('class="pie osc"');
    expect(html).toContain("instagram.com/tocaunavida");
    expect(html).not.toContain("uy-progreso");
    expect(html).not.toContain("uy-encabezado");
    expect(html).toContain("data-pegajoso");
  });
});
