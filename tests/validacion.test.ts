import { describe, expect, it } from "vitest";
import { esBasura, limpiarEspacios, nombrePropio, partesNombreValidas, textoConSentido } from "@/shared/validation/textos";
import { correoValido, normalizarCorreo, sugerenciaCorreo } from "@/shared/validation/correo";
import { formatearCelular, validarCelular } from "@/shared/validation/telefono";
import { alfanumerico, cedulaEcuador, cedulaPanama, cedulaUruguay, dniArgentina, normalizarDocumento, numerico } from "@/shared/validation/documento";
import { edad, fechaValida, hoyIso } from "@/shared/validation/fechas";
import { celdaCsv, celdaSegura } from "@/shared/security/exportacion";
import { senalBot, TIEMPO_MINIMO_MS } from "@/shared/security/antibots";
import { paisDeSegmento, SEGMENTO_URL } from "@/shared/config/paises";

describe("textos y nombres", () => {
  it("limpia espacios y aplica nombre propio sin inventar tildes", () => {
    expect(limpiarEspacios("  ana   maría ")).toBe("ana maría");
    expect(nombrePropio("  MARÍA  DE LOS ángeles ")).toBe("María de los Ángeles");
    expect(nombrePropio("maría-josé d'angelo")).toBe("María-José D'Angelo");
  });

  it("detecta texto basura", () => {
    expect(esBasura("ffddgdffg")).toBe(true);
    expect(esBasura("aaaa")).toBe(true);
    expect(esBasura("1234")).toBe(true);
    expect(esBasura("Quiero aprender a programar")).toBe(false);
    expect(textoConSentido("Me gusta la tecnología y quiero crear apps", 30)).toBe(true);
    expect(textoConSentido("hola", 30)).toBe(false);
  });

  it("valida nombres y apellidos", () => {
    expect(partesNombreValidas("María José")).toBe(true);
    expect(partesNombreValidas("Pérez y Gómez")).toBe(true);
    expect(partesNombreValidas("Ana2")).toBe(false);
    expect(partesNombreValidas("x")).toBe(false);
    expect(partesNombreValidas("sdfghjk")).toBe(false);
  });
});

describe("correo", () => {
  it("normaliza y valida formato", () => {
    expect(normalizarCorreo(" Ana.Perez@Gmail.COM ")).toBe("ana.perez@gmail.com");
    expect(correoValido("ana@gmail.com")).toBe(true);
    expect(correoValido("ana@@gmail.com")).toBe(false);
    expect(correoValido("ana..p@gmail.com")).toBe(false);
  });

  it("sugiere el dominio correcto en tipeos comunes", () => {
    expect(sugerenciaCorreo("ana@gmial.com")).toBe("ana@gmail.com");
    expect(sugerenciaCorreo("ana@hotmial.com")).toBe("ana@hotmail.com");
    expect(sugerenciaCorreo("ana@gmail.com")).toBeNull();
    expect(sugerenciaCorreo("ana@colegio.edu.co")).toBeNull();
  });
});

describe("celular", () => {
  it("valida números nacionales del país por defecto", () => {
    expect(validarCelular("300 123 4567", "CO")).toEqual({ ok: true, e164: "+573001234567", nacional: "3001234567", pais: "CO" });
    expect(validarCelular("6123-4567", "PA")).toMatchObject({ ok: true, e164: "+50761234567" });
    expect(validarCelular("099 123 4567", "EC")).toMatchObject({ ok: true, e164: "+593991234567" });
    expect(validarCelular("091 234 567", "UY")).toMatchObject({ ok: true, e164: "+59891234567" });
  });

  it("acepta indicativo de otro país (frontera Uruguay–Argentina)", () => {
    expect(validarCelular("+54 3442 12 3456", "UY")).toMatchObject({ ok: true, pais: "AR", e164: "+543442123456" });
    expect(validarCelular("00 57 300 123 4567", "UY")).toMatchObject({ ok: true, pais: "CO" });
  });

  it("rechaza longitudes erróneas, letras y dígitos repetidos", () => {
    expect(validarCelular("300 123", "CO").ok).toBe(false);
    expect(validarCelular("300abc4567", "CO").ok).toBe(false);
    expect(validarCelular("3333333333", "CO").ok).toBe(false);
    expect(validarCelular("", "CO").ok).toBe(false);
  });

  it("formatea para mostrar", () => {
    expect(formatearCelular("+573001234567")).toBe("+57 300 123 4567");
    expect(formatearCelular("+59891234567")).toBe("+598 9123 4567");
    expect(formatearCelular("+593991234567")).toBe("+593 99 123 4567");
  });
});

