// Landings 2027: contenido por país, voseo en Uruguay, fotos existentes, configuración por país (aislada),
// destino de los botones, redirecciones de las URL anteriores y cabeceras de indexación.
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { conUtm, destinoInscripcion, rutaFormulario } from "@/modules/convocatoria/content/acciones";
import { DEFINICIONES } from "@/modules/inscripcion/config/paises";
import { ACERCA, BENEFICIOS, COHORTE, IMPACTO, INCLUYE, ORDEN_PAISES, PAISES, PREGUNTAS, REDES, comoFunciona, preguntas, diapositivas, galeria, requisitos, rutas, testimoniosPara } from "@/modules/convocatoria/content/contenido";
import { ETAPA_POR_DEFECTO, estadoConvocatoria, etapaDe, leerConfigEntorno } from "@/shared/config/convocatoria";
import { PAISES as SLUGS, SEGMENTO_URL } from "@/shared/config/paises";

describe("contenido por país", () => {
  it("los 4 países tienen datos completos y rutas /colombia, /ecuador, /panama, /uruguay", () => {
    expect(ORDEN_PAISES.map((s) => PAISES[s].ruta)).toEqual(["/colombia", "/ecuador", "/panama", "/uruguay"]);
    for (const slug of SLUGS) {
      const p = PAISES[slug];
      expect(p.slug).toBe(slug);
      expect(p.ruta).toBe(`/${SEGMENTO_URL[slug]}`);
      expect(requisitos(p)).toHaveLength(4);
      expect(galeria(p)).toHaveLength(7);
      expect(diapositivas(p, "abierta")).toHaveLength(2);
    }
    expect(diapositivas(null, "abierta")).toHaveLength(4);
    expect(galeria(null)).toHaveLength(8);
  });

  it("todas las fotos existen en public/ en las dos resoluciones y las de la galería llevan texto alternativo", () => {
    const fotos = [IMPACTO.foto, ACERCA.foto, BENEFICIOS.visitas.foto, ...rutas(PAISES.col.voz).map((r) => r.foto)];
    for (const p of [null, ...SLUGS.map((s) => PAISES[s])]) {
      fotos.push(...diapositivas(p, "abierta").map((d) => d.foto), ...galeria(p).map((g) => g.foto), ...comoFunciona(p).map((c) => c.foto));
      for (const g of galeria(p)) expect(g.foto.alt.length, g.foto.src).toBeGreaterThan(10);
    }
    for (const f of fotos) {
      for (const src of [f.src, f.src800]) expect(existsSync(path.join(process.cwd(), "public", src)), src).toBe(true);
      expect(f.ancho).toBeGreaterThan(0);
    }
  });

  it("Uruguay en voseo y el resto en tuteo", () => {
    expect(PAISES.uy.voz.aprende).toBe("Aprendé a programar ");
    expect(PAISES.uy.voz.todo).toContain("Cumplís");
    for (const s of ["col", "pan", "ecu"] as const) expect(PAISES[s].voz.aprende).toBe("Aprende a programar ");
    expect(comoFunciona(PAISES.uy)[2]?.texto).toMatch(/^Tenés /);
    expect(comoFunciona(PAISES.col)[2]?.texto).toMatch(/^Tienes /);
  });

  it("la cohorte convocada es 2027 y las rutas suman 3 + 3 + 23 semanas", () => {
    expect(COHORTE.anio).toBe(2027);
    expect(rutas(PAISES.col.voz).map((r) => r.semanas)).toEqual([3, 3, 23]);
  });

  it("testimonios: Uruguay igual que la principal y en el mismo orden; los demás países, los suyos; sin citas ni pendientes", () => {
    const principal = testimoniosPara(null);
    expect(principal).toHaveLength(8);
    expect(testimoniosPara(PAISES.uy).map((t) => t.nombre)).toEqual(principal.map((t) => t.nombre));
    expect(testimoniosPara(PAISES.ecu).every((t) => t.pais === "ecu")).toBe(true);
    // Panamá todavía no tiene: muestra los de todos en vez de un pendiente.
    expect(testimoniosPara(PAISES.pan)).toEqual(principal);
    for (const t of principal) {
      expect(t.youtubeId, t.nombre).toBeTruthy();
      expect(`${t.nombre} ${t.ciudad}`).not.toMatch(/\[/);
      expect(t).not.toHaveProperty("cita");
    }
  });

  it("preguntas frecuentes: 6, en lenguaje neutro, con las sedes de cada país", () => {
    expect(PREGUNTAS.map((f) => f.q)).toHaveLength(6);
    for (const lista of [PREGUNTAS, ...Object.values(PAISES).map((p) => preguntas(p))]) {
      const todo = lista.map((f) => `${f.q} ${f.a}`).join(" ");
      // Sin tú ni vos: ni "necesitás"/"necesitas", ni "tenés"/"tienes", ni "me/te".
      expect(todo).not.toMatch(/(necesit[aá]s|ten[eé]s|tienes|sab[eé]s|me prestan|recibo|tengo)/i);
    }
    expect(preguntas(PAISES.uy).find((f) => f.q.includes("virtual"))!.a).toContain("Colonia y Paysandú");
    expect(preguntas(PAISES.col).map((f) => f.q).join(" ")).toContain("un computador");
    expect(PREGUNTAS.find((f) => f.q.includes("virtual"))!.a).toContain("ciudades sede");
  });

  it("redes con enlace (sin pendientes)", () => {
    expect(REDES.every((r) => r.url?.startsWith("https://"))).toBe(true);
  });

  it("requisitos: sin edad; herramientas con «computadora» (Colombia: «computador»)", () => {
    for (const p of [null, ...SLUGS.map((s) => PAISES[s])]) {
      const r = requisitos(p);
      expect(r.map((x) => x.clave)).toEqual(["Ubicación", "Nivel educativo", "Herramientas", "Compromiso"]);
      expect(r.some((x) => /RANGO|POR CONFIRMAR/.test(`${x.texto} ${x.pendiente ?? ""}`))).toBe(false);
    }
    expect(requisitos(null)[2]!.texto).toBe("Acceso a una computadora e internet.");
    expect(requisitos(PAISES.col)[2]!.texto).toBe("Acceso a un computador e internet.");
    for (const s of ["ecu", "pan", "uy"] as const) expect(requisitos(PAISES[s])[2]!.texto).toBe("Acceso a una computadora e internet.");
  });

  it("ubicación: nombra las ciudades sede del formulario de cada país, sin priorizar ninguna", () => {
    for (const s of SLUGS) {
      const texto = requisitos(PAISES[s])[0]!.texto;
      expect(texto).not.toMatch(/prioriz/i);
      for (const sede of DEFINICIONES[s].config.sedes) expect(texto, `${s}: ${sede.nombre}`).toContain(sede.nombre);
    }
    expect(requisitos(PAISES.uy)[0]!.texto).toBe("Vivir en Colonia, Paysandú o ciudades cercanas, o en Colón y Concepción del Uruguay (Argentina).");
    // Las ciudades argentinas que nombra Uruguay son las del formulario.
    const ciudadesUy = DEFINICIONES.uy.config.sedes.flatMap((x) => x.ciudades).join(" ");
    for (const c of ["Colón", "Concepción del Uruguay"]) expect(ciudadesUy).toContain(c);
  });

  it("«Apoyo en salud mental» ya no aparece: es «Apoyo y acompañamiento»", () => {
    expect(INCLUYE).toContain("Apoyo y acompañamiento.");
    expect(JSON.stringify([INCLUYE, BENEFICIOS, PREGUNTAS, SLUGS.map((s) => comoFunciona(PAISES[s]))])).not.toMatch(/salud mental/i);
  });

  it("Panamá usa pan-reto en lugar de la foto pan-visita, que no existe", () => {
    expect(galeria(PAISES.pan).some((g) => g.foto.id === "pan-reto")).toBe(true);
  });
});

describe("CONVOCATORIA_CONFIG", () => {
  it("el valor de producción de Uruguay sigue funcionando igual", () => {
    const config = leerConfigEntorno('{"uy":{"estado":"abierta","cierra":"2026-12-18"}}');
    expect(config).toEqual({ uy: { estado: "abierta", cierra: "2026-12-18" } });
    const antes = new Date("2026-11-17T12:00:00-05:00").getTime();
    const despues = new Date("2026-12-19T00:00:01-05:00").getTime();
    expect(estadoConvocatoria("uy", { entorno: config, ahora: antes })).toEqual({ estado: "abierta", cierra: "2026-12-18" });
    expect(estadoConvocatoria("uy", { entorno: config, ahora: despues }).estado).toBe("cerrada");
    for (const p of ["col", "pan", "ecu"] as const) expect(estadoConvocatoria(p, { entorno: config, ahora: antes }).estado).toBe("proxima");
  });

  it("la entrada inválida de un país lo deja en muy pronto y no afecta a los demás", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = leerConfigEntorno(JSON.stringify({
      uy: { estado: "abierta", cierra: "2026-12-18" },
      col: { estado: "abierrta" },
      ecu: { estado: "abierta", acciones: { postular: { tipo: "enlace", url: "http://inseguro.com" } } },
      xx: { estado: "abierta" },
    }));
    expect(config.uy).toEqual({ estado: "abierta", cierra: "2026-12-18" });
    expect(config.col).toEqual({ estado: "proxima" });
    expect(config.ecu).toEqual({ estado: "proxima" });
    expect(Object.keys(config).sort()).toEqual(["col", "ecu", "uy"]);
    expect(err).toHaveBeenCalledTimes(3);
    expect(err.mock.calls.flat().join(" ")).toContain('"col"');
    err.mockRestore();
  });

  it("un texto que no es JSON (o no es un objeto) se ignora entero sin romper", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(leerConfigEntorno("{no es json")).toEqual({});
    expect(leerConfigEntorno('["uy"]')).toEqual({});
    expect(leerConfigEntorno("")).toEqual({});
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });

  it("etapa: Uruguay en preinscripciones y los demás en inscripciones; se cambia por país en la configuración", () => {
    expect(ETAPA_POR_DEFECTO).toEqual({ uy: "preinscripciones", col: "inscripciones", ecu: "inscripciones", pan: "inscripciones" });
    const produccion = leerConfigEntorno('{"uy":{"estado":"abierta","cierra":"2026-12-18"}}');
    for (const p of SLUGS) expect(etapaDe(p, produccion), p).toBe(p === "uy" ? "preinscripciones" : "inscripciones");
    const cambiada = leerConfigEntorno(JSON.stringify({ col: { estado: "abierta", etapa: "preinscripciones" }, uy: { etapa: "inscripciones" } }));
    expect(etapaDe("col", cambiada)).toBe("preinscripciones");
    expect(etapaDe("uy", cambiada)).toBe("inscripciones");
    // Un término desconocido invalida solo la entrada de ese país (queda en "muy pronto" y con su término por defecto).
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const rota = leerConfigEntorno(JSON.stringify({ ecu: { estado: "abierta", etapa: "matriculas" }, uy: { estado: "abierta" } }));
    expect(rota.ecu).toEqual({ estado: "proxima" });
    expect(etapaDe("ecu", rota)).toBe("inscripciones");
    expect(rota.uy).toEqual({ estado: "abierta" });
    err.mockRestore();
  });

  it("mantenimiento apaga solo a ese país", () => {
    const config = leerConfigEntorno(JSON.stringify({ uy: { estado: "mantenimiento" }, col: { estado: "abierta" } }));
    expect(estadoConvocatoria("uy", { entorno: config }).estado).toBe("mantenimiento");
    expect(estadoConvocatoria("col", { entorno: config }).estado).toBe("abierta");
    expect(estadoConvocatoria("pan", { entorno: config }).estado).toBe("proxima");
  });
});

