// /privacidad con el diseño 2027: índice a la izquierda y el documento a la derecha. Muestra la política oficial de la
// Fundación ROFÉ (DE-010-D v1), una sola para los 4 países, con el enlace al PDF oficial bien visible y un resumen
// en lenguaje sencillo arriba. Componente de servidor: la página sale estática.
import Link from "next/link";
import { LEY_DATOS, POLITICA_OFICIAL, RESPONSABLE } from "@/shared/config/legal";
import { CONTACTO } from "@/shared/config/sitio";
import Icono from "@/shared/ui/Icono";
import { POLITICA } from "../content/documentos";

const fecha = (iso: string) => new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export default function PaginaLegal({ vigente }: { vigente: string }) {
  const doc = POLITICA;
  return (
    <div className="jc lg">
      <header className="lg-cab">
        <div className="wrap lg-ancho lg-cab-in">
          <Link href="/" className="foco" style={{ display: "block" }} aria-label="Volver a la convocatoria"><img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={50} height={44} style={{ display: "block", height: 44, width: "auto" }} /></Link>
          <Link className="btn btn-ter btn-sm" href="/">Volver a la convocatoria</Link>
        </div>
      </header>
      <div className="wrap lg-ancho lg-cuerpo">
        <aside className="lg-lado" aria-label="Contenido del documento">
          <nav className="lg-toc" aria-label="Contenido">
            <a href="#resumen">En pocas palabras</a>
            {doc.secciones.map((s) => <a key={s.id} href={`#${s.id}`}>{s.titulo}</a>)}
          </nav>
        </aside>
        <main className="lg-doc">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="lg-titulo">{doc.titulo}</h1>
            <div className="lg-meta">
              <span>{RESPONSABLE.nombre}</span>
              <span>Documento {POLITICA_OFICIAL.codigo} · versión {POLITICA_OFICIAL.version}</span>
              <span>Vigente desde el {fecha(vigente)}</span>
              <span>{LEY_DATOS.col.ley}</span>
            </div>
            <a className="lg-oficial" href={POLITICA_OFICIAL.url} target="_blank" rel="noopener">
              <Icono nombre="documento" />
              <span>{POLITICA_OFICIAL.texto}<span className="solo-lector"> (se abre en una pestaña nueva)</span></span>
            </a>
          </div>
          <section id="resumen" className="lg-sec lg-resumen" aria-labelledby="t-resumen">
            <h2 id="t-resumen">En pocas palabras</h2>
            <ul>{doc.resumen.map((p) => <li key={p}>{p}</li>)}</ul>
            <p className="lg-resumen-nota">Este resumen no reemplaza la política: el texto completo está abajo y en el documento oficial (PDF).</p>
          </section>
          {doc.secciones.map((s) => (
            <section key={s.id} id={s.id} className="lg-sec">
              <h2>{s.titulo}</h2>
              {s.parrafos?.map((p) => <p key={p}>{p}</p>)}
              {/* Listas con letras propias (a., b., …) como en el documento: sin viñeta. */}
              {s.lista ? <ul className={s.lista.every((p) => /^[a-z]\. /.test(p)) ? "lg-lista lg-letras" : "lg-lista"}>{s.lista.map((p) => <li key={p}>{p}</li>)}</ul> : null}
              {s.cierre?.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}
          <div className="lg-pie">
            <span style={{ flex: "1 1 280px", fontSize: 16, lineHeight: 1.5 }}>
              Consultas y reclamos sobre tus datos personales: <a href={`mailto:${RESPONSABLE.correo}`}>{RESPONSABLE.correo}</a>. Dudas sobre el programa o tu inscripción: <a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a>.
            </span>
            <Link className="btn btn-sec" href="/">Volver a la convocatoria</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
