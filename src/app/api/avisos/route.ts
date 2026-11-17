// POST /api/avisos: "Avísame cuando abran" de la landing de un país en "muy pronto".
// Mismo orden que los demás formularios públicos: mismo origen → tamaño y forma → trampa antibots → rate limit →
// reglas del servicio. No lleva Turnstile (es un solo campo y no abre nada): lo cubren la trampa y el límite por IP.
import { NextResponse } from "next/server";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { CAMPO_TRAMPA, senalBot } from "@/shared/security/antibots";
import { consumir } from "@/shared/security/rateLimit";
import { SobreAviso } from "@/modules/convocatoria/schema";
import { registrarAviso } from "@/modules/convocatoria/service";

/** Avisos por IP cada 15 minutos (los colegios comparten IP, pero nadie pide 20 avisos seguidos). */
const LIMITE_AVISOS = 20;

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");

  const cuerpo = await leerCuerpo(req, SobreAviso);
  if ("error" in cuerpo) return cuerpo.error;
  const sobre = cuerpo.datos;

  // Solo la trampa: aquí no aplica el tiempo mínimo (un correo se llena en un segundo con el autocompletado).
  if (senalBot(sobre[CAMPO_TRAMPA], undefined)) return errorJson(400, "bot");

  const ip = ipCliente(req);
  try {
    const limite = await consumir("aviso", ip, LIMITE_AVISOS);
    if (!limite.permitido) {
      const res = errorJson(429, "limite");
      res.headers.set("Retry-After", String(limite.reintentarEnSeg));
      return res;
    }
    const r = await registrarAviso(sobre.pais, sobre.correo, { ip });
    if (!r.ok) return r.error === "correo" ? errorJson(400, "datos_invalidos", { errores: { correo: "Revisa el correo." } }) : errorJson(409, "cerrada");
    // Misma respuesta si el correo ya estaba: no se revela quién se anotó antes.
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[aviso] Error al guardar:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
