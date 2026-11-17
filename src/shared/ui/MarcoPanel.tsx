// Marco común de las páginas del panel (diseño 2027, Admin*). Solo presentación: quién está conectado y qué enlaces
// ve lo decide la página (con el módulo auth); aquí solo se dibuja. Usa el sistema `.ad` (sistema/panel.css).
import Link from "next/link";
import type { ReactNode } from "react";
import NavPanel, { type EnlacePanel } from "./NavPanel";
import "./marco-panel.css";

type Props = { enlaces: EnlacePanel[]; nombre: string; rol: string; acciones?: ReactNode; children: ReactNode };

export default function MarcoPanel({ enlaces, nombre, rol, acciones, children }: Props) {
  return (
    <div className="ad marco">
      <header className="marco-barra">
        <div className="awrap marco-barra-i">
          <div className="marco-izq">
            <Link href="/admin" className="marco-marca">
              <img src="/logo-jc-redondo.webp" alt="" width={44} height={39} />
              <span>
                <b>Jóvenes creaTIvos 2027</b>
                <small>Panel de inscripciones</small>
              </span>
            </Link>
            <NavPanel enlaces={enlaces} />
          </div>
          <div className="marco-usuario">
            <span>
              <b>{nombre}</b>
              <small>{rol}</small>
            </span>
            {acciones}
          </div>
        </div>
      </header>
      <main className="awrap marco-contenido">{children}</main>
    </div>
  );
}
