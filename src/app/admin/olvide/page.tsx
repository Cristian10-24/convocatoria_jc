// /admin/olvide: pedir el enlace para restablecer la contraseña (estática, noindex).
import { metadataAcceso } from "@/modules/auth/components/PaginaLogin";
import FormularioOlvide from "@/modules/auth/components/FormularioOlvide";
import { TEXTOS_AUTH } from "@/modules/auth/config/textos";

export const metadata = metadataAcceso(TEXTOS_AUTH.tituloOlvide);

export default function Page() {
  return <FormularioOlvide />;
}
