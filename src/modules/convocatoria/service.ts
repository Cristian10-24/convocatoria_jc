// "Avísame cuando abran": reglas del registro. Solo se guarda el correo (nada más) y solo mientras el país está
// en "muy pronto": con las inscripciones abiertas, cerradas o en mantenimiento no tiene sentido pedir el aviso.
// El envío del correo de apertura queda para cuando haya proveedor (interfaz Notificador).
import "server-only";
import { estadoConvocatoria } from "@/shared/config/convocatoria";
import { entorno } from "@/shared/config/env";
import type { PaisSlug } from "@/shared/config/paises";
import { hashIp } from "@/shared/security/hash";
import { correoValido, normalizarCorreo } from "@/shared/validation/correo";
import { guardarAviso } from "./repository";

export type ResultadoAviso = { ok: true; nuevo: boolean } | { ok: false; error: "correo" | "no_disponible" };

export async function registrarAviso(pais: PaisSlug, correoCrudo: string, ctx: { ip: string; ahora?: Date }): Promise<ResultadoAviso> {
  if (estadoConvocatoria(pais).estado !== "proxima") return { ok: false, error: "no_disponible" };
  const correo = normalizarCorreo(correoCrudo);
  if (!correoValido(correo)) return { ok: false, error: "correo" };
  const nuevo = await guardarAviso({ convocatoria: entorno().CONVOCATORIA_ID, pais, correo, creadoEn: ctx.ahora ?? new Date(), ipHash: hashIp(ctx.ip) });
  return { ok: true, nuevo };
}
