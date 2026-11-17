"use client";
// Al tocar un enlace al formulario (/inscripcion…) o uno marcado con data-utm, le agrega los utm_* y el fbclid con los
// que llegó la visita, sin pisar los que ya tenga. Así la campaña se conserva aunque la página sea estática.
import { useEffect } from "react";
import { conUtm } from "../content/acciones";

export default function ConservarUtm() {
  useEffect(() => {
    const alTocar = (e: MouseEvent) => {
      if (!window.location.search) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("/inscripcion") || a.hasAttribute("data-utm")) a.setAttribute("href", conUtm(href, window.location.search));
    };
    // En captura: el enlace ya tiene la dirección completa cuando el navegador navega (también con clic medio).
    document.addEventListener("click", alTocar, true);
    document.addEventListener("auxclick", alTocar, true);
    return () => {
      document.removeEventListener("click", alTocar, true);
      document.removeEventListener("auxclick", alTocar, true);
    };
  }, []);
  return null;
}
