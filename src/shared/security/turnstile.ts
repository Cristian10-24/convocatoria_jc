// Verificación de Cloudflare Turnstile en el servidor (siteverify).
// - En producción es obligatoria: sin TURNSTILE_SECRET_KEY el envío falla cerrado ("config").
// - En desarrollo y pruebas, sin clave se omite (para poder trabajar sin Cloudflare).
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
import "server-only";
import { entorno, esProduccion } from "@/shared/config/env";

const URL_VERIFICACION = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIEMPO_ESPERA_MS = 8_000;

export type ResultadoTurnstile =
  | { ok: true; omitido?: boolean }
  | { ok: false; motivo: "sin_token" | "invalido" | "config" | "red"; codigos?: string[] };

type Respuesta = { success: boolean; "error-codes"?: string[]; hostname?: string; action?: string };

export async function verificarTurnstile(
  token: unknown,
  opciones: { ip?: string; accion?: string; idempotencia?: string; fetchImpl?: typeof fetch } = {},
): Promise<ResultadoTurnstile> {
  const secreto = entorno().TURNSTILE_SECRET_KEY;
  if (!secreto) return esProduccion() ? { ok: false, motivo: "config" } : { ok: true, omitido: true };
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return { ok: false, motivo: "sin_token" };

  const cuerpo = new URLSearchParams({ secret: secreto, response: token });
  if (opciones.ip && opciones.ip !== "local") cuerpo.set("remoteip", opciones.ip);
  if (opciones.idempotencia) cuerpo.set("idempotency_key", opciones.idempotencia);

  try {
    const res = await (opciones.fetchImpl ?? fetch)(URL_VERIFICACION, {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
    });
    const datos = (await res.json()) as Respuesta;
    if (!datos.success) return { ok: false, motivo: "invalido", codigos: datos["error-codes"] };
    if (opciones.accion && datos.action && datos.action !== opciones.accion) return { ok: false, motivo: "invalido", codigos: ["action-mismatch"] };
    return { ok: true };
  } catch {
    return { ok: false, motivo: "red" };
  }
}
