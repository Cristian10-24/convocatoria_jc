// Marco común de las páginas del panel. Solo presentación: quién está conectado y qué enlaces ve lo decide la
// página (con el módulo auth); aquí solo se dibuja.
import Link from "next/link";
import type { ReactNode } from "react";
import NavPanel, { type EnlacePanel } from "./NavPanel";
import s from "./MarcoPanel.module.css";

type Props = { enlaces: EnlacePanel[]; nombre: string; rol: string; acciones?: ReactNode; children: ReactNode };

export default function MarcoPanel({ enlaces, nombre, rol, acciones, children }: Props) {
  return (
    <div className={s.raiz}>
      <header className={s.barra}>
        <div className={s.barraInterna}>
          <Link href="/admin" className={s.marca}>
            {/* eslint-disable-next-line @next/next/no-img-element -- logo pequeño y local */}
            <img className={s.logo} src="/logo-jc.png" alt="" width={40} height={35} />
            <span>
              <strong>Jóvenes creaTIvos 2027</strong>
              <span>Panel de inscripciones</span>
            </span>
          </Link>
          <NavPanel enlaces={enlaces} />
          <div className={s.usuario}>
            <span>
              <b>{nombre}</b>
              {rol}
            </span>
            {acciones}
          </div>
        </div>
      </header>
      <main className={s.contenido}>{children}</main>
    </div>
  );
}
