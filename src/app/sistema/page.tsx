// Muestra del sistema de diseño 2027. Página de trabajo: estática, sin indexar (el layout raíz ya pone noindex)
// y sin enlaces desde el sitio. Sirve para comparar cada pieza con el lienzo.
import type { Metadata } from "next";
import Muestra from "@/shared/ui/sistema/Muestra";

export const metadata: Metadata = { title: "Sistema de diseño · Jóvenes creaTIvos 2027", robots: { index: false, follow: false } };

export default function Page() {
  return <Muestra />;
}
