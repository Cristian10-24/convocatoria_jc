// Reglas de negocio de la inscripción (servidor): ¿está abierta?, validación completa, alertas, radicado,
// duplicados e idempotencia. No sabe nada de HTTP: la ruta /api/inscripciones traduce sus resultados.
import "server-only";
import { entorno } from "@/shared/config/env";
import { estadoConvocatoria } from "@/shared/config/convocatoria";
import type { PaisSlug } from "@/shared/config/paises";
import { hashIp } from "@/shared/security/hash";
import { notificador } from "@/shared/notificaciones/notificador";
import { hoyIso } from "@/shared/validation/fechas";
import { calcularAlertas } from "./alertas";
import type { DefinicionPais } from "./config/tipos";
import { cargarDefinicion } from "./paises/cargar";
import { radicadoDe } from "./radicado";
import * as repo from "./repository";
import { Entrada, formatoDe, revisar, type Formato } from "./schema";

export type Origen = repo.Inscripcion["origen"];

export type ContextoEnvio = {
  ip: string;
  userAgent: string;
  origen: Origen;
  idempotencia?: string;
  ahora?: Date;
};

export type ResultadoRegistro =
  | { ok: true; radicado: string; nombres: string; yaExistia: boolean }
  | { ok: false; error: "cerrada" | "mantenimiento" | "no_disponible" }
  | { ok: false; error: "datos_invalidos"; errores: Record<string, string>; paso?: string }
  | { ok: false; error: "duplicado" };

/** ¿Acepta inscripciones este país ahora? (formulario habilitado + CONVOCATORIA_CONFIG en "abierta"). */
export function aceptaInscripciones(def: DefinicionPais, ahora = Date.now()): boolean {
  return def.config.habilitado && estadoConvocatoria(def.pais, { ahora }).estado === "abierta";
}

/** Consentimientos que se guardan: qué aceptó, con la versión del texto y la fecha. */
function consentimientosDe(def: DefinicionPais, claves: string[], formato: Formato, fecha: Date): repo.Consentimiento[] {
  return claves.map((clave) => {
    // El formato anterior tenía un solo texto (y el del adulto responsable): conserva sus versiones.
    const anterior = clave === "acudiente" ? def.legal.versionAcudienteAnterior : def.legal.versionAnterior;
    const version = formato === 2 ? (def.legal.consentimientos.find((c) => c.clave === clave)?.version ?? "sin-version") : anterior;
    return { clave, respuesta: true, version, fecha };
  });
}

const MAX_REINTENTOS_RADICADO = 3;

export async function registrar(pais: PaisSlug, entrada: unknown, ctx: ContextoEnvio): Promise<ResultadoRegistro> {
  const ahora = ctx.ahora ?? new Date();
  // El estado se revisa antes de cargar nada: un país en mantenimiento o cerrado no toca su definición ni la base.
  const estado = estadoConvocatoria(pais, { ahora: ahora.getTime() }).estado;
  if (estado === "mantenimiento") return { ok: false, error: "mantenimiento" };
  if (estado !== "abierta") return { ok: false, error: "cerrada" };

  // Solo se carga la definición del país que llega. Si falla, solo ese país queda sin inscripción.
  const def = await cargarDefinicion(pais);
  if (!def) return { ok: false, error: "no_disponible" };
  if (!def.config.habilitado) return { ok: false, error: "cerrada" };

  const cfg = def.config;
  const hoy = hoyIso("America/Bogota", ahora);
  const formato = formatoDe(entrada);
  const forma = Entrada.safeParse(entrada);
  const revision = forma.success ? revisar(def, forma.data, hoy, formato) : null;
  if (!revision?.datos) {
    const errores: Record<string, string> = revision?.errores ?? {};
    if (!forma.success) for (const issue of forma.error.issues) errores[String(issue.path[0] ?? "_")] ??= issue.message;
    // Paso al que debe volver el formulario. Las casillas de autorización van al final.
    const paso = def.pasos.find((p) => p.campos.some((c) => errores[c]))?.id ?? (Object.keys(errores).length ? (formato === 2 ? "autorizacion" : "cierre") : undefined);
    return { ok: false, error: "datos_invalidos", errores, paso };
  }
  const datos = revision.datos;
  const consentimientos = consentimientosDe(def, revision.consentimientos ?? [], formato, ahora);
  const convocatoria = entorno().CONVOCATORIA_ID;

  // Reintento del mismo envío (p. ej. se cortó la conexión después de guardar): devuelve lo ya guardado.
  if (ctx.idempotencia) {
    const previo = await repo.buscarPorIdempotencia(ctx.idempotencia);
    if (previo && previo.documento === datos.documento && previo.tipoDocumento === datos.tipoDocumento) {
      return { ok: true, radicado: previo.radicado, nombres: previo.nombres, yaExistia: true };
    }
  }

  const correoRepetido = await repo.existeCorreo(convocatoria, datos.correo);
  const alertas = calcularAlertas(cfg, datos, { hoy, correoRepetido });

  for (let intento = 0; intento < MAX_REINTENTOS_RADICADO; intento++) {
    const _id = repo.nuevoId();
    const doc: repo.Inscripcion = {
      ...datos,
      _id,
      radicado: radicadoDe(_id, pais, convocatoria),
      convocatoria,
      pais,
      alertas,
      // Se conservan los dos campos de siempre (los lee el panel): versión del texto de datos y del adulto responsable.
      versionAutorizacion: consentimientos.find((c) => c.clave === "datos")?.version ?? def.legal.versionAnterior,
      versionAutorizacionAcudiente: consentimientos.find((c) => c.clave === "acudiente")?.version,
      consentimientos,
      formato,
      creadoEn: ahora,
      origen: ctx.origen,
      idempotencia: ctx.idempotencia,
      ipHash: hashIp(ctx.ip),
      userAgent: ctx.userAgent.slice(0, 200),
    };
    // Mongo no guarda `undefined` como campo, pero lo limpiamos para que el documento quede prolijo.
    for (const k of Object.keys(doc) as (keyof repo.Inscripcion)[]) if (doc[k] === undefined) delete doc[k];

    const res = await repo.insertar(doc);
    if (res.ok) {
      await notificador().inscripcionRegistrada({ radicado: doc.radicado, pais, nombres: doc.nombres, correo: doc.correo, correoAcudiente: doc.acudiente?.correo });
      return { ok: true, radicado: doc.radicado, nombres: doc.nombres, yaExistia: false };
    }
    if (res.motivo === "radicado") continue;
    // Choque de documento o de idempotencia: ¿es el mismo envío repetido (doble clic que llegó a la vez)?
    const existente = await repo.buscarPorDocumento(convocatoria, pais, datos.tipoDocumento, datos.documento);
    if (existente && ctx.idempotencia && existente.idempotencia === ctx.idempotencia) {
      return { ok: true, radicado: existente.radicado, nombres: existente.nombres, yaExistia: true };
    }
    return { ok: false, error: "duplicado" };
  }
  throw new Error("No se pudo generar un número de inscripción único");
}
