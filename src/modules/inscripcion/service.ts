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
import { AUTORIZACION_ACUDIENTE, LEGAL } from "./config/legal";
import { CONFIG_PAISES } from "./config/paises";
import { PASOS, type IdCampo } from "./config/preguntas";
import type { IdPaso } from "./config/tipos";
import { radicadoDe } from "./radicado";
import * as repo from "./repository";
import { esquemaInscripcion } from "./schema";

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
  | { ok: false; error: "cerrada" }
  | { ok: false; error: "datos_invalidos"; errores: Partial<Record<IdCampo, string>>; paso?: IdPaso }
  | { ok: false; error: "duplicado" };

/** ¿Acepta inscripciones este país ahora? (formulario habilitado + CONVOCATORIA_CONFIG en "abierta"). */
export function aceptaInscripciones(pais: PaisSlug, ahora = Date.now()): boolean {
  return CONFIG_PAISES[pais].habilitado && estadoConvocatoria(pais, { ahora }).estado === "abierta";
}

const MAX_REINTENTOS_RADICADO = 3;

export async function registrar(pais: PaisSlug, entrada: unknown, ctx: ContextoEnvio): Promise<ResultadoRegistro> {
  const ahora = ctx.ahora ?? new Date();
  if (!aceptaInscripciones(pais, ahora.getTime())) return { ok: false, error: "cerrada" };

  const cfg = CONFIG_PAISES[pais];
  const hoy = hoyIso("America/Bogota", ahora);
  const r = esquemaInscripcion(pais, hoy).safeParse(entrada);
  if (!r.success) {
    const errores: Partial<Record<IdCampo, string>> = {};
    for (const issue of r.error.issues) {
      const campo = String(issue.path[0] ?? "") as IdCampo;
      if (campo && !errores[campo]) errores[campo] = issue.message;
    }
    const paso = PASOS.find((p) => p.campos.some((c) => errores[c]))?.id;
    return { ok: false, error: "datos_invalidos", errores, paso };
  }
  const datos = r.data;
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
      versionAutorizacion: LEGAL[pais].version,
      versionAutorizacionAcudiente: datos.acudiente ? AUTORIZACION_ACUDIENTE.version : undefined,
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
