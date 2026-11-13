// Detalle de una inscripción. Quien no es admin ve los datos sensibles como "reservado" (decisión F14).
import Link from "next/link";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import { TEXTOS_PANEL as T, ZONAS } from "../../config/panel";
import type { Inscripcion } from "../../repository";
import { nombreCompleto, seccionesDetalle } from "../../panel/presentacion";
import s from "./Panel.module.css";


export default function DetalleInscrito({ doc, verSensibles }: { doc: Inscripcion; verSensibles: boolean }) {
  const secciones = seccionesDetalle(doc, verSensibles);
  // Hora del país de la inscripción.
  const fecha = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short", timeZone: ZONAS[doc.pais].iana });
  const origen = Object.entries(doc.origen ?? {}).filter(([, v]) => v);
  return (
    <div className={s.raiz}>
      <div className={s.encabezado}>
        <div>
          <Link className={s.enlaceSuave} href="/admin/inscritos">
            ← {T.volver}
          </Link>
          <h1 className={s.titulo}>{nombreCompleto(doc)}</h1>
          <p className={s.subtitulo}>
            {doc.radicado} · {NOMBRE_PAIS[doc.pais]} · inscrito el {fecha.format(doc.creadoEn)} (hora de {NOMBRE_PAIS[doc.pais]})
          </p>
        </div>
      </div>

      {doc.alertas.length > 0 && (
        <section className={s.tarjeta}>
          <h2>Alertas</h2>
          <ul className={s.alertas}>
            {doc.alertas.map((a) => (
              <li key={a.codigo}>{a.motivo}</li>
            ))}
          </ul>
        </section>
      )}

      <div className={s.detalle}>
        {secciones.map((sec) => (
          <section key={sec.titulo} className={s.tarjeta}>
            <h2>{sec.titulo}</h2>
            <dl className={s.datos}>
              {sec.filas.map((f) => (
                <div key={f.etiqueta} style={{ display: "contents" }}>
                  <dt>{f.etiqueta}</dt>
                  <dd className={f.reservado ? s.reservado : undefined}>{f.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section className={s.tarjeta}>
          <h2>Registro</h2>
          <dl className={s.datos}>
            <dt>Autorización de datos</dt>
            <dd>{doc.versionAutorizacion}</dd>
            {doc.versionAutorizacionAcudiente && (
              <>
                <dt>Autorización del acudiente</dt>
                <dd>{doc.versionAutorizacionAcudiente}</dd>
              </>
            )}
            {origen.map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