describe("botones de inscripción", () => {
  it("en una landing de país van directo a su formulario, en la misma pestaña, con origen y ubicación; en la principal bajan a la franja de países", () => {
    expect(rutaFormulario("uy")).toBe("/inscripcion/uruguay");
    expect(rutaFormulario(null)).toBe("/inscripcion");
    expect(destinoInscripcion("uy", "hero_slide_1")).toEqual({ href: "/inscripcion/uruguay?origen=landing_pais&ubicacion=hero_slide_1", nuevaPestana: false });
    expect(destinoInscripcion(null, "nav")).toEqual({ href: "#paises", nuevaPestana: false });
  });

  it("CONVOCATORIA_CONFIG puede cambiar el destino de un país con acciones.postular", () => {
    expect(destinoInscripcion("col", "nav", { acciones: { postular: { tipo: "enlace", url: "https://forms.gle/abc" } } })).toEqual({ href: "https://forms.gle/abc", nuevaPestana: false });
    expect(destinoInscripcion("col", "nav", { acciones: { postular: { tipo: "ruta", ruta: "/otra" } } }).href).toBe("/otra?origen=landing_pais&ubicacion=nav");
  });

  it("conUtm agrega los utm_* y el fbclid de la visita sin pisar los del destino", () => {
    const url = conUtm("https://forms.gle/abc?utm_source=web", "?utm_source=wa&utm_campaign=jc27&fbclid=x1&otra=1");
    expect(url).toContain("utm_source=web");
    expect(url).toContain("utm_campaign=jc27");
    expect(url).toContain("fbclid=x1");
    expect(url).not.toContain("otra=1");
  });
});

