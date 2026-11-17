// POST /api/admin/usuarios: crea un usuario del panel (solo admin). Responde la contraseña temporal una sola vez.
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorJson, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { MENSAJES_AUTH } from "@/modules/auth/config/textos";
import { ROLES } from "@/modules/auth/config/roles";
import { crearUsuario, generarClaveTemporal } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";

// La contraseña la genera el servidor (temporal): quien la recibe la usa para entrar.
// Se crea con el correo; el usuario (identificador interno) es opcional y, si falta, sale del correo.
const Cuerpo = z
  .object({ correo: z.string().max(120), usuario: z.string().max(60).optional(), nombre: z.string().max(120), rol: z.enum(ROLES), paises: z.array(z.string().max(4)).max(4).default([]) })
  .strict();

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const sesion = await exigirApi(req, "gestionar_usuarios");
  if ("error" in sesion) return sesion.error;
  const cuerpo = await leerCuerpo(req, Cuerpo);
  if ("error" in cuerpo) return cuerpo.error;

  const clave = generarClaveTemporal();
  const r = await crearUsuario({ ...cuerpo.datos, clave }, sesion.usuario.usuario, { claveTemporal: true });
  if (!r.ok) {
    if (r.error === "duplicado") return errorJson(409, "duplicado", { errores: { correo: MENSAJES_AUTH.duplicado } });
    return errorJson(400, "datos_invalidos", { errores: r.errores });
  }
  return NextResponse.json({ ok: true, id: r.id.toHexString(), clave }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
