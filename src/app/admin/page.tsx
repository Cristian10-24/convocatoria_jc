// /admin: inicio del panel. Dinámica (lee la cookie de sesión); sin sesión redirige al login.
import type { Metadata } from "next";
import InicioProvisional from "@/modules/auth/components/InicioProvisional";
import { exigirPagina } from "@/modules/auth/servidor";

export const metadata: Metadata = { title: "Panel · Jóvenes creaTIvos", robots: { index: false, follow: false } };

export default async function Page() {
  const usuario = await exigirPagina("ver_panel");
  return <InicioProvisional usuario={usuario} />;
}
