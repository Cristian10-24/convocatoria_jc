// Detalle de una inscripción (diseño 2027: AdminDetalle y AdminCoordDetalle). Quien no es admin ve los datos
// sensibles como "reservado" (decisión F14). Al final, los consentimientos: qué aceptó, versión del texto y fecha.
import Link from "next/link";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import Icono from "@/shared/ui/Icono";
import { TEXTOS_PANEL as T, ZONAS } from "../../config/panel";
import { viveEnSede } from "../../panel/consultas";
import { filasConsentimiento, nombreCompleto, seccionesDetalle, type EstadoConsentimiento } from "../../panel/presentacion";
import type { Inscripcion } from "../../repository";
import "./tablero.css";
import "./inscritos.css";

const ESTADO: Record<EstadoConsentimiento, { texto: string; clase: string }> = {
  acepto: { texto: "Aceptó", clase: "chip mini c-si" },
  no_acepto: { texto: "No aceptó", clase: "chip mini c-no" },
  no_aplica: { texto: "No aplica (mayor de edad)", clase: "chip mini c-no" },
  no_pedido: { texto: "No se pedía (formulario anterior)", clase: "chip mini c-no" },
};

// Datos de origen que se muestran, con su nombre en el panel.
const ORIGEN: [keyof Inscripcion["origen"], string][] = [
  ["utm_source", "utm_source"], ["utm_medium", "utm_medium"], ["utm_campaign", "utm_campaign"], ["origen", "Página de origen"], ["ubicacion", "Botón o enlace"],
];

export default function DetalleInscrito({ doc, verSensibles }: { doc: Inscripcion; verSensibles: boolean }) {
  const secciones = seccionesDetalle(doc, verSensibles);
  const zona = ZONAS[doc.pais].iana;
  const fecha = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short", timeZone: zona });
  const fechaHora = new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zona });
  const enSede = viveEnSede(doc);
  const origen = ORIGEN.map(([k, etiqueta]) => [etiqueta, doc.origen?.[k]] as const).filter(([, v]) => v);
  const consentimientos = filasConsentimiento(doc);
  const n = doc.alertas.length;

  return (
    <>
      <Link className="d-volver" href="/admin/inscritos">
        <Icono nombre="flecha-atras" />
        {T.volver}
      </Link>
      <div className="t-cab">
        <div>
          <h1>{nombreCompleto(doc)}</h1>
          <p>
            {doc.radicado} · {NOMBRE_PAIS[doc.pais]} · inscripción del {fecha.format(doc.creadoEn)} (hora de {NOMBRE_PAIS[doc.pais]})
          </p>
        </div>
        <span className="d-chips">
          {n ? <span className="chip c-alerta">{n === 1 ? "1 alerta" : `${n} alertas`}</span> : null}
          <span className={enSede ? "chip t-sede" : "chip t-otra"}>{enSede ? "Vive en ciudad sede" : "Vive en otra ciudad"}</span>
          {doc.acudiente ? <span className="chip c-info">Menor de edad</span> : null}
        </span>
      </div>

      {n ? (
        <div className="d-alerta" role="note">
          <Icono nombre="alerta" />
          <div>
            <b>{n === 1 ? "Alerta:" : "Alertas:"}</b>
            <ul>
              {doc.alertas.map((a) => <li key={a.codigo}>{a.motivo}</li>)}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="d-rejilla">
        {secciones.map((sec) => (
          <section key={sec.titulo} className="caja t-caja">
            <h2 className="h-caja">{sec.titulo}</h2>
            <dl className="d-datos">
              {sec.filas.map((f) => (
                <div key={f.etiqueta} className="fila-res">
                  <dt>{f.etiqueta}</dt>
                  <dd className={f.reservado ? "reservado" : undefined}>{f.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {origen.length ? (
          <section className="caja t-caja">
            <h2 className="h-caja">Registro</h2>
            <dl className="d-datos">
              {origen.map(([k, v]) => (
                <div key={k} className="fila-res">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>

      <section className="caja t-caja" aria-labelledby="t-consent">
        <div className="d-consent-cab">
          <h2 id="t-consent" className="h-caja">Consentimientos</h2>
          <small>Registro inalterable: qué aceptó, versión del texto y fecha</small>
        </div>
        <div className="tbl-marco" tabIndex={0} role="region" aria-labelledby="t-consent">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Autorización</th>
                <th scope="col">Respuesta</th>
                <th scope="col">Versión</th>
                <th scope="col">Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {consentimientos.map((c) => (
                <tr key={c.clave}>
                  <td>{c.etiqueta}</td>
                  <td><span className={ESTADO[c.estado].clase}>{ESTADO[c.estado].texto}</span></td>
                  <td>{c.version ?? "—"}</td>
                  <td className="i-num">{c.fecha ? fechaHora.format(c.fecha) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
