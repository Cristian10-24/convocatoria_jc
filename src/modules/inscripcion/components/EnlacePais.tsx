"use client";

// Enlace a un país en el paso 0. Lleva consigo los datos de la visita (UTM, fbclid, origen y ubicación) que venían
// en la dirección, para que no se pierdan al pasar a la página del país.
import { useEffect, useState, type ReactNode } from "react";

const CLAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "origen", "ubicacion"];

export default function EnlacePais({ href, conOrigen, paisMed, children }: { href: string; conOrigen: boolean; paisMed: string; children: ReactNode }) {
  const [destino, setDestino] = useState(href);
  useEffect(() => {
    if (!conOrigen) return;
    const actual = new URLSearchParams(window.location.search);
    const consulta = new URLSearchParams();
    for (const k of CLAVES) {
      const v = actual.get(k);
      if (v) consulta.set(k, v);
    }
    const texto = consulta.toString();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la dirección solo existe en el navegador
    if (texto) setDestino(`${href}?${texto}`);
  }, [href, conOrigen]);
  return <a className="pb foco" href={destino} data-track="pais_seleccionado" data-pais={paisMed}>{children}</a>;
}
