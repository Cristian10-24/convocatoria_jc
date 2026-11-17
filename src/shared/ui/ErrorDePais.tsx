"use client";

// Error boundary de una página de país (landing o formulario): mensaje claro con el nombre del país, botón para
// reintentar y registro del error en el log (en Vercel, la consola del navegador y el digest del servidor).
import { useEffect } from "react";
import PantallaSistema from "./PantallaSistema";

export default function ErrorDePais({ error, reset, pais, donde }: { error: Error & { digest?: string }; reset: () => void; pais: string; donde: string }) {
  useEffect(() => {
    console.error(`[${donde}] Error al mostrar la página de ${pais}:`, error.message, error.digest ? `(digest ${error.digest})` : "");
  }, [error, pais, donde]);
  return (
    <PantallaSistema
      tipo="error"
      pais={pais}
      accion={<button className="btn btn-pri btn-lg" type="button" onClick={reset}>Volver a intentar</button>}
    />
  );
}