describe("documentos", () => {
  it("normaliza", () => {
    expect(normalizarDocumento("1.234.567-2")).toBe("12345672");
    expect(normalizarDocumento("ab 123")).toBe("AB123");
  });

  it("reglas genéricas", () => {
    expect(numerico("1.023.456.789", 6, 10)).toBe(true);
    expect(numerico("11111111", 6, 10)).toBe(false);
    expect(numerico("12A456", 6, 10)).toBe(false);
    expect(alfanumerico("AB123456", 6, 12)).toBe(true);
    expect(alfanumerico("ABCDEF", 6, 12)).toBe(false);
  });

  it("cédula de Ecuador con dígito verificador", () => {
    expect(cedulaEcuador("1710034065")).toBe(true);
    expect(cedulaEcuador("1710034064")).toBe(false);
    expect(cedulaEcuador("9910034065")).toBe(false); // provincia inexistente
  });

  it("cédula de Uruguay con dígito verificador", () => {
    expect(cedulaUruguay("1.234.567-2")).toBe(true);
    expect(cedulaUruguay("12345672")).toBe(true);
    expect(cedulaUruguay("12345673")).toBe(false);
  });

  it("cédula de Panamá y DNI argentino", () => {
    expect(cedulaPanama("8-123-4567")).toBe(true);
    expect(cedulaPanama("PE-12-345")).toBe(true);
    expect(cedulaPanama("4AV-12-345")).toBe(true);
    expect(cedulaPanama("14-123-4567")).toBe(false);
    expect(cedulaPanama("8123 4567")).toBe(false);
    expect(dniArgentina("30.123.456")).toBe(true);
    expect(dniArgentina("123456")).toBe(false);
  });
});

describe("fechas", () => {
  it("valida fechas reales", () => {
    expect(fechaValida("2009-02-28")).toBe(true);
    expect(fechaValida("2009-02-30")).toBe(false);
    expect(fechaValida("2009-2-3")).toBe(false);
  });

  it("calcula la edad cumplida", () => {
    expect(edad("2009-03-15", "2027-03-14")).toBe(17);
    expect(edad("2009-03-15", "2027-03-15")).toBe(18);
  });

  it("hoy en una zona horaria", () => {
    expect(hoyIso("America/Bogota", new Date("2027-01-01T03:00:00Z"))).toBe("2026-12-31");
  });
});

describe("exportación segura", () => {
  it("neutraliza fórmulas", () => {
    expect(celdaSegura("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(celdaSegura("+57 300")).toBe("'+57 300");
    expect(celdaSegura("-1")).toBe("'-1");
    expect(celdaSegura("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(celdaSegura("Ana")).toBe("Ana");
    expect(celdaSegura(42)).toBe(42);
  });

  it("escapa CSV", () => {
    expect(celdaCsv('Dijo "hola", ya')).toBe('"Dijo ""hola"", ya"');
    expect(celdaCsv("=1+1")).toBe("'=1+1");
    expect(celdaCsv(null)).toBe("");
  });
});

describe("antibots", () => {
  const ahora = 1_800_000_000_000;
  it("detecta campo trampa y envío demasiado rápido", () => {
    expect(senalBot("http://spam", ahora - 60_000, ahora)).toBe("trampa");
    expect(senalBot("", ahora - 1_000, ahora)).toBe("muy_rapido");
    expect(senalBot("", ahora - TIEMPO_MINIMO_MS - 1, ahora)).toBeNull();
    expect(senalBot(undefined, undefined, ahora)).toBeNull();
  });
});

describe("países", () => {
  it("relaciona códigos internos y segmentos de URL", () => {
    expect(SEGMENTO_URL.pan).toBe("panama");
    expect(paisDeSegmento("panama")).toBe("pan");
    expect(paisDeSegmento("PANAMA")).toBe("pan");
    expect(paisDeSegmento("argentina")).toBeUndefined();
  });
});
