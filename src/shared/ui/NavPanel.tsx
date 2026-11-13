"use client";
// Navegación del panel: marca el enlace de la sección actual.
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./MarcoPanel.module.css";

export type EnlacePanel = { href: string; texto: string };

export default function NavPanel({ enlaces }: { enlaces: EnlacePanel[] }) {
  const ruta = usePathname();
  // La sección activa es la del enlace más largo que coincide (así /admin no queda activo en /admin/inscritos).
  const activo = enlaces
    .filter((e) => ruta === e.href || ruta.startsWith(`${e.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className={s.nav} aria-label="Secciones del panel">
      {enlaces.map((e) => (
        <Link key={e.href} href={e.href} className={`${s.enlace} ${e.href === activo ? s.activo : ""}`} aria-current={e.href === activo ? "page" : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
