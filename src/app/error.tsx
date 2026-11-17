"use client";

// Error inesperado en cualquier página que no tenga su propio manejo (las de país sí lo tienen). Queda en el log.
import { useEffect } from "react";
import PantallaSistema from "@/shared/ui/PantallaSistema";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[sitio] Error al mostrar la página:", error.message, error.digest ? `(digest ${error.digest})` : "");
  }, [error]);
  return <PantallaSistema tipo="error" accion={<button className="btn btn-pri btn-lg" type="button" onClick={reset}>Volver a intentar</button>} />;
}
