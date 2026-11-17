// /inscripcion · paso 0: elegir país. Abre desde la landing principal. Estática y sin indexar.
import { PaginaPaises, metadataInscripcion } from "@/modules/inscripcion/components/PaginaInscripcion";

export const metadata = metadataInscripcion(null);

export default function Page() {
  return <PaginaPaises />;
}
