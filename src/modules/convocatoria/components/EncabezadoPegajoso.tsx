"use client";

// "Postúlate" fijo ABAJO de la pantalla (pedido de coordinación 2026-11-12: que esté siempre en el campo visual).
//   1. Mientras el botón del inicio (#cta-hero) se ve, no aparece nada (no se duplica el botón).
//   2. En cuanto ese botón sale de pantalla, sube desde abajo una barra fija con logo, país y un botón grande que late.
//   La barra se queda visible hasta el final de la página (el pie tiene espacio extra para que no lo tape).
// La animación es CSS (clases .pegajoso / .pegajosoOculto). Con movimiento reducido cambia sin animar.
// Escucha el scroll con requestAnimationFrame (una lectura por cuadro, pasiva) para no frenar la página.
// El nombre del archivo se conserva para no tocar importaciones; ya no es un encabezado sino una barra inferior.
import { useEffect, useState, type ReactNode } from "react";
import s from "./Convocatoria.module.css";

export default function EncabezadoPegajoso({ marca, boton }: { marca: ReactNode; boton: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cta = document.getElementById("cta-hero");
    let pendiente = false;
    const calcular = () => {
      pendiente = false;
      setVisible(cta ? cta.getBoundingClientRect().bottom <= 0 : true);
    };
    const alScroll = () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(calcular); }
    };
    calcular();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => { window.removeEventListener("scroll", alScroll); window.removeEventListener("resize", alScroll); };
  }, []);

  return (
    <div className={`${s.pegajoso} ${visible ? "" : s.pegajosoOculto}`} aria-hidden={!visible} inert={!visible}>
      <div className={s.pegajosoInterior}>
        <div className={s.pegajosoMarca}>{marca}</div>
        <div className={s.pegajosoBoton}>{boton}</div>
      </div>
    </div>
  );
}
