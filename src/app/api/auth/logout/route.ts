// POST /api/auth/logout: cierra la sesión. Solo POST y del mismo origen (un enlace o una imagen de otro sitio no
// pueden cerrarla). Sube tokenVersion, así la cookie deja de servir aunque se haya copiado, y la borra del navegador.
import { NextResponse } from "next/server";
import { errorJson, ipCliente, mismoOrigen } from "@/shared/http/peticion";
import { cerrarSesion, verificarSesion } from "@/modules/auth/service";
import { RUTA_LOGIN } from "@/modules/auth/servidor";
import { leerCookie, nombreCookie, opcionesCookie } from "@/modules/auth/sesion";

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");

  try {
    const usuario = await verificarSesion(leerCookie(req, nombreCookie()));
    if (usuario) await cerrarSesion(usuario, { ip: ipCliente(req) });
  } catch (e) {
    // Aunque falle la base, la cookie se borra igual.
    console.error("[auth] Error al cerrar sesión:", e instanceof Error ? e.message : e);
  }
  const res = NextResponse.json({ ok: true, destino: RUTA_LOGIN }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(nombreCookie(), "", opcionesCookie(0));
  return res;
}
