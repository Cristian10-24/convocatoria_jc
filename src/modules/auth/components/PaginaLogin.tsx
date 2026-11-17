// Páginas de acceso al panel. Estáticas (no leen cookies ni la base), salvo la de cambio de contraseña, que exige
// sesión y vive en su propia ruta.
import type { Metadata } from "next";
import { TEXTOS_AUTH as T } from "../config/textos";
import FormularioLogin from "./FormularioLogin";

export const metadataAcceso = (titulo: string): Metadata => ({
  title: `${titulo} · Panel · Jóvenes creaTIvos`,
  robots: { index: false, follow: false },
});

export const metadataLogin = metadataAcceso(T.tituloLogin);

export default function PaginaLogin() {
  return <FormularioLogin />;
}
