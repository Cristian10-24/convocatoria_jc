// Pantalla "inscripciones cerradas" del formulario: usa el término de la etapa de cada país.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Cerradas } from "@/modules/inscripcion/components/Formulario";
import { DEFINICIONES } from "@/modules/inscripcion/config/paises";
import { etapaDe, leerConfigEntorno } from "@/shared/config/convocatoria";

const texto = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("formulario · cerradas según la etapa del país", () => {
  it("Uruguay: «Las preinscripciones en Uruguay están cerradas»; Colombia: «inscripciones»", () => {
    const produccion = leerConfigEntorno('{"uy":{"estado":"abierta","cierra":"2026-12-18"}}');
    const uy = texto(renderToStaticMarkup(createElement(Cerradas, { def: DEFINICIONES.uy, anio: "2027", rutaLanding: "/uruguay", etapa: etapaDe("uy", produccion) })));
    expect(uy).toContain("Las preinscripciones en Uruguay están cerradas");
    expect(uy).toContain("Las preinscripciones de la cohorte 2027 ya terminaron.");
    expect(uy).not.toMatch(/primera etapa/i);
    const col = texto(renderToStaticMarkup(createElement(Cerradas, { def: DEFINICIONES.col, anio: "2027", rutaLanding: "/colombia", etapa: etapaDe("col", produccion) })));
    expect(col).toContain("Las inscripciones en Colombia están cerradas");
  });
});
