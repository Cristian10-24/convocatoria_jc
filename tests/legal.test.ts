// /privacidad con la política oficial de la Fundación ROFÉ (DE-010-D v1, 20/11/2023): una sola para los 4 países,
// sin marcas provisionales ni frases que no estén en el documento; las autorizaciones del formulario remiten a la
// misma política y quedan con la nueva versión. /terminos redirige a /privacidad.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaginaLegal from "@/modules/legal/components/PaginaLegal";
import { POLITICA } from "@/modules/legal/content/documentos";
import { DEFINICIONES } from "@/modules/inscripcion/config/paises";
import NoEncontrada from "@/app/not-found";
import { LEY_DATOS, POLITICA_OFICIAL, RESPONSABLE, VERSION_ACUDIENTE, VERSION_DATOS, VERSION_PRIVACIDAD, VIGENTE_DESDE } from "@/shared/config/legal";
import { PAISES } from "@/shared/config/paises";

const texto = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");
const html = renderToStaticMarkup(createElement(PaginaLegal, { vigente: VIGENTE_DESDE }));
const t = texto(html);

describe("/privacidad", () => {
  it("es la política oficial DE-010-D v1, con el enlace al PDF arriba y vigente desde el 20 de noviembre de 2023", () => {
    expect(t).toContain("Política de Tratamiento de Datos y Aviso de Privacidad de sus Datos Personales");
    expect(t).toContain("Documento DE-010-D · versión 1");
    expect(t).toContain("Vigente desde el 20 de noviembre de 2023");
    expect(html).toMatch(/class="lg-oficial" href="https:\/\/tocaunavida\.org\/wp-content\/uploads\/2024\/01\/2\.-DE-010-D-Politica-de-Tratamiento-de-datos\.pdf" target="_blank" rel="noopener"/);
    // El índice lateral nombra las secciones antes; en el documento, el enlace va antes de la primera sección.
    expect(t.indexOf(POLITICA_OFICIAL.texto)).toBeLessThan(t.lastIndexOf("1. Responsable del tratamiento"));
  });

  it("responsable, marco legal colombiano y autoridad (SIC), igual para los 4 países y sin selector de país", () => {
    for (const dato of ["901.144.889-7", "Carrera 6 # 109-07", "https://tocaunavida.org/", "admin@tocaunavida.org", "artículo 15 de la Constitución Política", "Ley Estatutaria 1581 de 2012", "Decreto Reglamentario 1377 de 2013", "Superintendencia de Industria y Comercio", "www.sic.gov.co", "contactenos@sic.gov.co"]) expect(t, dato).toContain(dato);
    for (const otra of ["18.331", "URCDP", "LOPDP", "Ley 81 de 2019", "ANTAI"]) expect(t, otra).not.toContain(otra);
    expect(html).not.toContain("lg-paises");
    for (const p of PAISES) expect(LEY_DATOS[p]).toBe(LEY_DATOS.col);
  });

  it("trae lo del PDF: sensibles (biométricos y socioeconómicos, 10 años), menores, Ley 2300, encargados, derechos a–f, consultas, reclamos y queja", () => {
    for (const f of ["autorización expresa, específica e informada", "datos biométricos y socioeconómicos", "direccionar las ayudas", "10 años desde la afiliación",
      "representante legal del menor o acudiente", "Ley 2300", "de 7:00 a. m. a 7:00 p. m.", "de 8:00 a. m. a 3:00 p. m.", "Domingos y festivos", "en calidad de Encargados",
      "a. Conocer, actualizar y rectificar", "f. Acceder en forma gratuita", "diez (10) días hábiles", "cinco (5) días hábiles", "quince (15) días hábiles", "ocho (8) días hábiles",
      "cinco (5) días calendario", "dos (2) meses", "reclamo en trámite"]) expect(t, f).toContain(f);
  });

  it("no trae marcas provisionales ni frases que no están en el PDF", () => {
    expect(t).not.toMatch(/PROVISIONAL|REVISIÓN JURÍDICA|POR CONFIRMAR|\[[A-ZÁÉÍÓÚ]/);
    for (const frase of [/no vendemos/i, /no (los )?compartimos/i, /solo sumados|de forma agregada|solo se usan sumados/i, /dirección IP/i, /al menos 14 años/i]) expect(t).not.toMatch(frase);
    expect(html).not.toContain('href="/terminos"');
  });

  it("derechos, consultas y reclamos van a admin@tocaunavida.org; el correo del programa queda para dudas de la inscripción", () => {
    const derechos = POLITICA.secciones.filter((s) => ["consultas", "reclamos"].includes(s.id)).map((s) => JSON.stringify(s)).join(" ");
    expect(derechos).toContain(RESPONSABLE.correo);
    expect(derechos).not.toContain("jovenescreativos@");
    expect(t).toContain("Dudas sobre el programa o tu inscripción: jovenescreativos@tocaunavida.org");
  });
});

describe("autorizaciones del formulario", () => {
  it("las 3 casillas son iguales en los 4 países, remiten a la misma política y tienen la versión nueva", () => {
    const base = DEFINICIONES.col.legal.consentimientos;
    expect(base.map((c) => c.version)).toEqual([VERSION_PRIVACIDAD, VERSION_DATOS, VERSION_ACUDIENTE]);
    expect(VERSION_PRIVACIDAD).toBe("politica-DE-010-D-v1");
    for (const p of PAISES) {
      const legal = DEFINICIONES[p].legal;
      expect(legal.consentimientos, p).toEqual(base);
      expect(legal.provisional, p).toBe(false);
      expect(legal.ley, p).toBe("Ley Estatutaria 1581 de 2012");
      const aviso = legal.parrafos.join(" ");
      expect(aviso, p).toContain("admin@tocaunavida.org");
      expect(aviso, p).toContain("Prefiero no responder");
      expect(aviso, p).not.toMatch(/no vendemos|sumados|PROVISIONAL/i);
    }
    for (const c of base) expect(c.texto).toContain("Fundación ROFÉ");
  });

  it("Uruguay conserva el voseo en el aviso", () => {
    expect(DEFINICIONES.uy.legal.parrafos.join(" ")).toContain("Tenés derecho");
    expect(DEFINICIONES.col.legal.parrafos.join(" ")).toContain("Tienes derecho");
  });
});

describe("/terminos", () => {
  it("redirige a /privacidad (temporal) hasta que haya términos oficiales", async () => {
    const { default: config } = await import("../next.config");
    const reglas = await config.redirects!();
    expect(reglas).toContainEqual(expect.objectContaining({ source: "/terminos", destination: "/privacidad", permanent: false }));
  });
});

describe("páginas de sistema", () => {
  it("404 con el diseño 2027 y el contacto único", () => {
    const html404 = renderToStaticMarkup(createElement(NoEncontrada));
    expect(texto(html404)).toContain("No encontramos esta página.");
    expect(html404).toContain("mailto:jovenescreativos@tocaunavida.org");
  });
});

describe("número de inscripción (antes «radicado»)", () => {
  it("la persona ve «número de inscripción», con la indicación para guardarlo y el contacto del programa", async () => {
    const { IU } = await import("@/modules/inscripcion/config/interfaz");
    const { columnasExportacion } = await import("@/modules/inscripcion/panel/presentacion");
    expect(IU.ok.radicado).toBe("Número de inscripción");
    expect(IU.ok.copiar).toBe("Copiar");
    expect(IU.ok.guardar.tu).toBe("Guárdalo: para cualquier consulta sobre tu inscripción puedes usar este número o tu número de documento, escribiendo a {correo}.");
    expect(IU.ok.guardar.vos).toBe("Guardalo: para cualquier consulta sobre tu inscripción podés usar este número o tu número de documento, escribiendo a {correo}.");
    expect(columnasExportacion(true).map((c) => c.titulo)).toContain("Número de inscripción");
    // Ningún texto visible dice "radicado" (la clave interna sí se sigue llamando así).
    const textos: string[] = [];
    const juntar = (v: unknown) => { if (typeof v === "string") textos.push(v); else if (v && typeof v === "object") Object.values(v).forEach(juntar); };
    juntar(IU);
    expect(textos.filter((x) => /radicado/i.test(x))).toEqual([]);
  });
});
