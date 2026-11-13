// POST /api/admin/usuarios/<id>/sesiones: cierra todas las sesiones abiertas de un usuario (p. ej. perdió su equipo).
import { NextResponse } from "next/server";
import { errorJson, mismoOrigen } from "@/shared/http/peticion";
import { revocarSesiones } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const sesion = await exigirApi(req, "gestionar_usuarios");
  if ("error" in sesion) return sesion.error;
  if (!(await revocarSesiones((await params).id, sesion.usuario.usuario))) return errorJson(404, "no_encontrado");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
