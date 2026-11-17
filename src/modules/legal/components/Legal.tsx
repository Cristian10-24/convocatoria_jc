// Envoltorio de servidor de /privacidad: estilos, metadatos y la fecha de vigencia del documento oficial.
// /terminos no tiene documento oficial todavía: redirige a /privacidad (next.config.ts).
import type { Metadata } from "next";
import { VIGENTE_DESDE } from "@/shared/config/legal";
import { POLITICA } from "../content/documentos";
import PaginaLegal from "./PaginaLegal";
import "./legal.css";

export function metadataLegal(): Metadata {
  return {
    title: `${POLITICA.titulo} · Jóvenes creaTIvos 2027`,
    description: "Política de Tratamiento de Datos de la Fundación ROFÉ (DE-010-D): cómo se usan los datos de quienes se inscriben en Jóvenes creaTIvos.",
    alternates: { canonical: "/privacidad" },
    robots: { index: true, follow: true },
  };
}

export default function Legal() {
  return <PaginaLegal vigente={VIGENTE_DESDE} />;
}
