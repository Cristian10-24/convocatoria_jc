// Página del formulario de un país (server component, estática). Si el país no tiene el formulario habilitado o la
// convocatoria no está abierta (CONVOCATORIA_CONFIG, leída en el build), muestra "muy pronto" o "cerradas".
// La API vuelve a revisar el estado en cada envío, así que un HTML viejo en caché no permite inscribirse fuera de plazo.
import type { Metadata } from "next";
import { entorno } from "@/shared/config/env";
import { estadoConvocatoria } from "@/shared/config/convocatoria";
import { SEGMENTO_URL, type PaisSlug } from "@/shared/config/paises";
import { CONFIG_PAISES } from "../config/paises";
import { plantilla, txt, UI } from "../config/textos";
import FormularioCliente from "./FormularioCliente";
import s from "./Inscripcion.module.css";

const anioDe = (convocatoria: string) => /(\d{4})/.exec(convocatoria)?.[1] ?? "";

export function metadataInscripcion(pais: PaisSlug): Metadata {
  const cfg = CONFIG_PAISES[pais];
  return {
    title: `Inscripción · Jóvenes creaTIvos ${anioDe(entorno().CONVOCATORIA_ID)} · ${cfg.nombre}`,
    description: `Formulario de inscripción a Jóvenes creaTIvos en ${cfg.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default function PaginaInscripcion({ pais }: { pais: PaisSlug }) {
  const cfg = CONFIG_PAISES[pais];
  const env = entorno();
  const anio = anioDe(env.CONVOCATORIA_ID);
  const rutaLanding = `/${SEGMENTO_URL[pais]}`;
  const { estado } = estadoConvocatoria(pais);
  const disponible = cfg.habilitado && estado === "abierta";
  const motivo = estado === "cerrada" ? "cerrada" : "proxima";

  return (
    <div className={s.raiz} data-pais={pais}>
      <header className={s.encabezado}>
        <a href={rutaLanding} className={s.marca}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-jc.png" alt="" className={s.logo} width={46} height={40} />
          <span className={s.marcaTexto}>
            <strong>Inscripción Jóvenes creaTIvos {anio}</strong>
            <span>{cfg.nombre}</span>
          </span>
        </a>
        <a href={rutaLanding} className={s.volver}>Ver la convocatoria</a>
      </header>

      {disponible ? (
        <FormularioCliente pais={pais} anio={anio} claveTurnstile={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} rutaLanding={rutaLanding} />
      ) : (
        <section className={s.final}>
          <div className={`${s.sello} ${s.selloEspera}`} aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
          </div>
          <h1>{UI.noDisponible[motivo].titulo}</h1>
          <p>{plantilla(txt(UI.noDisponible[motivo].cuerpo, cfg.trato), { pais: cfg.nombre })}</p>
          <a className={s.boton} href={rutaLanding}>Ver la convocatoria de {cfg.nombre}</a>
        </section>
      )}
    </div>
  );
}
