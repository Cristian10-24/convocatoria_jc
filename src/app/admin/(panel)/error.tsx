"use client";
// Error al cargar una página del panel (diseño 2027: AdminEstados). Queda dentro del marco del panel; "Reintentar"
// vuelve a pedir los datos al servidor. No muestra el detalle técnico.
import { useEffect } from "react";
import Icono from "@/shared/ui/Icono";

export default function ErrorPanel({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[panel]", error instanceof Error ? error.message : error);
  }, [error]);
  return (
    <div className="caja estado fallo" role="alert">
      <span className="estado-icono-error">
        <Icono nombre="alerta" />
      </span>
      <h1 className="h-caja">No pudimos cargar los datos</h1>
      <p className="t-vacio">Puede ser la conexión o el servidor. Los datos no se perdieron.</p>
      <button type="button" className="btn btn-oscuro btn-sm" onClick={() => retry()}>Reintentar</button>
    </div>
  );
}
