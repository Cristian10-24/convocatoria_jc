"use client";

// Formulario de inscripción por pasos. Valida cada paso con el MISMO esquema que el servidor (schema.ts), guarda un
// borrador en sessionStorage, envía una sola vez (botón bloqueado + clave de idempotencia) y muestra la confirmación.
// Se renderiza solo en el navegador (ver FormularioCliente.tsx), así puede leer el borrador al iniciar sin
// desajustes de hidratación.
import { useCallback, useEffect, useRef, useState } from "react";
import { TELEFONOS, type PaisSlug } from "@/shared/config/paises";
import { CAMPO_TRAMPA } from "@/shared/security/antibots";
import { sugerenciaCorreo } from "@/shared/validation/correo";
import { hoyIso } from "@/shared/validation/fechas";
import { RUTA_API, type RespuestaError, type RespuestaExito, type SobreEnvio } from "../api";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../borrador";
import { AUTORIZACION_ACUDIENTE, LEGAL } from "../config/legal";
import { CIUDAD_OTRA, CONFIG_PAISES } from "../config/paises";
import {
  AUTONOMIA, CANALES, COMPUTADORA, EMPRENDIMIENTO, GENERO, HORAS, INGRESOS, OCUPACION, OTRAS_POSTULACIONES, POBLACIONES,
  POBLACION_NINGUNA, PREGUNTAS, RELACION_ACUDIENTE, SI_NO, TALLAS, type IdCampo, type Paso,
} from "../config/preguntas";
import { plantilla, txt, UI } from "../config/textos";
import type { IdPaso, Opcion, TextoTrato } from "../config/tipos";
import { textoRespuesta } from "../mostrar";
import {
  camposVisibles, documentoAlEscribir, erroresDelPaso, pasosVisibles, primerPasoConErrores, revisarBorrador, sedeDe, type Borrador, type Errores,
} from "../schema";
import { CampoAceptar, CampoMultiple, CampoOpciones, CampoSelector, CampoTexto } from "./Campos";
import Confirmacion from "./Confirmacion";
import Turnstile, { type ControlTurnstile } from "./Turnstile";
import s from "./Inscripcion.module.css";

type Props = { pais: PaisSlug; anio: string; claveTurnstile?: string; rutaLanding: string };

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
function leerUtm(): SobreEnvio["origen"] {
  const p = new URLSearchParams(window.location.search);
  const origen: Record<string, string> = {};
  for (const k of UTM) {
    const v = p.get(k);
    if (v) origen[k] = v.slice(0, 100);
  }
  return origen;
}

