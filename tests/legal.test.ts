// Páginas legales y de sistema: /privacidad con lo acordado (responsable, finalidades, datos sensibles voluntarios y
// solo agregados, derechos, ley de cada país, un único canal de contacto), textos marcados como provisionales, y
// la misma ley y versión que acepta la persona en el formulario.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaginaLegal from "@/modules/legal/components/PaginaLegal";
import { PRIVACIDAD, TERMINOS } from "@/modules/legal/content/documentos";
import { DEFINICIONES } from "@/modules/inscripcion/config/paises";
import NoEncontrada from "@/app/not-found";
import { LEY_DATOS, VERSION_PRIVACIDAD } from "@/shared/config/legal";
import { NOMBRE_PAIS, PAISES } from "@/shared/config/paises";

const texto = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
const pagina = (documento: "privacidad" | "terminos") => renderToStaticMarkup(createElement(PaginaLegal, { documento, vigente: "2026-11-17" }));

describe("/privacidad", () => {
  const html = pagina("privacidad");
  const t = texto(html);

  it("dice lo acordado, en lenguaje sencillo", () => {
    expect(t).toContain("El responsable de tus datos personales es la Fundación ROFÉ");
    for (const f of ["gestionar tu inscripción y el proceso de selección", "contactarte", "estadísticas del programa"]) expect(t).toContain(f);
    expect(t).toMatch(/Responderlos es voluntario: puedes dejarlos en «Prefiero no responder»/);
    expect(t).toContain("Solo se usan sumados");
    expect(t).toContain("No vendemos tus datos ni los compartimos con terceros, salvo lo necesario para operar el programa");
    expect(t).toContain("conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización");
  });

  it("muestra la ley de Uruguay por defecto y tiene la de cada país", () => {
    expect(t).toContain("7. Ley aplicable en Uruguay");
    expect(t).toContain("Ley 18.331");
    for (const p of PAISES) {
      const secciones = PRIVACIDAD.secciones(LEY_DATOS[p], NOMBRE_PAIS[p]).map((s) => s.parrafos.join(" ")).join(" ");
      expect(secciones, p).toContain(LEY_DATOS[p].ley);
      expect(secciones, p).toContain(LEY_DATOS[p].autoridad);
    }
    expect(html).toContain('aria-pressed="true"');
  });

  it("un solo canal de contacto: jovenescreativos@tocaunavida.org", () => {
    const correos = html.match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? [];
    expect(correos.length).toBeGreaterThan(0);
    expect(new Set(correos)).toEqual(new Set(["jovenescreativos@tocaunavida.org"]));
    expect(t).not.toMatch(/Cra\. 7|contabilidad@|comunicaciones@/);
  });

  it("va marcada como provisional, con su versión", () => {
    expect(t).toContain("[TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA]");
    expect(t).toContain("Versión provisional 1");
    expect(html).toContain('class="falta"'); // [POR CONFIRMAR] resaltado
  });

  it("usa la misma ley y la misma versión que acepta la persona en el formulario", () => {
    for (const p of PAISES) {
      const legal = DEFINICIONES[p].legal;
      expect(legal.ley).toBe(LEY_DATOS[p].ley);
      expect(legal.autoridad).toBe(LEY_DATOS[p].autoridad);
      expect(legal.consentimientos.find((c) => c.clave === "privacidad")!.version).toBe(VERSION_PRIVACIDAD);
    }
    expect(PRIVACIDAD.version).toBe(VERSION_PRIVACIDAD);
  });
});

describe("/terminos", () => {
  it("es provisional, aplica en los 4 países y no habla de «salud mental»", () => {
    const t = texto(pagina("terminos"));
    expect(t).toContain("Términos y condiciones");
    expect(t).toContain("Aplica en los 4 países");
    expect(t).toContain("[TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA]");
    expect(t).toContain("apoyo y acompañamiento");
    expect(t).not.toMatch(/salud mental/i);
    expect(TERMINOS.porPais).toBe(false);
  });
});

describe("páginas de sistema", () => {
  it("404 con el diseño 2027 y el contacto único", () => {
    const html = renderToStaticMarkup(createElement(NoEncontrada));
    expect(texto(html)).toContain("No encontramos esta página.");
    expect(html).toContain("mailto:jovenescreativos@tocaunavida.org");
  });
});
