// Landing de la convocatoria · Ecuador. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige el país.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";

export const metadata = metadataLanding("ecu");

export default function Page() {
  return <Landing pais="ecu" />;
}
