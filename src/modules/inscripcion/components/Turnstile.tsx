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

/**
 * `obtenerToken(espera)`: el token actual o, si todavía no llega (el widget tarda unos segundos en resolver), espera
 * a que llegue. Devuelve null si no llega en ese tiempo o si el widget falla. Cada token sirve una sola vez:
 * `reiniciar()` lo descarta y pide uno nuevo (después de cualquier envío que lo haya gastado).
 */
export type ControlTurnstile = { reiniciar: () => void; obtenerToken: (esperaMs: number) => Promise<string | null> };

type Props = { claveSitio: string; etiqueta: string };

const Turnstile = forwardRef<ControlTurnstile, Props>(function Turnstile({ claveSitio, etiqueta }, ref) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  // Quien espera un token (un envío en curso) se resuelve en cuanto llega uno nuevo o el widget falla.
  const esperando = useRef<Array<(t: string | null) => void>>([]);
  const fallo = useRef(false);
  const entregar = (t: string | null) => {
    token.current = t;
    if (t === null && !fallo.current) return;
    for (const r of esperando.current.splice(0)) r(t);
  };

  useImperativeHandle(ref, () => ({
    reiniciar() {
      token.current = null;
      fallo.current = false;
      if (widget.current) window.turnstile?.reset(widget.current);
    },
    obtenerToken(esperaMs) {
      if (token.current) return Promise.resolve(token.current);
      if (fallo.current && widget.current) {
        // El widget había fallado (red, sitio no permitido...): se intenta de nuevo antes de esperar.
        fallo.current = false;
        window.turnstile?.reset(widget.current);
      }
      return new Promise((resolver) => {
        const listo = (t: string | null) => { clearTimeout(reloj); resolver(t); };
        const reloj = setTimeout(() => {
          esperando.current = esperando.current.filter((r) => r !== listo);
          resolver(token.current);
        }, esperaMs);
        esperando.current.push(listo);
      });
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
          // Un token vencido se renueva solo (sin que la persona haga nada).
          "refresh-expired": "auto",
          callback: (t: string) => { fallo.current = false; entregar(t); },
          "expired-callback": () => { token.current = null; },
          "error-callback": () => { fallo.current = true; entregar(null); },
          "timeout-callback": () => { fallo.current = true; entregar(null); },
        });
      })
      .catch(() => { fallo.current = true; entregar(null); });
    return () => {
      vivo = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
      token.current = null;
    };
  }, [claveSitio]);

  return <div ref={contenedor} className="verif" aria-label={etiqueta} />;
});

export default Turnstile;
