// Inscripciones FALSAS para ver y probar el panel con volumen. Uso:
//   npm run semilla:demo                 → 3000 inscripciones en la base local (dev:local)
//   npm run semilla:demo -- 10000        → otra cantidad
//   npm run semilla:demo -- --borrar     → borra solo las de demo (marcadas con demo: true)
// Por seguridad solo escribe en una base local (localhost / 127.0.0.1). Para una base de pruebas en Atlas hay que
// agregar --remoto a propósito. Nunca la uses contra la base de producción.
import { ObjectId } from "mongodb";
import { cerrarDb, hostDb } from "@/shared/db/mongo";
import { PAISES, type PaisSlug } from "@/shared/config/paises";
import { ALERTAS, type CodigoAlerta } from "@/modules/inscripcion/config/alertas";
import { CONFIG_PAISES } from "@/modules/inscripcion/config/paises";
import { CANALES, COMPUTADORA, GENERO, HORAS, INGRESOS, OCUPACION, POBLACIONES, TALLAS } from "@/modules/inscripcion/config/preguntas";
import { radicadoDe } from "@/modules/inscripcion/radicado";
import { coleccion, type Inscripcion } from "@/modules/inscripcion/repository";

const args = process.argv.slice(2);
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27117/";
process.env.MONGODB_URI = MONGODB_URI;
process.env.MONGODB_DB ??= "convocatoria_local";

const NOMBRES = ["María", "José", "Valentina", "Santiago", "Camila", "Mateo", "Sofía", "Juan", "Lucía", "Martín", "Isabella", "Sebastián", "Daniela", "Nicolás", "Gabriela", "Thiago", "Mariana", "Lucas", "Ana", "Benjamín", "Paula", "Agustín", "Florencia", "Joaquín"];
const APELLIDOS = ["Pérez", "Gómez", "Rodríguez", "Fernández", "López", "Martínez", "González", "Sánchez", "Ramírez", "Torres", "Díaz", "Vargas", "Castro", "Romero", "Suárez", "Méndez", "Silva", "Núñez", "Rojas", "Acosta"];
const EMBAJADORES = ["Laura M.", "laura m.", "Pedro Salto", "EMB-014", "Ana Colonia", "Tomás", "EMB-022"];

