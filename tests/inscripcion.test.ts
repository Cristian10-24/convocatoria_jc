// Reglas del formulario (puras): validación, condiciones, normalización, alertas, radicado y configuración por país.
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { PAISES } from "@/shared/config/paises";
import { estadoConvocatoria } from "@/shared/config/convocatoria";
import { hoyIso } from "@/shared/validation/fechas";
import { calcularAlertas } from "@/modules/inscripcion/alertas";
import { CONFIG_PAISES, DEFINICIONES } from "@/modules/inscripcion/config/paises";
import { PASOS, PREGUNTAS } from "@/modules/inscripcion/config/preguntas";
import { radicadoDe, prefijoConvocatoria } from "@/modules/inscripcion/radicado";
import { camposVisibles, documentoAlEscribir, esquemaInscripcion, pasosVisibles, revisarBorrador } from "@/modules/inscripcion/schema";
import { textoRespuesta } from "@/modules/inscripcion/mostrar";
import { conUtm } from "@/modules/convocatoria/content/acciones";
import { ACUDIENTE, cedulaUy, haceAnios, inscripcionUy } from "./inscripcion-datos";

const hoy = hoyIso();
// Los datos de prueba de Uruguay usan el formato anterior (una casilla): es el que ya está en producción.
const uyDef = DEFINICIONES.uy;
const uy = uyDef.config;
const revisarUy = (d: Record<string, unknown>) => revisarBorrador(uyDef, d, hoy, 1);

