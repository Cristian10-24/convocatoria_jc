// Inicio: landing principal de la convocatoria 2027 (sin país). Estática.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";

export const metadata = metadataLanding(null);

export default function Inicio() {
  return <Landing pais={null} />;
}
