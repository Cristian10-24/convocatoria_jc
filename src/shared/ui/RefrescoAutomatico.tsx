"use client";
// Vuelve a pedir la página al servidor cada cierto tiempo, solo con la pestaña visible (no gasta con la pestaña
// en segundo plano). Así el panel muestra las inscripciones nuevas sin recargar a mano.
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefrescoAutomatico({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    const alVolver = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router, segundos]);
  return null;
}
