"use client";
// Cierra la sesión con POST (nunca con un enlace GET) y vuelve al login.
import { useState } from "react";
import { TEXTOS_AUTH as T } from "../config/textos";

export default function BotonSalir() {
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    let destino = "/admin/login";
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      const cuerpo = (await res.json().catch(() => ({}))) as { destino?: string };
      if (cuerpo.destino) destino = cuerpo.destino;
    } catch {
      /* igual se va al login */
    }
    window.location.assign(destino);
  }

  return (
    <button type="button" className="btn btn-borde btn-sm" onClick={salir} disabled={saliendo}>
      {saliendo ? T.saliendo : T.salir}
    </button>
  );
}
