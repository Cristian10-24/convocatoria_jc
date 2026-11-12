// Puntos de entrada para páginas y Route Handlers de Next. La verificación real ocurre aquí, junto a los datos, en
// cada petición (no hay proxy.ts: sería solo una revisión optimista y la de verdad tendría que repetirse igual).
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { errorJson } from "@/shared/http/peticion";
import type { Permiso } from "./config/roles";
import { puede } from "./permisos";
import { verificarSesion, type UsuarioSesion } from "./service";
import { leerCookie, nombreCookie } from "./sesion";

export const RUTA_LOGIN = "/admin/login";
export const RUTA_INICIO = "/admin";

/** Usuario de la sesión en Server Components. Una sola consulta por render aunque varios componentes la pidan. */
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get(nombreCookie())?.value;
  return verificarSesion(token);
});

/** Para páginas del panel: sin sesión va al login; sin el permiso, 404 (no confirma que la página exista). */
export async function exigirPagina(permiso?: Permiso): Promise<UsuarioSesion> {
  const u = await usuarioActual();
  if (!u) redirect(RUTA_LOGIN);
  if (permiso && !puede(u.rol, permiso)) notFound();
  return u;
}

/**
 * Para Route Handlers del panel:
 *   const s = await exigirApi(req, "exportar"); if ("error" in s) return s.error;
 */
export async function exigirApi(req: Request, permiso?: Permiso): Promise<{ usuario: UsuarioSesion } | { error: NextResponse }> {
  const u = await verificarSesion(leerCookie(req, nombreCookie()));
  if (!u) return { error: errorJson(401, "sesion") };
  if (permiso && !puede(u.rol, permiso)) return { error: errorJson(403, "sin_permiso") };
  return { usuario: u };
}
