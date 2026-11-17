// Landing de la convocatoria · Panamá. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige el país.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";

export const metadata = metadataLanding("pan");

export default function Page() {
  return <Landing pais="pan" />;
}
