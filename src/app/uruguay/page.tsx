// Landing de la convocatoria · Uruguay. Todo el contenido está en src/modules/convocatoria/; aquí solo se elige cuál.
// LANDING_URUGUAY_2027 (content/contenido.ts) elige entre el diseño 2027 y la landing anterior, que sigue intacta.
import Landing, { metadataLanding } from "@/modules/convocatoria/components/Landing";
import { LANDING_URUGUAY_2027 } from "@/modules/convocatoria/content/contenido";
import LandingUy2027 from "@/modules/convocatoria/uy2027/LandingUy2027";

export const metadata = metadataLanding("uy");

export default function Page() {
  return LANDING_URUGUAY_2027 ? <LandingUy2027 /> : <Landing pais="uy" />;
}
