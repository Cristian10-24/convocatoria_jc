// Marco de las pantallas de acceso al panel (ingresar, bloqueo, olvidé mi contraseña, contraseña nueva).
// Sin estado ni datos: lo usan tanto las páginas como los formularios (cliente) que cambian el título según el caso.
import type { ReactNode } from "react";
import Icono from "@/shared/ui/Icono";
import { MAX_INTENTOS, MINUTOS_BLOQUEO } from "../config/acceso";
import { TEXTOS_AUTH as T } from "../config/textos";
import "./acceso.css";

const LOGO = "/logo-jc-redondo.webp";
const FOTO = "/convocatoria/col/aula-800.webp";

type Props = { titulo: string; subtitulo?: string; children: ReactNode };

export default function PantallaAcceso({ titulo, subtitulo, children }: Props) {
  return (
    <main className="ad acceso">
      <div className="acceso-l">
        <img className="logo-caja" src={LOGO} alt="Jóvenes creaTIvos" width={108} height={96} />
        <img className="foto" src={FOTO} alt={T.altFoto} width={800} height={600} decoding="async" />
        <p>{T.pieFoto}</p>
      </div>
      <div className="acceso-r">
        <section className="acceso-c" aria-labelledby="t-acceso">
          <div className="acceso-marca">
            <img src={LOGO} alt="" width={56} height={50} />
            <span>
              <b>{T.marca}</b>
              <small>{T.marcaSub}</small>
            </span>
          </div>
          <div className="acceso-t">
            <h1 id="t-acceso">{titulo}</h1>
            {subtitulo ? <p>{subtitulo}</p> : null}
          </div>
          {children}
          <p className="acceso-nota">
            <Icono nombre="candado" />
            {T.nota.replace("{max}", String(MAX_INTENTOS)).replace("{min}", String(MINUTOS_BLOQUEO))}
          </p>
        </section>
      </div>
    </main>
  );
}
