// POST /api/auth/login: inicia sesión en el panel.
// Orden: mismo origen → tamaño y forma → límite de intentos (por IP y por usuario) → bcrypt → cookie firmada.
// Clave incorrecta, usuario inexistente y usuario inactivo responden exactamente lo mismo.
import { NextResponse } from "next/server";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { TEXTOS_AUTH } from "@/modules/auth/config/textos";
import { Credenciales } from "@/modules/auth/schema";
import { iniciarSesion } from "@/modules/auth/service";
import { RUTA_INICIO } from "@/modules/auth/servidor";
import { nombreCookie, opcionesCookie } from "@/modules/auth/sesion";

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");

  const cuerpo = await leerCuerpo(req, Credenciales);
  if ("error" in cuerpo) return cuerpo.error;

  try {
    const r = await iniciarSesion(cuerpo.datos, { ip: ipCliente(req) });
    if (!r.ok) {
      if (r.error === "limite") {
        const res = errorJson(429, "limite", { mensaje: TEXTOS_AUTH.limite });
        res.headers.set("Retry-After", String(r.reintentarEnSeg));
        return res;
      }
      return errorJson(401, "credenciales", { mensaje: TEXTOS_AUTH.credenciales });
    }
    const res = NextResponse.json({ ok: true, destino: RUTA_INICIO }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(nombreCookie(), r.token, opcionesCookie());
    return res;
  } catch (e) {
    console.error("[auth] Error al iniciar sesión:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
