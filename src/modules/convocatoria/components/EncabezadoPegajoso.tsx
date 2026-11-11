"use client";

// "Postúlate" que acompaña el scroll y se convierte en encabezado fijo:
//   1. Mientras el botón del inicio (#cta-hero) se ve, no aparece nada.
//   2. Cuando ese botón sale de pantalla, baja una PASTILLA "Postúlate" arriba al centro (te sigue).
//   3. Al seguir bajando (umbral), la pastilla se ESTIRA y se vuelve una barra fija con logo, país y el botón.
// La transformación es CSS (clases .pegajoso / .pegajosoPastilla / .pegajosoBarra). Con movimiento reducido cambia sin animar.
// Escucha el scroll con requestAnimationFrame (una lectura por cuadro, pasiva) para no frenar la página.
import { useEffect, useState, type ReactNode } from "react";
import s from "./Convocatoria.module.css";

type Estado = "oculto" | "pastilla" | "barra";

/** Distancia extra (px) que hay que bajar después de perder de vista el botón del inicio para que la pastilla se vuelva barra. */
const UMBRAL_BARRA = 260;

export default function EncabezadoPegajoso({ marca, boton }: { marca: ReactNode; boton: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("oculto");

  useEffect(() => {
    const cta = document.getElementById("cta-hero");
    let pendiente = false;
    const calcular = () => {
      pendiente = false;
      const fondo = cta ? cta.getBoundingClientRect().bottom : 0;
      setEstado(fondo > 0 ? "oculto" : fondo > -UMBRAL_BARRA ? "pastilla" : "barra");
    };
    const alScroll = () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(calcular); }
    };
    calcular();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => { window.removeEventListener("scroll", alScroll); window.removeEventListener("resize", alScroll); };
  }, []);

  const clase = estado === "barra" ? s.pegajosoBarra : estado === "pastilla" ? s.pegajosoPastilla : s.pegajosoOculto;
  return (
    <div className={`${s.pegajoso} ${clase}`} aria-hidden={estado === "oculto"} inert={estado === "oculto"}>
      <div className={s.pegajosoInterior}>
        <div className={s.pegajosoMarca}>{marca}</div>
        <div className={s.pegajosoBoton}>{boton}</div>
      </div>
    </div>
  );
}
