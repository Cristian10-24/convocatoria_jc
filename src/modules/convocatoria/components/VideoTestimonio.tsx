"use client";

// Testimonio en video sin cargar YouTube hasta que la persona lo pide: primero una miniatura,
// al tocarla se cambia por el reproductor (youtube-nocookie, sin cookies de seguimiento antes del clic).
import { useState } from "react";
import type { Testimonio } from "@/modules/convocatoria/content/contenido";
import s from "./Convocatoria.module.css";

export default function VideoTestimonio({ t, verbo }: { t: Testimonio; verbo: string }) {
  const [activo, setActivo] = useState(false);
  return (
    <figure className={s.video}>
      <div className={s.videoMarco}>
        {activo ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${t.youtubeId}?autoplay=1&rel=0`}
            title={`Testimonio de ${t.nombre}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button type="button" className={s.videoBoton} onClick={() => setActivo(true)} aria-label={`${verbo} el testimonio de ${t.nombre}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} />
            <span className={s.play} aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
          </button>
        )}
      </div>
      <figcaption>
        <strong>{t.nombre}</strong>
        <span>{t.rotulo} {t.anio} · {t.ciudad}</span>
      </figcaption>
    </figure>
  );
}
