// POST /api/inscripciones: recibe una inscripción del formulario público.
// Orden (de lo más barato a lo más caro): mismo origen → tamaño y forma → señales antibots → rate limit por IP
// → Turnstile → reglas de negocio y guardado (service.ts). Responde siempre JSON y nunca se guarda en caché.
import { NextResponse } from "next/server";
import { entorno } from "@/shared/config/env";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { senalBot, CAMPO_TRAMPA } from "@/shared/security/antibots";
import { consumir } from "@/shared/security/rateLimit";
import { verificarTurnstile } from "@/shared/security/turnstile";
import { SobreEnvio, type RespuestaExito } from "@/modules/inscripcion/api";
import { registrar } from "@/modules/inscripcion/service";

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");

  const cuerpo = await leerCuerpo(req, SobreEnvio);
  if ("error" in cuerpo) return cuerpo.error;
  const sobre = cuerpo.datos;

  if (senalBot(sobre[CAMPO_TRAMPA], sobre.iniciadoEn)) return errorJson(400, "bot");

  const ip = ipCliente(req);
  try {
    const limite = await consumir("inscripcion", ip, entorno().RATE_LIMIT_INSCRIPCION);
    if (!limite.permitido) {
      const res = errorJson(429, "limite");
      res.headers.set("Retry-After", String(limite.reintentarEnSeg));
      return res;
    }

    const turnstile = await verificarTurnstile(sobre.turnstile, { ip, accion: "inscripcion", idempotencia: sobre.idempotencia });
    if (!turnstile.ok) {
      if (turnstile.motivo === "config") console.error("[inscripcion] Falta TURNSTILE_SECRET_KEY en producción");
      return errorJson(403, "verificacion");
    }

    const r = await registrar(sobre.pais, sobre.datos, {
      ip,
      userAgent: req.headers.get("user-agent") ?? "",
      origen: sobre.origen ?? {},
      idempotencia: sobre.idempotencia,
    });
    if (!r.ok) {
      if (r.error === "datos_invalidos") return errorJson(400, "datos_invalidos", { errores: r.errores, paso: r.paso });
      // País apagado o con su formulario caído: 503 solo para ese país; el navegador conserva lo escrito.
      if (r.error === "mantenimiento" || r.error === "no_disponible") {
        const res = errorJson(503, r.error);
        res.headers.set("Retry-After", "300");
        return res;
      }
      return errorJson(409, r.error);
    }
    const cuerpoOk: RespuestaExito = { radicado: r.radicado, nombres: r.nombres, yaExistia: r.yaExistia };
    return NextResponse.json(cuerpoOk, { status: r.yaExistia ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[inscripcion] Error al registrar:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
