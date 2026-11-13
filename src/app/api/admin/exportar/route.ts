// GET /api/admin/exportar?formato=xlsx|csv&<filtros>: descarga los inscritos con los filtros activos.
// Exige sesión con permiso "exportar"; el alcance por país y la regla de datos sensibles se aplican en el servidor.
// Cada descarga queda en la auditoría (quién, cuándo, con qué filtros y cuántas filas).
import { NextResponse } from "next/server";
import { ipCliente } from "@/shared/http/peticion";
import { alcanceDe } from "@/modules/auth/permisos";
import { registrarExportacion } from "@/modules/auth/service";
import { exigirApi } from "@/modules/auth/servidor";
import { inscripcionesParaExportar } from "@/modules/inscripcion/panel/consultas";
import { generarCsv, generarXlsx } from "@/modules/inscripcion/panel/exportacion";
import { aQuery, leerFiltros } from "@/modules/inscripcion/panel/filtros";

export const maxDuration = 60;

export async function GET(req: Request): Promise<NextResponse> {
  const sesion = await exigirApi(req, "exportar");
  if ("error" in sesion) return sesion.error;
  const { usuario } = sesion;

  const url = new URL(req.url);
  const formato = url.searchParams.get("formato") === "csv" ? "csv" : "xlsx";
  const filtros = leerFiltros(url.searchParams);
  const alcance = alcanceDe(usuario);
  const docs = await inscripcionesParaExportar(alcance, filtros);
  const descripcion = aQuery({ ...filtros, pagina: 1 }).slice(1);

  await registrarExportacion(usuario, `formato=${formato}; filas=${docs.length}; ${descripcion || "sin filtros"}`, ipCliente(req));

  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `inscritos-jc-${fecha}.${formato}`;
  const cabeceras = {
    "Content-Disposition": `attachment; filename="${nombre}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };

  if (formato === "csv") {
    return new NextResponse(generarCsv(docs, alcance.verSensibles), { headers: { ...cabeceras, "Content-Type": "text/csv; charset=utf-8" } });
  }
  const archivo = await generarXlsx(docs, { verSensibles: alcance.verSensibles, generadoPor: usuario.usuario, filtros: descripcion });
  return new NextResponse(new Uint8Array(archivo), {
    headers: { ...cabeceras, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  });
}
