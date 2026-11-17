// POST /api/auth/clave: cambio de contraseña con sesión (primer ingreso o contraseña temporal).
// Cierra las demás sesiones y deja una cookie nueva.
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { RUTA_INICIO } from "@/modules/auth/config/acceso";
import { cambiarClave, verificarSesion } from "@/modules/auth/service";
import { leerCookie, nombreCookie, opcionesCookie } from "@/modules/auth/sesion";

// La forma se revisa en el servicio (con mensajes por campo); aquí solo el tamaño y que sea un objeto.
const Forma = z.record(z.string(), z.unknown());

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const cuerpo = await leerCuerpo(req, Forma);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    const u = await verificarSesion(leerCookie(req, nombreCookie()));
    if (!u) return errorJson(401, "sesion");
    const r = await cambiarClave(u, cuerpo.datos, { ip: ipCliente(req) });
    if (!r.ok) return r.error === "datos_invalidos" ? errorJson(400, "datos_invalidos", { errores: r.errores }) : errorJson(401, "sesion");
    const res = NextResponse.json({ ok: true, destino: RUTA_INICIO }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(nombreCookie(), r.token, opcionesCookie());
    return res;
  } catch (e) {
    console.error("[auth] Error al cambiar la contraseña:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