describe("validación del formulario de Uruguay", () => {
  it("acepta una inscripción válida y la normaliza", () => {
    const r = esquemaInscripcion(uyDef, hoy, 1).safeParse(inscripcionUy());
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toMatchObject({
      nombres: "María José",
      apellidos: "Pérez Gómez",
      documento: "12345672",
      correo: "maria.perez@gmail.com",
      whatsapp: "+59891234567",
      telefonoAlterno: "+59899876543",
      promedio: 9.5,
      internet: true,
      aplicoAntes: false,
      edad: 19,
      aceptaDatos: true,
    });
    expect(r.data.acudiente).toBeUndefined();
    expect(r.data.seleccionadoAntes).toBeUndefined();
  });

  it("devuelve errores por campo con el trato de Uruguay (voseo)", () => {
    const r = revisarUy({});
    expect(r.datos).toBeUndefined();
    expect(r.errores.sede).toBe("Elegí una opción.");
    expect(r.errores.nombres).toBe("Respondé esta pregunta.");
    expect(r.errores.aceptaDatos).toBe("Tenés que aceptar para enviar la inscripción.");
  });

  it("el documento es un número entero: solo dígitos, sin puntos, guiones ni dígito verificador", () => {
    expect(revisarUy(inscripcionUy({ documento: "12345673" })).errores.documento).toBeUndefined(); // sin revisar el verificador
    expect(revisarUy(inscripcionUy({ documento: " 4567890 " })).datos?.documento).toBe("4567890");
    for (const malo of ["1.234.567-2", "1234567-2", "AB12345", "12345", "123456789", "11111111"])
      expect(revisarUy(inscripcionUy({ documento: malo })).errores.documento, malo).toBe("Escribí solo el número, sin puntos, guiones ni letras.");
    expect(revisarUy(inscripcionUy({ tipoDocumento: "dni_ar", documento: "30123456" })).datos?.documento).toBe("30123456");
    // Se guarda como texto: los ceros a la izquierda se conservan.
    expect(revisarUy(inscripcionUy({ documento: "01234567" })).datos?.documento).toBe("01234567");
    expect(revisarUy(inscripcionUy({ tipoDocumento: "dni_ar", documento: "AB123456" })).errores.documento).toBeDefined();
  });

  it("pasaporte y «Otro» admiten letras y números, sin espacios ni símbolos, y se guardan en mayúsculas", () => {
    expect(revisarUy(inscripcionUy({ tipoDocumento: "pasaporte", documento: "c1234567" })).datos?.documento).toBe("C1234567");
    expect(revisarUy(inscripcionUy({ tipoDocumento: "pasaporte", documento: "0012345" })).datos?.documento).toBe("0012345");
    const otro = revisarUy(inscripcionUy({ tipoDocumento: "otro", tipoDocumentoOtro: "Cédula paraguaya", documento: "py45678" }));
    expect(otro.datos).toMatchObject({ documento: "PY45678", tipoDocumentoOtro: "Cédula paraguaya" });
    for (const malo of ["C 123456", "C-123456", "C.123456", "AAAAAAA", "C12"])
      expect(revisarUy(inscripcionUy({ tipoDocumento: "pasaporte", documento: malo })).errores.documento, malo).toBe("Escribí solo letras y números, sin espacios ni símbolos.");
  });

  it("al escribir, el campo descarta lo que el formato no admite", () => {
    expect(documentoAlEscribir({ formato: "numerico", min: 6, max: 8 }, "1.234.567-2")).toBe("12345672");
    expect(documentoAlEscribir({ formato: "numerico", min: 6, max: 8 }, "0123 abc")).toBe("0123");
    expect(documentoAlEscribir({ formato: "alfanumerico", min: 5, max: 15 }, "c-12 345.6")).toBe("C123456");
  });

  it("la ciudad debe ser de la sede elegida, o «Otra» con texto", () => {
    expect(revisarUy(inscripcionUy({ ciudad: "Carmelo" })).errores.ciudad).toBeDefined(); // Carmelo es de Colonia
    expect(revisarUy(inscripcionUy({ ciudad: "__otra__" })).errores.ciudadOtra).toBeDefined();
    expect(revisarUy(inscripcionUy({ ciudad: "__otra__", ciudadOtra: "Bella Unión" })).datos?.ciudadOtra).toBe("Bella Unión");
  });

  it("bloquea menores de 14 años", () => {
    expect(revisarUy(inscripcionUy({ fechaNacimiento: haceAnios(13) })).errores.fechaNacimiento).toMatch(/14 años/);
  });

  it("pide acudiente y su autorización solo a menores de 18", () => {
    const menor = inscripcionUy({ fechaNacimiento: haceAnios(16) });
    const sinAcudiente = revisarUy(menor);
    expect(sinAcudiente.errores.acudienteNombres).toBeDefined();
    expect(sinAcudiente.errores.autorizaAcudiente).toBeDefined();
    const conAcudiente = revisarUy({ ...menor, ...ACUDIENTE });
    expect(conAcudiente.errores).toEqual({});
    expect(conAcudiente.datos?.acudiente).toMatchObject({ nombres: "Laura", relacion: "madre", telefono: "+59898111222" });
    expect(conAcudiente.datos?.autorizaAcudiente).toBe(true);
    expect(pasosVisibles(uyDef, menor, hoy).map((p) => p.id)).toContain("acudiente");
    expect(pasosVisibles(uyDef, inscripcionUy(), hoy).map((p) => p.id)).not.toContain("acudiente");
  });

  it("el número alterno debe ser distinto del WhatsApp", () => {
    expect(revisarUy(inscripcionUy({ telefonoAlterno: "+598 91 234 567" })).errores.telefonoAlterno).toMatch(/distinto/);
  });

  it("promedio con decimales en la escala del país", () => {
    expect(revisarUy(inscripcionUy({ promedio: "12" })).datos?.promedio).toBe(12);
    expect(revisarUy(inscripcionUy({ promedio: "12,5" })).errores.promedio).toBeDefined();
    expect(revisarUy(inscripcionUy({ promedio: "0" })).errores.promedio).toBeDefined();
    expect(revisarUy(inscripcionUy({ promedio: "abc" })).errores.promedio).toBeDefined();
  });

  it("condicionales: año de egreso, seleccionado antes, embajador y los «Otro»", () => {
    expect(revisarUy(inscripcionUy({ grado: "egresado" })).errores.anioEgreso).toBeDefined();
    expect(revisarUy(inscripcionUy({ aplicoAntes: "si" })).errores.seleccionadoAntes).toBeDefined();
    expect(revisarUy(inscripcionUy({ canal: "embajador" })).errores.embajador).toBeDefined();
    expect(revisarUy(inscripcionUy({ canal: "embajador", embajador: "Juan de Salto" })).datos?.embajador).toBe("Juan de Salto");
    expect(revisarUy(inscripcionUy({ ocupacion: ["estudiante", "otro"] })).errores.ocupacionOtra).toBeDefined();
    expect(revisarUy(inscripcionUy({ tipoDocumento: "otro", documento: "1234567" })).errores.tipoDocumentoOtro).toBeDefined();
    // Un campo oculto no se valida aunque traiga basura.
    expect(revisarUy(inscripcionUy({ embajador: "zzzzzz" })).errores.embajador).toBeUndefined();
    expect(revisarUy(inscripcionUy({ embajador: "Juan" })).datos?.embajador).toBeUndefined();
  });

  it("poblaciones: selección múltiple con «Ninguna» excluyente", () => {
    expect(revisarUy(inscripcionUy({ poblaciones: ["rural", "migrante"] })).datos?.poblaciones).toEqual(["rural", "migrante"]);
    expect(revisarUy(inscripcionUy({ poblaciones: ["rural", "ninguna"] })).errores.poblaciones).toBeDefined();
    expect(revisarUy(inscripcionUy({ poblaciones: [] })).errores.poblaciones).toBeDefined();
    expect(revisarUy(inscripcionUy({ poblaciones: ["otra"] })).errores.poblacionOtra).toBeDefined();
  });

  it("rechaza opciones inexistentes y descarta campos desconocidos", () => {
    expect(revisarUy(inscripcionUy({ talla: "xxxl" })).errores.talla).toBeDefined();
    const r = esquemaInscripcion(uyDef, hoy, 1).safeParse(inscripcionUy({ esAdmin: true, $where: "1" }));
    expect(r.success && "esAdmin" in r.data).toBe(false);
  });

  it("la talla es obligatoria para todos", () => {
    expect(revisarUy(inscripcionUy({ talla: "" })).errores.talla).toBeDefined();
  });

  it("muestra solo los campos que aplican", () => {
    const visibles = camposVisibles(uyDef, inscripcionUy(), hoy, 1);
    expect(visibles.has("sede")).toBe(true); // Uruguay tiene 2 sedes
    expect(visibles.has("anioEgreso")).toBe(false);
    expect(camposVisibles(DEFINICIONES.pan, { sede: "__otra__" }, hoy).has("sedeCercana")).toBe(false); // Panamá: una sola sede, no se pregunta cuál
  });

  it("texto legible para el resumen", () => {
    const d = inscripcionUy({ ciudad: "__otra__", ciudadOtra: "Bella Unión" });
    expect(textoRespuesta(uy, "horas", d)).toBe("Entre 10 y 15 horas");
    expect(textoRespuesta(uy, "ciudad", d)).toBe("Bella Unión");
    expect(textoRespuesta(uy, "grado", d)).toBe("6.° de liceo");
  });
});

