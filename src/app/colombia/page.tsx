// Landing de la convocatoria · Colombia. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige el país.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";

export const metadata = metadataLanding("col");

export default function Page() {
  return <Landing pais="col" />;
}
