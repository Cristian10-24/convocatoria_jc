// Marco de todas las páginas del panel (menos el login). Sin sesión redirige al login.
// Cada página vuelve a exigir la sesión y su permiso: el layout no siempre se re-ejecuta al navegar entre páginas.
import type { Metadata } from "next";
import MarcoPanel from "@/shared/ui/MarcoPanel";
import { NOMBRE_ROL } from "@/modules/auth/config/roles";
import BotonSalir from "@/modules/auth/components/BotonSalir";
import { puede } from "@/modules/auth/permisos";
import { exigirPagina } from "@/modules/auth/servidor";

export const metadata: Metadata = { title: "Panel · Jóvenes creaTIvos", robots: { index: false, follow: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const u = await exigirPagina("ver_panel");
  const enlaces = [
    { href: "/admin", texto: "Tablero" },
    { href: "/admin/inscritos", texto: "Inscritos" },
    ...(puede(u.rol, "gestionar_usuarios") ? [{ href: "/admin/usuarios", texto: "Usuarios" }] : []),
  ];
  return (
    <MarcoPanel enlaces={enlaces} nombre={u.nombre} rol={NOMBRE_ROL[u.rol]} acciones={<BotonSalir />}>
      {children}
    </MarcoPanel>
  );
}
