// Páginas de sistema del diseño 2027: 404, convocatoria cerrada, mantenimiento y error. Una sola plantilla.
// Es de servidor y no depende de ningún módulo: la usan las landings, el formulario y not-found.
import { CONTACTO } from "@/shared/config/sitio";
import Icono from "./Icono";
import "./sistema/pantalla.css";

export type TipoPantalla = "404" | "cerrada" | "mantenimiento" | "error";

const TEXTOS: Record<TipoPantalla, { chip: string; clase: string; titulo: string; texto: string; cta: string; grande: string }> = {
  "404": { chip: "Error 404", clase: "c-err", titulo: "No encontramos esta página.", texto: "Puede que el enlace esté mal escrito o que la página ya no exista. Desde la convocatoria encuentras la inscripción de tu país.", cta: "Ir a la convocatoria", grande: "404" },
  cerrada: { chip: "Convocatoria cerrada", clase: "c-cer", titulo: "La convocatoria 2027 está cerrada.", texto: "Si ya te inscribiste, tu inscripción sigue en revisión y te contactaremos por WhatsApp o correo.", cta: "Ver el programa", grande: "2027" },
  mantenimiento: { chip: "Mantenimiento", clase: "c-info", titulo: "Estamos haciendo mejoras.", texto: "La inscripción vuelve en unos minutos. Si estabas llenando el formulario, tus respuestas siguen guardadas en este dispositivo.", cta: "Volver a intentar", grande: "···" },
  error: { chip: "Algo falló", clase: "c-err", titulo: "No pudimos mostrar esta página.", texto: "Es un problema nuestro, no tuyo. Intenta de nuevo en unos minutos; si estabas llenando el formulario, tus respuestas siguen guardadas en este dispositivo.", cta: "Volver a intentar", grande: "···" },
};

export default function PantallaSistema({ tipo, pais, inicio = "/", detalle, accion }: {
  tipo: TipoPantalla;
  /** Nombre del país, para que el mensaje diga a quién afecta ("Uruguay"). */
  pais?: string;
  /** A dónde lleva el logo y el botón principal. */
  inicio?: string;
  detalle?: string;
  /** Reemplaza el botón principal (p. ej. "Reintentar" en un error boundary). */
  accion?: React.ReactNode;
}) {
  const t = TEXTOS[tipo];
  const titulo = pais && tipo === "mantenimiento" ? `Estamos haciendo mejoras en ${pais}.` : pais && tipo === "error" ? `No pudimos mostrar la página de ${pais}.` : t.titulo;
  return (
    <div className="jc ps">
      <header className="ps-cab"><div className="wrap ps-ancho"><a href={inicio} className="foco" aria-label="Ir a la convocatoria"><img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={50} height={44} /></a></div></header>
      <main className="wrap ps-ancho ps-cuerpo entra">
        <div className="ps-texto">
          <span className={`chip ${t.clase}`}>{t.chip}</span>
          <h1>{titulo}</h1>
          <p>{t.texto}</p>
          {detalle ? <div className="ps-detalle"><Icono nombre="reloj" /><span>{detalle}</span></div> : null}
          <div className="ps-botones">
            {accion ?? <a className="btn btn-pri btn-lg" href={inicio}>{t.cta}</a>}
            <a className="btn btn-ter btn-lg" href={`mailto:${CONTACTO.correo}`}>Escríbenos</a>
          </div>
        </div>
        <div aria-hidden="true" className="ps-grande"><span>{t.grande}</span></div>
      </main>
      <footer className="ps-pie"><div className="wrap ps-ancho"><span>Jóvenes creaTIvos · Fundación ROFÉ</span><a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a></div></footer>
    </div>
  );
}
