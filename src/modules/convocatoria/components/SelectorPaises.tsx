// Selector de país (página de inicio "/"): una tarjeta por país que lleva a su landing (/col, /panama, /ecu, /uy).
// Las landings no enlazan de vuelta aquí: quien entra a la convocatoria de un país no pasa a la de otro.
import type { Metadata } from "next";
import { COHORTE, PAISES } from "@/modules/convocatoria/content/contenido";
import Bandera from "./Bandera";
import MovimientoProveedor from "./MovimientoProveedor";
import { Escalonado, ItemEscalonado, TituloPalabras, Trazos } from "./Efectos";
import s from "./Convocatoria.module.css";

export const metadataSelector: Metadata = {
  title: `Convocatoria Jóvenes creaTIvos ${COHORTE.anio} · Elige tu país`,
  description: "Aprende desarrollo de software desde cero y gratis. Convocatoria en Colombia, Panamá, Ecuador y Uruguay.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: `Convocatoria Jóvenes creaTIvos ${COHORTE.anio}`,
    description: "Beca del 100 % para aprender desarrollo de software desde cero.",
    url: "/",
    images: [{ url: `${PAISES.col.fotos.hero.src}-800.webp`, width: 800 }],
    locale: "es",
    type: "website",
  },
};

export default function SelectorPaises() {
  return (
    <MovimientoProveedor>
      <div className={s.raiz} style={{ paddingBottom: 0 }}>
        <div className={s.heroFondo} style={{ position: "absolute", inset: 0 }} aria-hidden>
          <Trazos className={s.trazos} />
        </div>
        <i className={`${s.deco} ${s.decoSol}`} aria-hidden />
        <i className={`${s.deco} ${s.decoPunto}`} aria-hidden />
        <div className={s.contenedor}>
          <header className={s.encabezado}>
            <span className={s.marca}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-jc.png" alt="Jóvenes creaTIvos" className={s.logo} width={60} height={52} />
              <span className={s.marcaTexto}>Convocatoria {COHORTE.anio}</span>
            </span>
          </header>
          <main className={s.seccion} style={{ paddingTop: 16 }}>
            <div className={s.etiqueta}>Beca del 100 % · {COHORTE.meses} meses</div>
            <TituloPalabras className={s.h1} partes={[{ texto: "Aprende" }, { texto: "desarrollo de software", resaltado: true }, { texto: "desde cero y gratis" }]} />
            <p className={s.lead}>Elige tu país para ver los requisitos, las ciudades y cómo postularte.</p>
            <Escalonado className={s.selectorGrid}>
              {Object.values(PAISES).map((p) => (
                <ItemEscalonado key={p.slug}>
                  <a href={p.ruta} className={s.tarjetaPais}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${p.fotos.hero.src}-800.webp`} alt={p.fotos.hero.alt} loading="lazy" width={800} height={600} />
                    <div className={s.tarjetaPaisCuerpo}>
                      <h2 className={s.tarjetaPaisNombre}>
                        <Bandera pais={p.slug} tamano="l" />
                        {p.nombre}
                      </h2>
                      <div className={s.tarjetaPaisSedes}>{p.sedes.join(" · ")}</div>
                      <span className={s.tarjetaPaisIr}>Ver convocatoria →</span>
                    </div>
                  </a>
                </ItemEscalonado>
              ))}
            </Escalonado>
          </main>
          <footer className={s.pie}>
            <div><strong>Fundación ROFÉ · Toca una Vida</strong> — Jóvenes creaTIvos</div>
          </footer>
        </div>
      </div>
    </MovimientoProveedor>
  );
}
