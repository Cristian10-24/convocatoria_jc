// Inicio: selector de país de la convocatoria.
import SelectorPaises, { metadataSelector } from "@/modules/convocatoria/components/SelectorPaises";

export const metadata = metadataSelector;

export default function Inicio() {
  return <SelectorPaises />;
}
