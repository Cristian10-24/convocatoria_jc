"use client";

// Página legal (/privacidad o /terminos) con el diseño 2027: pestañas Términos / Privacidad, selector de país y
// tabla de contenido a la izquierda, y el documento a la derecha. Es un componente de cliente solo por el selector
// de país (la ley aplicable cambia con él); la página sigue saliendo estática. El país inicial puede venir en la
// dirección (?pais=uruguay); si no, Uruguay, que es el país abierto.
import Link from "next/link";
import { useEffect, useState } from "react";
import { NOMBRE_PAIS, PAISES, paisDeSegmento, type PaisSlug } from "@/shared/config/paises";
import { CONTACTO } from "@/shared/config/sitio";
import Icono from "@/shared/ui/Icono";
import { LEY_DATOS, NOTA_PROVISIONAL, PRIVACIDAD, PROVISIONAL, TERMINOS } from "../content/documentos";

const ORDEN: PaisSlug[] = ["col", "ecu", "pan", "uy"];
const fecha = (iso: string) => new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const versionLegible = (v: string) => v.replace(/^.*-(\d{4})-provisional-(\d+)$/, "Versión provisional $2 · $1");

/** Marca visible en lo que aún no está definido ("[POR CONFIRMAR]"). */
function ConMarcas({ texto }: { texto: string }) {
  const partes = texto.split(/(\[[^\]]+\])/g);
  return <>{partes.map((p, k) => (p.startsWith("[") ? <span key={k} className="falta">{p}</span> : p))}</>;
}

export default function PaginaLegal({ documento, vigente }: { documento: "privacidad" | "terminos"; vigente: string }) {
  const doc = documento === "privacidad" ? PRIVACIDAD : TERMINOS;
  const [pais, setPais] = useState<PaisSlug>("uy");
  useEffect(() => {
    const desdeUrl = paisDeSegmento(new URLSearchParams(window.location.search).get("pais") ?? "") ?? (PAISES as readonly string[]).find((p) => p === new URLSearchParams(window.location.search).get("pais"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la dirección solo existe en el navegador
    if (desdeUrl) setPais(desdeUrl as PaisSlug);
  }, []);
  const ley = LEY_DATOS[pais];
  const secciones = doc.secciones(ley, NOMBRE_PAIS[pais]);

  const selector = (
    <div className="lg-paises">
      <span id="lg-pais" style={{ fontSize: 15, fontWeight: 700 }}>País</span>
      <div role="group" aria-labelledby="lg-pais" className="lg-paises-ops">
        {ORDEN.map((p) => (
          <button key={p} className={p === pais ? "seg foco is-sel" : "seg foco"} type="button" aria-pressed={p === pais} onClick={() => setPais(p)}>{NOMBRE_PAIS[p]}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="jc lg">
      <header className="lg-cab">
        <div className="wrap lg-ancho lg-cab-in">
          <Link href="/" className="foco" style={{ display: "block" }} aria-label="Volver a la convocatoria"><img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={50} height={44} style={{ display: "block", height: 44, width: "auto" }} /></Link>
          <nav aria-label="Documentos legales" style={{ display: "flex", gap: 8 }}>
            <a className={documento === "terminos" ? "btn btn-sec btn-sm" : "btn btn-ter btn-sm"} href="/terminos" aria-current={documento === "terminos" ? "page" : undefined}>Términos</a>
            <a className={documento === "privacidad" ? "btn btn-sec btn-sm" : "btn btn-ter btn-sm"} href="/privacidad" aria-current={documento === "privacidad" ? "page" : undefined}>Privacidad</a>
          </nav>
        </div>
      </header>
      <div className="wrap lg-ancho lg-cuerpo">
        <aside className="lg-lado" aria-label="Opciones del documento">
          {doc.porPais ? selector : null}
          <nav className="lg-toc" aria-label="Contenido">
            {secciones.map((s) => <a key={s.id} href={`#${s.id}`}>{s.titulo}</a>)}
          </nav>
        </aside>
        <main className="lg-doc">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="lg-titulo">{doc.titulo}</h1>
            <div className="lg-meta">
              <span>Jóvenes creaTIvos 2027{doc.porPais ? ` · ${NOMBRE_PAIS[pais]}` : ""}</span>
              <span>{versionLegible(doc.version)}</span>
              <span>Vigente desde el {fecha(vigente)}</span>
              <span>{doc.porPais ? ley.ley : "Aplica en los 4 países"}</span>
            </div>
            <div role="note" className="lg-nota"><Icono nombre="info" /><span><strong>{PROVISIONAL}</strong> {NOTA_PROVISIONAL}</span></div>
            {/* En celular la columna lateral se oculta (como en el diseño): el selector de país pasa aquí. */}
            {doc.porPais ? <div className="lg-solo-movil">{selector}</div> : null}
          </div>
          {secciones.map((s) => (
            <section key={s.id} id={s.id} className="lg-sec" aria-live={s.id === "ley" ? "polite" : undefined}>
              <h2>{s.titulo}</h2>
              {s.parrafos.map((p) => <p key={p}><ConMarcas texto={p} /></p>)}
            </section>
          ))}
          <div className="lg-pie">
            <span style={{ flex: "1 1 280px", fontSize: 16, lineHeight: 1.5 }}>¿Preguntas sobre tus datos? Escríbenos a <a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a>.</span>
            <Link className="btn btn-sec" href="/">Volver a la convocatoria</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
