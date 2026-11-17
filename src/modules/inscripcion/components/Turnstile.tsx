"use client";

// Widget de Cloudflare Turnstile (modo explícito). Solo se muestra si hay clave de sitio; sin ella (desarrollo)
// no se renderiza nada y el servidor omite la verificación. El token sirve una sola vez: tras un envío fallido,
// el formulario llama a `reiniciar()` para pedir uno nuevo.
// Docs: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Api = {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window { turnstile?: Api }
}

const URL_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let cargando: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  cargando ??= new Promise<void>((resolver, rechazar) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolver();
    script.onerror = () => {
      cargando = null;
      rechazar(new Error("No se pudo cargar Turnstile"));
    };
    document.head.appendChild(script);
  });
  return cargando;
}

export type ControlTurnstile = { reiniciar: () => void };

type Props = { claveSitio: string; onToken: (token: string | null) => void; etiqueta: string };

const Turnstile = forwardRef<ControlTurnstile, Props>(function Turnstile({ claveSitio, onToken, etiqueta }, ref) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const avisar = useRef(onToken);
  useEffect(() => {
    avisar.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reiniciar() {
      avisar.current(null);
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  }));

  useEffect(() => {
    let vivo = true;
    cargarScript()
      .then(() => {
        if (!vivo || !contenedor.current || !window.turnstile) return;
        widget.current = window.turnstile.render(contenedor.current, {
          sitekey: claveSitio,
          action: "inscripcion",
          language: "es",
          appearance: "interaction-only",
          callback: (token: string) => avisar.current(token),
          "expired-callback": () => avisar.current(null),
          "error-callback": () => avisar.current(null),
        });
      })
      .catch(() => avisar.current(null));
    return () => {
      vivo = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [claveSitio]);

  return <div ref={contenedor} className="verif" aria-label={etiqueta} />;
});

export default Turnstile;
