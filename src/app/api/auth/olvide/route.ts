// POST /api/auth/olvide: pide el enlace para restablecer la contraseña. Responde lo mismo exista o no el correo.
// El enlace se arma con la URL pública configurada (APP_URL), nunca con el Host de la petición.
import { NextResponse } from "next/server";
import { z } from "zod";
import { urlSitio } from "@/shared/config/sitio";
import { errorJson, ipCliente, leerCuerpo, mismoOrigen } from "@/shared/http/peticion";
import { solicitarEnlace } from "@/modules/auth/service";

const Forma = z.record(z.string(), z.unknown());

export async function POST(req: Request): Promise<NextResponse> {
  if (!mismoOrigen(req)) return errorJson(403, "origen");
  const cuerpo = await leerCuerpo(req, Forma);
  if ("error" in cuerpo) return cuerpo.error;
  try {
    const r = await solicitarEnlace(cuerpo.datos, { ip: ipCliente(req), origen: urlSitio() });
    if (!r.ok) {
      if (r.error === "datos_invalidos") return errorJson(400, "datos_invalidos", { errores: r.errores });
      const res = errorJson(429, "limite", { reintentarEnSeg: r.reintentarEnSeg });
      res.headers.set("Retry-After", String(r.reintentarEnSeg));
      return res;
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[auth] Error al pedir el enlace:", e instanceof Error ? e.message : e);
    return errorJson(500, "interno");
  }
}
