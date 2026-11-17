// Avisos, chips y marcas del sistema de diseño 2027 (sitio `.jc`). Un aviso de error se anuncia (role="alert");
// los demás son informativos (role="status" solo si aparecen después de una acción).
import type { CSSProperties, ReactNode } from "react";
import Icono, { type NombreIcono } from "./Icono";

const ICONO: Record<"privacidad" | "error" | "info", NombreIcono> = { privacidad: "escudo", error: "alerta", info: "info" };
const CLASE = { privacidad: "priv", error: "mal", info: "info" } as const;

export function Aviso({ tipo, icono, anunciar, estilo, children }: { tipo: keyof typeof CLASE; icono?: NombreIcono; anunciar?: boolean; estilo?: CSSProperties; children: ReactNode }) {
  const role = tipo === "error" ? "alert" : anunciar ? "status" : undefined;
  return (
    <div className={`aviso ${CLASE[tipo]}`} role={role} style={estilo}>
      <Icono nombre={icono ?? ICONO[tipo]} />
      <span>{children}</span>
    </div>
  );
}

/** Etiqueta corta de estado: Error 404, Convocatoria cerrada, Mantenimiento. */
export function Chip({ tono, children }: { tono: "info" | "cerrada" | "aviso"; children: ReactNode }) {
  const clase = tono === "info" ? "c-info" : tono === "cerrada" ? "c-cer" : "c-err";
  return <span className={`chip ${clase}`}>{children}</span>;
}

/** Dato que la Fundación aún no ha confirmado. Se ve a propósito, para que nadie lo publique sin revisar. */
export function Pendiente({ children }: { children: ReactNode }) {
  return <span className="falta">{children}</span>;
}

/** Barra de progreso (transform: scaleX, sin animar el ancho). */
export function Progreso({ valor, total, etiqueta }: { valor: number; total: number; etiqueta: string }) {
  const fraccion = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0;
  return (
    <div className="barra" role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={total} aria-valuenow={valor}>
      <div style={{ transform: `scaleX(${fraccion.toFixed(3)})` }} />
    </div>
  );
}
