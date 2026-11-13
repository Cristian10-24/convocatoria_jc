// PATCH /api/admin/usuarios/<id>: cambia nombre, rol, países o estado (solo admin).
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { MENSAJES_AUTH } from "@/modules/auth/config/textos";
import { editarUsuario } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";

// Forma general; editarUsuario valida el detalle con EdicionUsuario.
const Cuerpo = z.record(z.string(), z.unknown());

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const sesion = await exigirApi(req, "gestionar_usuarios");
  if ("error" in sesion) return sesion.error;
  const cuerpo = await leerCuerpo(req, Cuerpo);
  if ("error" in cuerpo) return cuerpo.error;

  const r = await editarUsuario((await params).id, cuerpo.datos, sesion.usuario);
  if (r.ok) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  if (r.error === "datos_invalidos") return errorJson(400, "datos_invalidos", { errores: r.errores });
  if (r.error === "no_encontrado") return errorJson(404, "no_encontrado", { mensaje: MENSAJES_AUTH.noEncontrado });
  return errorJson(409, "sin_permiso", { mensaje: r.error === "propio" ? MENSAJES_AUTH.propio : MENSAJES_AUTH.ultimoAdmin });
}
