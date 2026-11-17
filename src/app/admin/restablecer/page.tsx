// /admin/restablecer#t=…: contraseña nueva desde el enlace del correo (estática, noindex; el token no llega al servidor
// hasta que se envía el formulario).
import { metadataAcceso } from "@/modules/auth/components/PaginaLogin";
import FormularioClaveNueva from "@/modules/auth/components/FormularioClaveNueva";
import { TEXTOS_AUTH } from "@/modules/auth/config/textos";

export const metadata = { ...metadataAcceso(TEXTOS_AUTH.tituloEnlace), referrer: "no-referrer" as const };

export default function Page() {
  return <FormularioClaveNueva modo="enlace" />;
}
