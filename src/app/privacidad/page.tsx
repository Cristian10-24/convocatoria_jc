// /privacidad · Política de Tratamiento de Datos oficial (estática). El contenido está en src/modules/legal/content/documentos.ts.
import Legal, { metadataLegal } from "@/modules/legal/components/Legal";

export const metadata = metadataLegal();

export default function Page() {
  return <Legal />;
}
