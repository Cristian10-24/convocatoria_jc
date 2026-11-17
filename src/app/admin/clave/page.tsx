// /admin/clave: cambio obligatorio de la contraseña temporal. Fuera del grupo (panel): su layout manda aquí a quien
// tiene una temporal, así que no puede pasar por él. Sin sesión va al login; sin temporal, al tablero.
import { redirect } from "next/navigation";
import { metadataAcceso } from "@/modules/auth/components/PaginaLogin";
import FormularioClaveNueva from "@/modules/auth/components/FormularioClaveNueva";
import { RUTA_INICIO, RUTA_LOGIN } from "@/modules/auth/config/acceso";
import { TEXTOS_AUTH } from "@/modules/auth/config/textos";
import { usuarioActual } from "@/modules/auth/servidor";

export const metadata = metadataAcceso(TEXTOS_AUTH.tituloCambio);

export default async function Page() {
  const u = await usuarioActual();
  if (!u) redirect(RUTA_LOGIN);
  if (!u.debeCambiarClave) redirect(RUTA_INICIO);
  return <FormularioClaveNueva modo="cambio" />;
}