let semilla = 42;
const azar = () => ((semilla = (semilla * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const elegir = <T>(xs: readonly T[]): T => xs[Math.floor(azar() * xs.length)]!;
const algunos = <T>(xs: readonly T[], max: number): T[] => [...new Set(Array.from({ length: 1 + Math.floor(azar() * max) }, () => elegir(xs)))];

function inscripcionFalsa(i: number, ahora: number, convocatoria: string): Inscripcion {
  // Más volumen en Uruguay (el único abierto) y en los últimos días, como en una apertura real.
  const pais: PaisSlug = azar() < 0.55 ? "uy" : elegir(PAISES);
  const cfg = CONFIG_PAISES[pais];
  const sede = elegir(cfg.sedes);
  const otra = azar() < 0.05;
  const edad = 14 + Math.floor(azar() ** 1.6 * 18);
  const menor = edad < cfg.edad.mayoriaDeEdad;
  const grado = elegir(cfg.grados).id;
  const horas = elegir(HORAS).id;
  const computadora = azar() < 0.8 ? elegir(COMPUTADORA.slice(0, 2)).id : "ninguna";
  const internet = azar() < 0.93;
  const canal = elegir(CANALES).id;
  const nombres = `${elegir(NOMBRES)}${azar() < 0.3 ? ` ${elegir(NOMBRES)}` : ""}`;
  const apellidos = `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`;
  const creadoEn = new Date(ahora - Math.floor(azar() ** 2 * 30 * 864e5));
  const anio = new Date(ahora).getUTCFullYear();

  const codigos: CodigoAlerta[] = [];
  if (!internet) codigos.push("sin_internet");
  if (computadora === "ninguna") codigos.push("sin_computador");
  if (horas === "menos5" || horas === "5a10") codigos.push("pocas_horas");
  if (edad > cfg.edad.alertaMayorDe) codigos.push("edad_mayor");
  if (azar() < 0.02) codigos.push("correo_repetido");

  const _id = new ObjectId();
  const correo = `demo.${i}@ejemplo.test`;
  return {
    _id,
    demo: true,
    radicado: radicadoDe(_id, pais, convocatoria),
    convocatoria,
    pais,
    sede: sede.id,
    ciudad: otra ? "__otra__" : elegir(sede.ciudades),
    ...(otra ? { ciudadOtra: "Pueblo de prueba" } : {}),
    direccion: `Calle Falsa ${100 + (i % 900)}`,
    nombres,
    apellidos,
    tipoDocumento: cfg.tiposDocumento[0]!.id,
    documento: String(90_000_000 + i),
    fechaNacimiento: `${anio - edad - 1}-0${1 + (i % 9)}-1${i % 9}`,
    edad,
    correo,
    whatsapp: `+59890${String(100000 + i).slice(-6)}`,
    telefonoAlterno: `+59899${String(100000 + i).slice(-6)}`,
    ...(menor ? { acudiente: { nombres: elegir(NOMBRES), apellidos: elegir(APELLIDOS), correo: `acudiente.${i}@ejemplo.test`, telefono: "+59891000000", relacion: elegir(["madre", "padre", "tutor"]) }, autorizaAcudiente: true as const } : {}),
    grado,
    ...(grado === "egresado" ? { anioEgreso: anio - 1 - Math.floor(azar() * 3) } : {}),
    promedio: Math.round((cfg.escalaNotas.min + azar() * (cfg.escalaNotas.max - cfg.escalaNotas.min)) * 10) / 10,
    institucion: `Institución de prueba ${1 + (i % 40)}`,
    internet,
    computadora,
    autonomia: elegir(["si", "algo", "no"]),
    horas,
    ocupacion: algunos(OCUPACION.map((o) => o.id).filter((o) => o !== "otro"), 2),
    emprendimiento: elegir(["si", "considerando", "no"]),
    otrasPostulaciones: elegir(["esperando", "aceptado", "no_aceptado", "no"]),
    aplicoAntes: azar() < 0.2,
    genero: elegir(GENERO).id,
    poblaciones: azar() < 0.5 ? ["ninguna"] : algunos(POBLACIONES.map((p) => p.id).filter((p) => p !== "ninguna" && p !== "otra"), 2),
    ingresos: elegir(INGRESOS).id,
    talla: elegir(TALLAS).id,
    canal,
    ...(canal === "embajador" ? { embajador: elegir(EMBAJADORES) } : {}),
    ...(canal === "otro" ? { canalOtro: "Radio local" } : {}),
    aceptaDatos: true,
    alertas: codigos.map((codigo) => ({ codigo, motivo: ALERTAS[codigo] })),
    versionAutorizacion: `${pais}-2027-provisional-1`,
    creadoEn,
    origen: azar() < 0.6 ? { utm_source: elegir(["whatsapp", "instagram", "facebook", "liceo"]) } : {},
    ipHash: "demo",
    userAgent: "semilla-demo",
  };
}

async function main() {
  const host = hostDb();
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (!local && !args.includes("--remoto")) throw new Error(`La base ${host} no es local. Si es una base de PRUEBAS, agrega --remoto.`);
  const col = await coleccion();

  if (args.includes("--borrar")) {
    const r = await col.deleteMany({ demo: true });
    console.log(`Borradas ${r.deletedCount} inscripciones de demo en ${host}.`);
    return;
  }

  const cantidad = Math.min(100_000, Math.max(1, Number(args.find((a) => /^\d+$/.test(a)) ?? 3000)));
  const convocatoria = process.env.CONVOCATORIA_ID ?? "jc-2027";
  // Documentos que no choquen con una semilla anterior.
  const base = (await col.countDocuments({ demo: true })) + 1;
  const ahora = Date.now();
  const docs = Array.from({ length: cantidad }, (_, k) => inscripcionFalsa(base + k, ahora, convocatoria));
  for (let i = 0; i < docs.length; i += 1000) await col.insertMany(docs.slice(i, i + 1000), { ordered: false });
  console.log(`Listo: ${cantidad} inscripciones FALSAS en ${host} (base ${process.env.MONGODB_DB}). Bórralas con --borrar.`);
}

main()
  .catch((e) => {
    console.error(`[semilla-demo] ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => cerrarDb());
