// 404 de todo el sitio (también para direcciones que no existen), con el diseño 2027. Next le pone noindex solo.
import type { Metadata } from "next";
import PantallaSistema from "@/shared/ui/PantallaSistema";

export const metadata: Metadata = { title: "Página no encontrada · Jóvenes creaTIvos 2027" };

export default function NoEncontrada() {
  return <PantallaSistema tipo="404" />;
}
