// Envoltorio de servidor de las páginas legales: estilos, metadatos y la fecha de vigencia.
import type { Metadata } from "next";
import { VIGENTE_DESDE } from "@/shared/config/legal";
import { PRIVACIDAD, TERMINOS } from "../content/documentos";
import PaginaLegal from "./PaginaLegal";
import "./legal.css";

export function metadataLegal(documento: "privacidad" | "terminos"): Metadata {
  const doc = documento === "privacidad" ? PRIVACIDAD : TERMINOS;
  return {
    title: `${doc.titulo} · Jóvenes creaTIvos 2027`,
    description: documento === "privacidad" ? "Cómo usa la Fundación ROFÉ los datos de quienes se inscriben en Jóvenes creaTIvos." : "Términos y condiciones de la convocatoria Jóvenes creaTIvos 2027.",
    alternates: { canonical: `/${documento}` },
    robots: { index: true, follow: true },
  };
}

export default function Legal({ documento }: { documento: "privacidad" | "terminos" }) {
  return <PaginaLegal documento={documento} vigente={VIGENTE_DESDE} />;
}
