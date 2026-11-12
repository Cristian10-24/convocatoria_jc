// Página de ingreso al panel. Estática: no lee cookies ni la base.
import type { Metadata } from "next";
import { TEXTOS_AUTH as T } from "../config/textos";
import FormularioLogin from "./FormularioLogin";
import s from "./Auth.module.css";

export const metadataLogin: Metadata = {
  title: `${T.tituloLogin} · Jóvenes creaTIvos`,
  robots: { index: false, follow: false },
};

export default function PaginaLogin() {
  return (
    <main className={s.raiz}>
      <section className={s.tarjeta}>
        <div className={s.marca}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo pequeño y local, sin optimización */}
          <img className={s.logo} src="/logo-jc.png" alt="" width={46} height={40} />
          <div>
            <h1 className={s.titulo}>{T.tituloLogin}</h1>
            <p className={s.subtitulo}>{T.subtituloLogin}</p>
          </div>
        </div>
        <FormularioLogin />
      </section>
    </main>
  );
}
