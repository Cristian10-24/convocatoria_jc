// Landing de convocatoria · ecu. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige el país.
import ConvocatoriaPagina, { metadataPais } from "@/modules/convocatoria/components/ConvocatoriaPagina";

export const metadata = metadataPais("ecu");

export default function Page() {
  return <ConvocatoriaPagina pais="ecu" />;
}
