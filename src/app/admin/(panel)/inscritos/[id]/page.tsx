// /admin/inscritos/<id>: detalle. Fuera del alcance del usuario responde 404, igual que si no existiera.
import { notFound } from "next/navigation";
import { alcanceDe } from "@/modules/auth/permisos";
import { exigirPagina } from "@/modules/auth/servidor";
import DetalleInscrito from "@/modules/inscripcion/components/panel/DetalleInscrito";
import { buscarInscripcion } from "@/modules/inscripcion/panel/consultas";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirPagina("ver_inscritos");
  const alcance = alcanceDe(u);
  const doc = await buscarInscripcion(alcance, (await params).id);
  if (!doc) notFound();
  return <DetalleInscrito doc={doc} verSensibles={alcance.verSensibles} />;
}
