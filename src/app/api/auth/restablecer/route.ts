// POST /api/auth/restablecer: contraseña nueva con el enlace del correo (vale una vez y antes de vencer).
// Si sale bien, deja la sesión abierta.
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { RUTA_INICIO } from "@/modules/auth/config/acceso";
import { claveConEnlace } from "@/modules/auth/service";
import { nombreCookie, opcionesCookie } from "@/modules/auth/sesion";

const Forma = z.record(z.string(), z.unknown());

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const cuerpo = await leerCuerpo(req, Forma);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    const r = await claveConEnlace(cuerpo.datos, { ip: ipCliente(req) });
    if (!r.ok) return r.error === "datos_invalidos" ? errorJson(400, "datos_invalidos", { errores: r.errores }) : errorJson(410, "enlace");
    const res = NextResponse.json({ ok: true, destino: RUTA_INICIO }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(nombreCookie(), r.token, opcionesCookie());
    return res;
  } catch (e) {
    console.error("[auth] Error al restablecer la contraseña:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
