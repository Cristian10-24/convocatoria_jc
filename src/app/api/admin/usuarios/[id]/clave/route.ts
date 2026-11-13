// POST /api/admin/usuarios/<id>/clave: genera una contraseña temporal (se muestra una vez) y cierra sus sesiones.
import { NextResponse } from "next/server";
import { errorJson, mismoOrigen } from "@/shared/http/peticion";
import { restablecerClave } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const sesion = await exigirApi(req, "gestionar_usuarios");
  if ("error" in sesion) return sesion.error;
  const r = await restablecerClave((await params).id, sesion.usuario);
  if (!r.ok) return errorJson(404, "no_encontrado");
  return NextResponse.json({ ok: true, clave: r.clave }, { headers: { "Cache-Control": "no-store" } });
}
