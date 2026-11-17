// Formulario de inscripción por país: /inscripcion/colombia, /inscripcion/ecuador, /inscripcion/panama, /inscripcion/uruguay.
// Las 4 páginas se generan estáticas en el build; cualquier otro segmento da 404.
import { notFound } from "next/navigation";
import PaginaInscripcion, { metadataInscripcion } from "@/modules/inscripcion/components/PaginaInscripcion";
import { PAISES, SEGMENTO_URL, paisDeSegmento } from "@/shared/config/paises";

export const dynamicParams = false;

export function generateStaticParams() {
  return PAISES.map((p) => ({ pais: SEGMENTO_URL[p] }));
}

export async function generateMetadata({ params }: { params: Promise<{ pais: string }> }) {
  const pais = paisDeSegmento((await params).pais);
  return pais ? metadataInscripcion(pais) : {};
}

export default async function Page({ params }: { params: Promise<{ pais: string }> }) {
  const pais = paisDeSegmento((await params).pais);
  if (!pais) notFound();
  return <PaginaInscripcion pais={pais} />;
}