describe("rutas y SEO", () => {
  it("las URL anteriores redirigen de forma permanente y en un solo salto a las nuevas", async () => {
    const { default: config } = await import("../next.config");
    const redirecciones = await config.redirects!();
    const mapa: Record<string, string | undefined> = Object.fromEntries(redirecciones.map((r) => [r.source, r.destination]));
    expect(mapa).toMatchObject({
      "/uy": "/uruguay", "/col": "/colombia", "/ecu": "/ecuador",
      "/conv_col": "/colombia", "/conv_pan": "/panama", "/conv_ecu": "/ecuador", "/conv_uy": "/uruguay", "/convocatoria": "/",
      "/inscripcion/uy": "/inscripcion/uruguay", "/inscripcion/col": "/inscripcion/colombia", "/inscripcion/ecu": "/inscripcion/ecuador",
    });
    expect(redirecciones.every((r) => "permanent" in r && r.permanent)).toBe(true);
    // Sin cadenas: ningún destino es, a su vez, origen de otra redirección.
    for (const r of redirecciones) expect(mapa[r.destination], r.destination).toBeUndefined();
    // Todos los destinos son rutas vigentes.
    const vigentes = new Set(["/", ...SLUGS.flatMap((s) => [`/${SEGMENTO_URL[s]}`, `/inscripcion/${SEGMENTO_URL[s]}`])]);
    for (const r of redirecciones) expect(vigentes.has(r.destination), r.destination).toBe(true);
  });

  it("formulario, panel y API llevan noindex; las landings no", async () => {
    const { default: config } = await import("../next.config");
    const reglas = await config.headers!();
    const noindex = reglas.filter((r) => r.headers.some((h) => h.key === "X-Robots-Tag")).map((r) => r.source);
    expect(noindex).toEqual(expect.arrayContaining(["/inscripcion/:path*", "/admin/:path*", "/api/:path*"]));
    expect(noindex.some((s) => s === "/:path*")).toBe(false);
  });
});