describe("alertas", () => {
  const datos = (extra: Record<string, unknown>) => revisarUy(inscripcionUy(extra)).datos!;
  it("marca requisitos no cumplidos sin bloquear", () => {
    const codigos = (extra: Record<string, unknown>, correoRepetido = false) =>
      calcularAlertas(uy, datos(extra), { hoy, correoRepetido }).map((a) => a.codigo);
    expect(codigos({})).toEqual([]);
    expect(codigos({ internet: "no", computadora: "ninguna", horas: "5a10" })).toEqual(["sin_internet", "sin_computador", "pocas_horas"]);
    expect(codigos({ horas: "menos5" })).toEqual(["pocas_horas"]);
    expect(codigos({ fechaNacimiento: haceAnios(31) })).toEqual(["edad_mayor"]);
    expect(codigos({ grado: "egresado", anioEgreso: String(Number(hoy.slice(0, 4)) - 4) })).toEqual(["egreso_antiguo"]);
    expect(codigos({ grado: "egresado", anioEgreso: String(Number(hoy.slice(0, 4)) - 3) })).toEqual([]);
    expect(codigos({}, true)).toEqual(["correo_repetido"]);
  });
});

describe("radicado", () => {
  it("tiene el formato JC27-UY-XXXXXXXX y es estable para un mismo _id", () => {
    const id = new ObjectId();
    const r = radicadoDe(id, "uy", "jc-2027");
    expect(r).toMatch(/^JC27-UY-[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(radicadoDe(id, "uy", "jc-2027")).toBe(r);
    expect(prefijoConvocatoria("jc-2028")).toBe("JC28");
  });

  it("no se repite en miles de inscripciones seguidas", () => {
    const vistos = new Set(Array.from({ length: 5000 }, () => radicadoDe(new ObjectId(), "uy", "jc-2027")));
    expect(vistos.size).toBe(5000);
  });

  it("genera cédulas de prueba válidas", () => {
    expect(revisarUy(inscripcionUy({ documento: cedulaUy(4567890) })).errores.documento).toBeUndefined();
  });
});

describe("configuración por país", () => {
  it("los 4 países tienen su formulario listo; lo que abre o cierra cada uno es CONVOCATORIA_CONFIG", () => {
    expect(uy.trato).toBe("vos");
    for (const p of PAISES) expect(CONFIG_PAISES[p].habilitado).toBe(true);
    for (const p of ["col", "pan", "ecu"] as const) expect(CONFIG_PAISES[p].trato).toBe("tu");
  });

  it("cada país tiene sedes con ciudades, documentos, grados con «egresado» y escala de notas", () => {
    for (const p of PAISES) {
      const c = CONFIG_PAISES[p];
      expect(c.sedes.length).toBeGreaterThan(0);
      // Solo Uruguay elige la ciudad de una lista por sede; en los demás la residencia se escribe.
      if (DEFINICIONES[p].reglas.ubicacion === "lista") expect(c.sedes.every((s) => s.ciudades.length > 0)).toBe(true);
      expect(c.tiposDocumento.length).toBeGreaterThan(1);
      expect(c.grados.some((g) => g.id === "egresado")).toBe(true);
      expect(c.escalaNotas.max).toBeGreaterThan(c.escalaNotas.min);
    }
  });

  it("las sedes y ciudades de Uruguay son las aprobadas", () => {
    expect(uy.sedes.map((s) => s.nombre)).toEqual(["Paysandú", "Colonia"]);
    expect(uy.sedes[0]!.ciudades).toContain("Concepción del Uruguay (Argentina)");
    expect(uy.sedes[1]!.ciudades).toContain("Ombúes de Lavalle");
  });

  it("los textos legales son provisionales, marcados y con versión única", () => {
    const versiones = PAISES.map((p) => DEFINICIONES[p].legal.consentimientos.find((c) => c.clave === "datos")!.version);
    expect(new Set(versiones).size).toBe(PAISES.length);
    expect(PAISES.every((p) => DEFINICIONES[p].legal.provisional)).toBe(true);
    expect(DEFINICIONES.uy.legal.parrafos.join(" ")).toContain("18.331");
    expect(DEFINICIONES.uy.legal.versionAnterior).toBe("uy-2027-provisional-1"); // la que ya tienen las inscripciones de producción
  });

  it("cada campo de cada paso tiene su pregunta", () => {
    for (const p of PASOS) for (const c of p.campos) expect(PREGUNTAS[c]).toBeDefined();
  });
});

describe("estado de la convocatoria y botones de la landing", () => {
  it("sin configuración, todo está «próxima»; la fecha de cierre pasada cierra", () => {
    expect(estadoConvocatoria("uy", { entorno: {} }).estado).toBe("proxima");
    expect(estadoConvocatoria("uy", { entorno: { uy: { estado: "abierta" } } }).estado).toBe("abierta");
    const ahora = new Date("2027-02-20T12:00:00Z").getTime();
    expect(estadoConvocatoria("uy", { entorno: { uy: { estado: "abierta", cierra: "2027-02-15" } }, ahora }).estado).toBe("cerrada");
    expect(estadoConvocatoria("uy", { entorno: { uy: { estado: "abierta", cierra: "2027-02-25" } }, ahora }).estado).toBe("abierta");
  });

  it("pasa los utm_* también a rutas internas", () => {
    expect(conUtm("/inscripcion/uy", "?utm_source=wa&x=1")).toBe("/inscripcion/uy?utm_source=wa");
  });
});
