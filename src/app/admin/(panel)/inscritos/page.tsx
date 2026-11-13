// /admin/inscritos: lista paginada con búsqueda y filtros.
import { alcanceDe, puede } from "@/modules/auth/permisos";
import { exigirPagina } from "@/modules/auth/servidor";
import ListaInscritos from "@/modules/inscripcion/components/panel/ListaInscritos";
import { leerFiltros } from "@/modules/inscripcion/panel/filtros";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await exigirPagina("ver_inscritos");
  return <ListaInscritos alcance={alcanceDe(u)} filtros={leerFiltros(await searchParams)} puedeExportar={puede(u.rol, "exportar")} />;
}