export default function FormularioInscripcion({ pais, anio, claveTurnstile, rutaLanding }: Props) {
  const cfg = CONFIG_PAISES[pais];
  const tr = cfg.trato;
  const t = useCallback((x: Parameters<typeof txt>[0]) => txt(x, tr), [tr]);

  // Estado inicial: borrador guardado (si hay) y datos de la visita. Solo corre en el navegador.
  const [inicial] = useState(() => leerBorrador(pais));
  const [datos, setDatos] = useState<Borrador>(() => inicial?.datos ?? {});
  const [pasoId, setPasoId] = useState<IdPaso>(() => inicial?.paso ?? "ubicacion");
  const [hoy] = useState(() => hoyIso());
  const [iniciadoEn] = useState(() => Date.now());
  const [origen] = useState(leerUtm);
  const [idempotencia, setIdempotencia] = useState(() => crypto.randomUUID());
  const [trampa, setTrampa] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState<RespuestaExito | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const turnstile = useRef<ControlTurnstile>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const enfocarError = useRef(false);
  const primeraVez = useRef(true);

  const pasos = pasosVisibles(cfg, datos, hoy);
  const indice = Math.max(0, pasos.findIndex((p) => p.id === pasoId));
  const paso = pasos[indice]!;
  const visibles = camposVisibles(cfg, datos, hoy);
  const ultimo = indice === pasos.length - 1;

  // Guarda el borrador en cada cambio (hasta que se confirma).
  useEffect(() => {
    if (!exito) guardarBorrador(pais, { datos, paso: pasoId });
  }, [pais, datos, pasoId, exito]);

  // Al cambiar de paso: arriba de todo y foco en el título (lectores de pantalla anuncian el paso nuevo).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    titulo.current?.focus({ preventScroll: true });
  }, [pasoId]);

  // Tras mostrar errores: foco en el primer campo con error.
  useEffect(() => {
    if (!enfocarError.current) return;
    enfocarError.current = false;
    const primero = paso.campos.find((c) => errores[c]);
    const el = primero && document.querySelector<HTMLElement>(`[data-campo="${primero}"] input, [data-campo="${primero}"] select`);
    el?.focus();
    el?.closest("[data-campo]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errores, paso]);

  const cambiar = (campo: IdCampo, valor: string | string[] | boolean) => {
    setDatos((d) => {
      const nuevo: Borrador = { ...d, [campo]: valor };
      if (campo === "sede" && d.sede !== valor) nuevo.ciudad = "";
      return nuevo;
    });
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  const mostrarErrores = (e: Errores, mensaje: string) => {
    enfocarError.current = true;
    setErrores(e);
    setAviso(mensaje);
  };

  const irA = (id: IdPaso) => {
    setAviso(null);
    setErrores({});
    setPasoId(id);
  };

  const siguiente = () => {
    const e = erroresDelPaso(revisarBorrador(pais, datos, hoy).errores, paso);
    if (Object.keys(e).length) return mostrarErrores(e, t(UI.revisa));
    irA(pasos[indice + 1]!.id);
  };

  const enviar = async () => {
    if (enviando) return;
    const r = revisarBorrador(pais, datos, hoy);
    const conError = primerPasoConErrores(r.errores, pasos);
    if (conError) {
      setPasoId(conError.id);
      return mostrarErrores(erroresDelPaso(r.errores, conError), t(UI.revisa));
    }
    if (claveTurnstile && !token) return setAviso(t(UI.errores.verificacion));

    setEnviando(true);
    setAviso(null);
    const sobre: SobreEnvio = { pais, datos, [CAMPO_TRAMPA]: trampa, iniciadoEn, turnstile: token ?? undefined, idempotencia, origen };
    try {
      const res = await fetch(RUTA_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sobre),
        signal: AbortSignal.timeout(25_000),
      });
      const cuerpo = (await res.json().catch(() => ({ error: "interno" }))) as RespuestaExito & RespuestaError;
      if (res.ok && cuerpo.radicado) {
        borrarBorrador(pais);
        setExito(cuerpo);
        window.scrollTo({ top: 0 });
        return;
      }
      turnstile.current?.reiniciar();
      if (cuerpo.error === "datos_invalidos" && cuerpo.errores) {
        const e = cuerpo.errores as Errores;
        const p = pasos.find((x) => x.id === cuerpo.paso) ?? primerPasoConErrores(e, pasos) ?? paso;
        setPasoId(p.id);
        return mostrarErrores(erroresDelPaso(e, p), t(UI.errores.datos_invalidos));
      }
      // Cualquier otro rechazo no guardó nada: un intento nuevo lleva otra clave de idempotencia.
      if (cuerpo.error !== "limite") setIdempotencia(crypto.randomUUID());
      const clave = (cuerpo.error && cuerpo.error in UI.errores ? cuerpo.error : "interno") as keyof typeof UI.errores;
      setAviso(t(UI.errores[clave]));
    } catch {
      turnstile.current?.reiniciar();
      setAviso(t(UI.errores.red));
    } finally {
      setEnviando(false);
    }
  };

  if (exito) return <Confirmacion pais={cfg.nombre} anio={anio} trato={tr} exito={exito} rutaLanding={rutaLanding} />;

  // ---------- Render de cada campo ----------
  const op = (lista: Opcion[]) => lista.map((o) => ({ id: o.id, etiqueta: t(o.etiqueta) }));
  const v = (c: IdCampo) => (datos[c] as string | undefined) ?? "";
  const pregunta = (c: IdCampo) => PREGUNTAS[c] as { etiqueta: TextoTrato; ayuda?: TextoTrato; placeholder?: string };
  const base = (c: IdCampo) => {
    const p = pregunta(c);
    return { id: c, etiqueta: t(p.etiqueta), ayuda: p.ayuda ? t(p.ayuda) : undefined, error: errores[c] };
  };
  const texto = (c: IdCampo, extra: Partial<Parameters<typeof CampoTexto>[0]> = {}) => (
    <CampoTexto key={c} {...base(c)} valor={v(c)} onCambio={(x) => cambiar(c, x)} placeholder={pregunta(c).placeholder} {...extra} />
  );
  const unica = (c: IdCampo, lista: Opcion[], enFila = false) => (
    <CampoOpciones key={c} {...base(c)} valor={v(c)} onCambio={(x) => cambiar(c, x)} opciones={op(lista)} enFila={enFila} />
  );
  const multiple = (c: IdCampo, lista: Opcion[], excluyente?: string) => (
    <CampoMultiple key={c} {...base(c)} valor={(datos[c] as string[] | undefined) ?? []} onCambio={(x) => cambiar(c, x)} opciones={op(lista)} excluyente={excluyente} />
  );
  const prefijo = `+${TELEFONOS[cfg.telefono].indicativo}`;
  const telefono = (c: IdCampo, autoCompletar?: string) =>
    texto(c, { tipo: "tel", modo: "tel", prefijo, autoCompletar, placeholder: TELEFONOS[cfg.telefono].ejemplo, maxLength: 24 });

  const sede = sedeDe(cfg, datos);
  const ciudades = cfg.sedes.find((x) => x.id === sede)?.ciudades ?? [];
  const legal = LEGAL[pais];

  const campo = (c: IdCampo) => {
    if (!visibles.has(c)) return null;
    switch (c) {
      case "sede":
        return unica("sede", cfg.sedes.map((x) => ({ id: x.id, etiqueta: x.nombre })), cfg.sedes.length <= 3);
      case "ciudad":
        return (
          <CampoSelector key={c} {...base(c)} valor={v(c)} onCambio={(x) => cambiar(c, x)} vacio={sede ? t(UI.seleccionar) : t(UI.primeroSede)}
            opciones={[...ciudades.map((x) => ({ id: x, etiqueta: x })), ...(sede ? [{ id: CIUDAD_OTRA, etiqueta: UI.ciudadOtra }] : [])]} />
        );
      case "direccion": return texto(c, { autoCompletar: "street-address", maxLength: 160 });
      case "nombres": return texto(c, { autoCompletar: "given-name", maxLength: 80 });
      case "apellidos": return texto(c, { autoCompletar: "family-name", maxLength: 80 });
      case "tipoDocumento":
        return unica(c, cfg.tiposDocumento.map((x) => ({ id: x.id, etiqueta: x.etiqueta })));
      case "documento": {
        const tipo = cfg.tiposDocumento.find((x) => x.id === datos.tipoDocumento);
        // Los caracteres que el formato no admite se descartan al escribir o pegar (ver documentoAlEscribir).
        const numerico = tipo?.regla.formato !== "alfanumerico";
        return texto(c, {
          ayuda: tipo?.ayuda, modo: numerico ? "numeric" : "text", maxLength: tipo?.regla.max ?? 20,
          onCambio: (x) => cambiar(c, documentoAlEscribir(tipo?.regla, x)),
        });
      }
      case "fechaNacimiento": return texto(c, { tipo: "date", max: hoy, autoCompletar: "bday" });
      case "correo": {
        const sugerida = sugerenciaCorreo(v(c));
        return texto(c, {
          tipo: "email", modo: "email", autoCompletar: "email",
          extra: sugerida ? (
            <div className={s.sugerencia} role="status">
              {plantilla(UI.sugerencia, { correo: sugerida })}
              <button type="button" onClick={() => cambiar(c, sugerida)}>{UI.usarSugerencia}</button>
            </div>
          ) : undefined,
        });
      }
      case "whatsapp": return telefono(c, "tel-national");
      case "telefonoAlterno": return telefono(c);
      case "acudienteCorreo": return texto(c, { tipo: "email", modo: "email" });
      case "acudienteTelefono": return telefono(c);
      case "acudienteRelacion": return unica(c, RELACION_ACUDIENTE);
      case "grado": return unica(c, cfg.grados, true);
      case "anioEgreso": return texto(c, { modo: "numeric", maxLength: 4, placeholder: hoy.slice(0, 4) });
      case "promedio":
        return texto(c, { modo: "decimal", maxLength: 5, ayuda: plantilla(UI.escala, cfg.escalaNotas) });
      case "internet": return unica(c, SI_NO, true);
      case "computadora": return unica(c, COMPUTADORA);
      case "autonomia": return unica(c, AUTONOMIA);
      case "horas": return unica(c, HORAS);
      case "ocupacion": return multiple(c, OCUPACION);
      case "emprendimiento": return unica(c, EMPRENDIMIENTO);
      case "otrasPostulaciones": return unica(c, OTRAS_POSTULACIONES);
      case "aplicoAntes": return unica(c, SI_NO, true);
      case "seleccionadoAntes": return unica(c, SI_NO, true);
      case "genero": return unica(c, GENERO);
      case "poblaciones": return multiple(c, POBLACIONES, POBLACION_NINGUNA);
      case "ingresos": return unica(c, INGRESOS);
      case "talla": return unica(c, TALLAS, true);
      case "canal": return unica(c, CANALES);
      case "aceptaDatos":
        return (
          <CampoAceptar key={c} id={c} etiqueta={t(PREGUNTAS[c].etiqueta)} error={errores[c]} valor={datos.aceptaDatos === true} onCambio={(x) => cambiar(c, x)}>
            <div className={s.legal} tabIndex={0} aria-label={legal.titulo}>
              {legal.provisional && <span className={s.provisional}>Texto provisional</span>}
              <h3>{legal.titulo}</h3>
              {legal.parrafos.map((p) => <p key={p}>{p}</p>)}
            </div>
          </CampoAceptar>
        );
      case "autorizaAcudiente":
        return (
          <CampoAceptar key={c} id={c} etiqueta={t(PREGUNTAS[c].etiqueta)} error={errores[c]} valor={datos.autorizaAcudiente === true} onCambio={(x) => cambiar(c, x)}>
            <div className={s.legal}>
              {AUTORIZACION_ACUDIENTE.provisional && <span className={s.provisional}>Texto provisional</span>}
              <p>{AUTORIZACION_ACUDIENTE.texto}</p>
            </div>
          </CampoAceptar>
        );
      default:
        return texto(c);
    }
  };

  return (
    <>
      <div className={s.progreso}>
        <div className={s.progresoTexto}>
          <b>{plantilla(UI.pasoDe, { n: indice + 1, t: pasos.length })}</b>
          <span>{Math.round(((indice + 1) / pasos.length) * 100)} %</span>
        </div>
        <div className={s.barra} role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={indice + 1} aria-label={UI.avance}>
          <i style={{ transform: `scaleX(${(indice + 1) / pasos.length})` }} />
        </div>
      </div>

      <form className={s.tarjeta} noValidate onSubmit={(e) => { e.preventDefault(); if (ultimo) void enviar(); else siguiente(); }}>
        <div className={s.tarjetaInterior}>
          <h1 ref={titulo} tabIndex={-1} className={s.titulo}>{t(paso.titulo)}</h1>
          {paso.descripcion && <p className={s.descripcion}>{t(paso.descripcion)}</p>}

          <div className={s.campos}>{paso.campos.map(campo)}</div>

          {/* Campo trampa: invisible para personas; los bots que llenan todo lo completan. */}
          <div className={s.trampa} aria-hidden>
            <label htmlFor={CAMPO_TRAMPA}>No llenar</label>
            <input id={CAMPO_TRAMPA} name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
          </div>

          {ultimo && <Resumen pasos={pasos.slice(0, -1)} datos={datos} visibles={visibles} pais={pais} onEditar={irA} trato={tr} />}
          {ultimo && claveTurnstile && (
            <div style={{ marginTop: 20 }}>
              <Turnstile ref={turnstile} claveSitio={claveTurnstile} onToken={setToken} etiqueta={UI.verificacion} />
            </div>
          )}

          {aviso && <div className={s.aviso} role="alert">{aviso}</div>}

          <div className={s.navegacion}>
            <div className={s.navegacionInterior}>
              {indice > 0 && (
                <button type="button" className={s.botonSecundario} onClick={() => irA(pasos[indice - 1]!.id)} disabled={enviando}>
                  {UI.anterior}
                </button>
              )}
              <button type="submit" className={s.boton} disabled={enviando} aria-busy={enviando || undefined}>
                {enviando ? <><span className={s.girando} aria-hidden /> {UI.enviando}</> : ultimo ? UI.enviar : UI.siguiente}
              </button>
            </div>
          </div>
        </div>
      </form>
      <p className={s.nota}>{t(UI.borrador)}</p>
    </>
  );
}

function Resumen({ pasos, datos, visibles, pais, onEditar, trato }: {
  pasos: Paso[]; datos: Borrador; visibles: Set<IdCampo>; pais: PaisSlug; onEditar: (p: IdPaso) => void; trato: "tu" | "vos";
}) {
  const cfg = CONFIG_PAISES[pais];
  return (
    <section className={s.resumen} aria-labelledby="resumen-titulo">
      <h3 id="resumen-titulo">{txt(UI.resumen, trato)}</h3>
      {pasos.map((p) => {
        const filas = p.campos
          .filter((c) => visibles.has(c) && c !== "ciudadOtra")
          .map((c) => ({ c, valor: textoRespuesta(cfg, c, c === "sede" ? { ...datos, sede: sedeDe(cfg, datos) } : datos) }))
          .filter((f) => f.valor);
        return (
          <div key={p.id} className={s.resumenGrupo}>
            <div className={s.resumenCabeza}>
              <strong>{txt(p.titulo, trato)}</strong>
              <button type="button" onClick={() => onEditar(p.id)}>{UI.editar}</button>
            </div>
            <dl>
              {filas.map((f) => (
                <div key={f.c} style={{ display: "contents" }}>
                  <dt>{txt(PREGUNTAS[f.c].etiqueta, trato)}</dt>
                  <dd>{f.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </section>
  );
}
