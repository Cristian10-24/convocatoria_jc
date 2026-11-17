// /privacidad · página legal (estática). El contenido está en src/modules/legal/content/documentos.ts.
import Legal, { metadataLegal } from "@/modules/legal/components/Legal";

export const metadata = metadataLegal("privacidad");

export default function Page() {
  return <Legal documento="privacidad" />;
}
