// /admin: tablero. El alcance (países, datos sensibles) sale de la sesión y se aplica en el servidor.
import { alcanceDe } from "@/modules/auth/permisos";
import { exigirPagina } from "@/modules/auth/servidor";
import Tablero from "@/modules/inscripcion/components/panel/Tablero";
import { leerFiltros } from "@/modules/inscripcion/panel/filtros";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await exigirPagina("ver_panel");
  return <Tablero alcance={alcanceDe(u)} filtros={leerFiltros(await searchParams)} />;
}
