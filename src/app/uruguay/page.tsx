// Landing de la convocatoria · Uruguay. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige el país.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";

export const metadata = metadataLanding("uy");

export default function Page() {
  return <Landing pais="uy" />;
}
