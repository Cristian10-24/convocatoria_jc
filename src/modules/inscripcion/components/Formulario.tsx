"use client";

// Formulario de inscripción 2027: UN solo componente para los 4 países. Dibuja la definición que recibe
// (paises/<pais>.ts) y no tiene condicionales por país: lo que cambia está en la definición.
// Valida cada paso con el MISMO validador que el servidor (schema.ts), guarda el avance en sessionStorage, envía
// una sola vez (botón bloqueado + clave de idempotencia) y, si el servidor o la conexión fallan, conserva lo
// escrito y ofrece reintentar. Se dibuja solo en el navegador (FormularioCliente.tsx) para leer el avance al iniciar.
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { TELEFONOS } from "@/shared/config/paises";
import { CONTACTO } from "@/shared/config/sitio";
import { CAMPO_TRAMPA } from "@/shared/security/antibots";
import Bandera from "@/shared/ui/Bandera";
import { CampoTelefono, CampoTexto, CasillaAcepta, GrupoOpciones, MensajeError } from "@/shared/ui/Campos";
import Icono from "@/shared/ui/Icono";
import { DURACION, curva, variantesPaso } from "@/shared/ui/movimiento";
import { sugerenciaCorreo } from "@/shared/validation/correo";
import { hoyIso } from "@/shared/validation/fechas";
import { RUTA_API, type RespuestaError, type RespuestaExito, type SobreEnvio } from "../api";
import { borrarBorrador, guardarBorrador, leerBorrador } from "../borrador";
import { IU } from "../config/interfaz";
import { plantilla, txt } from "../config/textos";
import type { DefinicionPais, TextoTrato } from "../config/tipos";
import { opcionesDe, preguntaDe, textoRespuesta } from "../mostrar";
import {
  CIUDAD_OTRA, camposVisibles, casillasConsentimiento, documentoAlEscribir, edadDe, erroresDelPaso, esMenor, pasosVisibles, primerPasoConErrores, revisarBorrador,
  type Borrador, type Errores,
} from "../schema";
import Turnstile, { type ControlTurnstile } from "./Turnstile";

type Props = { def: DefinicionPais; anio: string; claveTurnstile?: string; rutaLanding: string; paisMed: string };
type Pantalla = "formulario" | "ok" | "duplicado" | "cerradas";
type PasoVista = { id: string; titulo: TextoTrato; corto: TextoTrato; descripcion?: TextoTrato; campos: string[] };

/** UTM y fbclid con los que llegó la visita, y desde dónde abrió el formulario (viajan en la dirección). */
const ORIGEN = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "origen", "ubicacion"] as const;
function leerOrigen(): NonNullable<SobreEnvio["origen"]> {
  const p = new URLSearchParams(window.location.search);
  const origen: Record<string, string> = {};
  for (const k of ORIGEN) {
    const v = p.get(k);
    if (v) origen[k] = v.slice(0, k === "fbclid" ? 300 : k === "origen" || k === "ubicacion" ? 40 : 100);
  }
  return origen;
}

/** Cómo se dibuja cada pregunta de opciones. Lo que no está aquí es un campo de texto. */
const FORMA: Record<string, "lista" | "rejilla" | "segmentos"> = {
  sedeCercana: "lista", ciudad: "rejilla", tipoDocumento: "rejilla", acudienteRelacion: "segmentos", grado: "lista", internet: "segmentos", computadora: "lista",
  autonomia: "lista", horas: "rejilla", ocupacion: "rejilla", emprendimiento: "lista", laboral: "lista", otrasPostulaciones: "lista", aplicoAntes: "segmentos",
  seleccionadoAntes: "segmentos", genero: "rejilla", poblaciones: "rejilla", ingresos: "lista", talla: "segmentos", vivienda: "rejilla", estrato: "segmentos",
  nucleo: "segmentos", elementos: "rejilla", servicios: "rejilla", conocimiento: "segmentos", ingles: "rejilla", canal: "rejilla",
};
const VARIAS = new Set(["ocupacion", "poblaciones", "elementos", "servicios"]);
const EXCLUYENTES = ["ninguna", "prefiero_no"];
const AUTOCOMPLETAR: Record<string, string> = { nombres: "given-name", apellidos: "family-name", direccion: "street-address", ciudad: "address-level2", ciudadOtra: "address-level2", correo: "email", whatsapp: "tel-national" };
const MAXIMO: Record<string, number> = { direccion: 160, nombres: 80, apellidos: 80, institucion: 120, anioEgreso: 4, promedio: 5, lenguajes: 120, embajador: 120 };

export default function Formulario({ def, anio, claveTurnstile, rutaLanding, paisMed }: Props) {
  const { config: cfg, pais } = def;
  const tr = cfg.trato;
  const t = useCallback((x: TextoTrato) => txt(x, tr), [tr]);
  const reducir = useReducedMotion();

  // Estado inicial: avance guardado (si hay) y datos de la visita. Solo corre en el navegador.
  const [inicial] = useState(() => leerBorrador(pais));
  const [datos, setDatos] = useState<Borrador>(() => inicial?.datos ?? {});
  const [pasoId, setPasoId] = useState<string>(() => inicial?.paso ?? def.pasos[0]!.id);
  const [hoy] = useState(() => hoyIso());
  const [iniciadoEn] = useState(() => Date.now());
  const [origen] = useState(leerOrigen);
  const [idempotencia, setIdempotencia] = useState(() => crypto.randomUUID());
  const [trampa, setTrampa] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>("formulario");
  const [exito, setExito] = useState<RespuestaExito | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<"" | "radicado" | "enlace">("");
  const turnstile = useRef<ControlTurnstile>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const enfocarError = useRef(false);
  const primeraVez = useRef(true);

  // Pasos: los de la definición (el del adulto responsable solo para menores) + resumen + autorización.
  const casillas = casillasConsentimiento(def, datos, hoy, 2);
  const pasos: PasoVista[] = [
    ...pasosVisibles(def, datos, hoy),
    { id: "resumen", titulo: IU.resumen.titulo, corto: IU.resumen.corto, descripcion: IU.resumen.descripcion, campos: [] },
    { id: "autorizacion", titulo: IU.autorizacion.titulo, corto: IU.autorizacion.corto, descripcion: IU.autorizacion.descripcion, campos: casillas },
  ];
  const indice = Math.max(0, pasos.findIndex((p) => p.id === pasoId));
  const paso = pasos[indice]!;
  const visibles = camposVisibles(def, datos, hoy, 2);
  const ultimo = indice === pasos.length - 1;
  const menor = esMenor(def, datos, hoy);

  // Guarda el avance en cada cambio (hasta que se confirma la inscripción).
  useEffect(() => {
    if (pantalla === "formulario") guardarBorrador(pais, { datos, paso: pasoId });
  }, [pais, datos, pasoId, pantalla]);

  // Al cambiar de paso: arriba y foco en el título (el lector de pantalla anuncia el paso nuevo).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: reducir ? "auto" : "smooth" });
    titulo.current?.focus({ preventScroll: true });
  }, [pasoId, pantalla, reducir]);

  // Tras mostrar errores: foco en el primer campo con error.
  useEffect(() => {
    if (!enfocarError.current) return;
    enfocarError.current = false;
    const primero = paso.campos.find((c) => errores[c]);
    const el = primero ? document.querySelector<HTMLElement>(`[data-campo="${primero}"] input, [data-campo="${primero}"] select`) : null;
    el?.focus({ preventScroll: true });
    el?.closest("[data-campo]")?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "center" });
  }, [errores, paso, reducir]);

  const cambiar = (campo: string, valor: string | string[] | boolean, mas: Borrador = {}) => {
    setDatos((d) => {
      const nuevo = { ...d, [campo]: valor, ...mas } as Borrador;
      // Al cambiar de sede se limpia la ciudad elegida de la lista de la sede anterior.
      if (campo === "sede" && d.sede !== valor && def.reglas.ubicacion === "lista") nuevo.ciudad = "";
      return nuevo;
    });
    setErrores((e) => {
      if (!e[campo]) return e;
      const resto = { ...e };
      delete resto[campo];
      return resto;
    });
  };

  const mostrarErrores = (e: Errores, mensaje: string | null) => {
    enfocarError.current = true;
    setErrores(e);
    setAviso(mensaje);
  };
  const irA = (id: string) => {
    setAviso(null);
    setFallo(false);
    setErrores({});
    setPasoId(id);
  };

  const siguiente = () => {
    const e = erroresDelPaso(revisarBorrador(def, datos, hoy, 2).errores, paso);
    if (Object.keys(e).length) return mostrarErrores(e, null);
    irA(pasos[indice + 1]!.id);
  };

  const enviar = async () => {
    if (enviando) return;
    const r = revisarBorrador(def, datos, hoy, 2);
    const conError = primerPasoConErrores(r.errores, pasos);
    if (conError) {
      setPasoId(conError.id);
      return mostrarErrores(erroresDelPaso(r.errores, conError), null);
    }
    if (claveTurnstile && !token) return setAviso(t(IU.errores.verificacion));

    setEnviando(true);
    setAviso(null);
    setFallo(false);
    const sobre: SobreEnvio = { pais, datos, [CAMPO_TRAMPA]: trampa, iniciadoEn, turnstile: token ?? undefined, idempotencia, origen };
    try {
      const res = await fetch(RUTA_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sobre), signal: AbortSignal.timeout(25_000) });
      const cuerpo = (await res.json().catch(() => ({ error: "interno" }))) as RespuestaExito & RespuestaError;
      if (res.ok && cuerpo.radicado) {
        borrarBorrador(pais);
        setExito(cuerpo);
        setPantalla("ok");
        return;
      }
      turnstile.current?.reiniciar();
      if (cuerpo.error === "datos_invalidos" && cuerpo.errores) {
        const p = pasos.find((x) => x.id === cuerpo.paso) ?? primerPasoConErrores(cuerpo.errores, pasos) ?? paso;
        setPasoId(p.id);
        return mostrarErrores(erroresDelPaso(cuerpo.errores, p), t(IU.errores.datos));
      }
      if (cuerpo.error === "duplicado") return setPantalla("duplicado");
      if (cuerpo.error === "cerrada") return setPantalla("cerradas");
      if (cuerpo.error === "limite") return setAviso(t(IU.errores.limite));
      // Cualquier otro rechazo no guardó nada: un intento nuevo lleva otra clave de idempotencia.
      setIdempotencia(crypto.randomUUID());
      if (cuerpo.error === "verificacion" || cuerpo.error === "bot") return setAviso(t(IU.errores.verificacion));
      // Mantenimiento, base de datos caída o error del servidor: mensaje amable; lo escrito sigue guardado.
      setFallo(true);
    } catch {
      turnstile.current?.reiniciar();
      setFallo(true);
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async (texto: string, cual: "radicado" | "enlace") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
    } catch {
      /* sin permiso para el portapapeles: el número sigue en pantalla */
    }
  };

  // ---------- Cada campo ----------
  const valor = (c: string) => ((datos as Record<string, unknown>)[c] as string | undefined) ?? "";
  const lista = (c: string) => ((datos as Record<string, unknown>)[c] as string[] | undefined) ?? [];
  const prefijo = `+${TELEFONOS[cfg.telefono].indicativo}`;
  const opcionalDe = (c: string) => c === "laboral" || c === "lenguajes" || (c === "talla" && !def.reglas.tallaObligatoria);
  const envolver = (c: string, nodo: ReactNode) => <div key={c} data-campo={c}>{nodo}</div>;

  const campo = (c: string): ReactNode => {
    if (!visibles.has(c)) return null;
    const p = preguntaDe(def, c);
    const comun = { id: `f-${c}`, etiqueta: p.etiqueta, ayuda: p.ayuda, error: errores[c], opcional: opcionalDe(c) };
    const texto = (extra: Partial<Parameters<typeof CampoTexto>[0]> = {}) =>
      envolver(c, <CampoTexto {...comun} name={c} value={valor(c)} onChange={(e) => cambiar(c, e.target.value)} placeholder={p.placeholder} autoComplete={AUTOCOMPLETAR[c] ?? "off"} maxLength={MAXIMO[c] ?? 80} {...extra} />);
    const telefono = () =>
      envolver(c, <CampoTelefono {...comun} name={c} prefijo={prefijo} value={valor(c)} onChange={(e) => cambiar(c, e.target.value)} placeholder={TELEFONOS[cfg.telefono].ejemplo} autoComplete={AUTOCOMPLETAR[c] ?? "off"} maxLength={24} />);

    if (c === "sede") return envolver(c, <Sedes def={def} valor={valor("sede")} error={errores.sede} etiqueta={p.etiqueta} ayuda={p.ayuda} paisMed={paisMed} alElegir={(id) => cambiar("sede", id, id === CIUDAD_OTRA ? {} : { ciudadOtra: "", sedeCercana: "" })} />);
    if (c === "ciudad" && def.reglas.ubicacion === "lista") {
      const ciudades = cfg.sedes.find((s) => s.id === (cfg.sedes.length === 1 ? cfg.sedes[0]!.id : datos.sede))?.ciudades ?? [];
      if (!ciudades.length) return null;
      const opciones = [...ciudades.map((x) => ({ valor: x, etiqueta: x })), { valor: CIUDAD_OTRA, etiqueta: IU.ciudadOtraLista }];
      return envolver(c, <GrupoOpciones {...comun} opciones={opciones} forma="rejilla" valor={valor(c)} alCambiar={(v) => cambiar(c, v)} />);
    }
    if (c === "fechaNacimiento") return envolver(c, <Fecha {...comun} valor={valor(c)} hoy={hoy} alCambiar={(v) => cambiar(c, v)} nota={notaEdad()} />);
    if (c === "correo" || c === "acudienteCorreo") {
      const sugerida = c === "correo" ? sugerenciaCorreo(valor(c)) : null;
      return (
        <div key={c} data-campo={c} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <CampoTexto {...comun} name={c} type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete={AUTOCOMPLETAR[c] ?? "off"} maxLength={120} placeholder={p.placeholder} value={valor(c)} onChange={(e) => cambiar(c, e.target.value)} />
          {sugerida ? <span className="sugerencia" role="status">{plantilla(IU.sugerencia, { correo: sugerida })}<button className="btn btn-txt btn-sm" type="button" onClick={() => cambiar(c, sugerida)}>{IU.usarSugerencia}</button></span> : null}
        </div>
      );
    }
    if (c === "whatsapp" || c === "telefonoAlterno" || c === "acudienteTelefono") return telefono();
    if (c === "documento") {
      const tipo = cfg.tiposDocumento.find((x) => x.id === datos.tipoDocumento);
      // Los caracteres que el formato no admite se descartan al escribir o pegar.
      return texto({ ayuda: tipo?.ayuda ?? p.ayuda, inputMode: tipo && tipo.regla.formato !== "numerico" ? "text" : "numeric", maxLength: tipo?.regla.max ?? 20, onChange: (e) => cambiar(c, documentoAlEscribir(tipo?.regla, e.target.value)) });
    }
    if (c === "anioEgreso") return texto({ inputMode: "numeric", placeholder: `Por ejemplo: ${Number(hoy.slice(0, 4)) - 1}` });
    if (c === "promedio") return texto({ inputMode: "decimal", ayuda: plantilla(IU.escala, cfg.escalaNotas) });

    const opciones = opcionesDe(def, c);
    if (opciones && FORMA[c]) {
      // Una sola respuesta que se guarda como lista (población en los países donde es única).
      const unicaEnLista = c === "poblaciones" && def.reglas.poblacionUnica;
      const varias = VARIAS.has(c) && !unicaEnLista;
      const alCambiar = (v: string, marcado: boolean) => {
        if (unicaEnLista) return cambiar(c, [v]);
        if (!varias) return cambiar(c, v);
        const actual = lista(c);
        // "Ninguna" y "Prefiero no responder" no se combinan con otras.
        const siguienteLista = !marcado ? actual.filter((x) => x !== v) : EXCLUYENTES.includes(v) ? [v] : [...actual.filter((x) => !EXCLUYENTES.includes(x)), v];
        cambiar(c, siguienteLista);
      };
      return envolver(c, (
        <GrupoOpciones {...comun} opciones={opciones.map((o) => ({ valor: o.id, etiqueta: t(o.etiqueta) }))} tipo={varias ? "varias" : "una"} forma={FORMA[c]}
          valor={VARIAS.has(c) ? lista(c) : valor(c)} alCambiar={alCambiar} />
      ));
    }
    return texto();
  };

  function notaEdad(): string | undefined {
    const edad = edadDe(datos, hoy);
    if (edad === null || edad < cfg.edad.minima) return undefined;
    return plantilla(t(IU.edad), { edad }) + (menor ? t(IU.edadMenor) : "");
  }

  // ---------- Pantallas finales ----------
  const cabecera = (
    <header className="fh">
      <div className="wrap fw">
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <a href={rutaLanding} className="foco" style={{ display: "block", flex: "none" }} aria-label={IU.volver}><img src="/logo-jc-redondo.webp" alt="Jóvenes creaTIvos" width={58} height={52} style={{ display: "block", height: 52, width: "auto" }} /></a>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{plantilla(IU.titulo, { anio })}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "hsl(231.9 20.2% 41.8%)" }}><span className="bd"><Bandera pais={pais} /></span>{cfg.nombre}</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {pantalla === "formulario" ? <span className="guardado"><Icono nombre="visto" tam={18} estilo={{ color: "hsl(146.1 60.5% 29.8%)" }} />{IU.guardado}</span> : null}
          <a className="btn btn-ter btn-sm" href={rutaLanding} aria-label={IU.volver}><Icono nombre="flecha-atras" tam={20} /><span className="vt">{IU.volver}</span></a>
        </div>
      </div>
    </header>
  );

  if (pantalla !== "formulario") {
    const centro = { justifyContent: "center" } as const;
    return (
      <div className="jc fpg" data-pais={paisMed}>
        {cabecera}
        <main className="wrap fw fcol" style={centro}>
          {pantalla === "ok" && exito ? (
            <section className="fcard centro" aria-labelledby="t-ok">
              <div className="ok-logo" aria-hidden="true">
                {[0.25, 0.55].map((retraso) => <m.span key={retraso} initial={{ opacity: reducir ? 0 : 0.9, scale: 0.7 }} animate={{ opacity: 0, scale: 1.7 }} transition={{ duration: reducir ? 0 : DURACION.ondas, ease: curva, delay: retraso }} />)}
                <m.img src="/logo-jc-redondo.webp" alt="" width={132} height={117} initial={reducir ? false : { opacity: 0, scale: 0.6, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: DURACION.logo, ease: curva }} />
              </div>
              <h1 id="t-ok" className="ft" ref={titulo} tabIndex={-1}>{IU.ok.titulo}</h1>
              <p className="fs" style={{ margin: 0 }}>{plantilla(IU.ok.cuerpo, { nombre: exito.nombres, anio, pais: cfg.nombre })}</p>
              <div className="rad">
                <span style={{ fontSize: 14, fontWeight: 600, color: "hsl(33.2 86.2% 74.5%)" }}>{IU.ok.radicado}</span>
                <span style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, letterSpacing: ".04em", fontVariantNumeric: "tabular-nums" }}>{exito.radicado}</span>
                <button className="btn btn-ter-b btn-sm" type="button" onClick={() => copiar(exito.radicado, "radicado")}><span aria-live="polite">{copiado === "radicado" ? IU.ok.copiado : IU.ok.copiar}</span></button>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.5, color: "hsl(231.9 20.2% 41.8%)" }}>{t(IU.ok.guardar)}</p>
              <ol className="sigue">{IU.ok.pasos.map((p) => <li key={p.titulo}><span><strong>{p.titulo}</strong>{p.texto}</span></li>)}</ol>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{t(IU.ok.compartir)}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <a className="btn btn-sec" href={`https://wa.me/?text=${encodeURIComponent(`${IU.ok.mensajeCompartir} ${window.location.origin}${rutaLanding}`)}`} target="_blank" rel="noopener" data-track="compartir" data-canal="whatsapp" data-pais={paisMed}>WhatsApp</a>
                  <a className="btn btn-ter" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${rutaLanding}`)}`} target="_blank" rel="noopener" data-track="compartir" data-canal="facebook" data-pais={paisMed}>Facebook</a>
                  <button className="btn btn-ter" type="button" onClick={() => copiar(`${window.location.origin}${rutaLanding}`, "enlace")} data-track="compartir" data-canal="enlace" data-pais={paisMed}><span aria-live="polite">{copiado === "enlace" ? IU.ok.enlaceCopiado : IU.ok.enlace}</span></button>
                </div>
              </div>
              <a className="btn btn-pri btn-lg" href={rutaLanding} style={{ width: "100%" }}>{IU.volver}</a>
            </section>
          ) : pantalla === "duplicado" ? (
            <section className="fcard centro" style={{ alignItems: "flex-start", textAlign: "left" }} aria-labelledby="t-dup">
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: "hsl(218.8 68% 95.1%)", color: "hsl(221.2 71.2% 42.2%)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="documento" tam={30} /></span>
              <h1 id="t-dup" className="ft" ref={titulo} tabIndex={-1}>{t(IU.duplicado.titulo)}</h1>
              <p className="fs" style={{ margin: 0 }}>{plantilla(t(IU.duplicado.cuerpo), { anio, pais: cfg.nombre })}</p>
              <p style={{ fontSize: 16, lineHeight: 1.5 }}>{t(IU.duplicado.corregir)} <a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a> {IU.duplicado.conDocumento}</p>
              <a className="btn btn-sec btn-lg" href={rutaLanding}>{IU.volver}</a>
            </section>
          ) : (
            <Cerradas def={def} anio={anio} rutaLanding={rutaLanding} />
          )}
        </main>
      </div>
    );
  }

  // ---------- Formulario ----------
  const nErrores = Object.keys(errores).length;
  const numero = (id: string) => pasos.findIndex((p) => p.id === id) + 1;

  return (
    <div className="jc fpg" data-pais={paisMed}>
      {cabecera}
      <div className="wrap fw fprog">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontSize: 14 }}>
          <span style={{ fontWeight: 700 }}>{plantilla(IU.progreso, { n: indice + 1, t: pasos.length, paso: t(paso.corto) })}</span>
          <span style={{ color: "hsl(231.9 20.2% 41.8%)" }}>{IU.tiempo}</span>
        </div>
        <div className="fprog-b" role="progressbar" aria-label={IU.progresoAria} aria-valuemin={0} aria-valuemax={pasos.length} aria-valuenow={indice + 1}>
          <m.div initial={false} animate={{ scaleX: (indice + 1) / pasos.length }} transition={{ duration: reducir ? 0 : DURACION.barra, ease: curva }} />
        </div>
      </div>

      <div className="wrap fw fcol">
        <m.main className="fcard" initial={reducir ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURACION.entrada, ease: curva }}>
          <form noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); if (ultimo) void enviar(); else siguiente(); }}>
            <AnimatePresence mode="wait" initial={false}>
              <m.section key={paso.id} aria-labelledby="f-titulo" variants={variantesPaso(reducir)} initial="entra" animate="esta" exit="sale">
                <h1 id="f-titulo" className="ft" ref={titulo} tabIndex={-1}>{t(paso.titulo)}</h1>
                {paso.descripcion ? <p className="fs">{t(paso.descripcion)}</p> : null}

                {paso.id === "sociodemograficos" ? (
                  <div className="aviso priv"><Icono nombre="escudo" /><span><strong>{IU.privacidadTitulo}</strong> {t(IU.privacidad)} <a href="/privacidad" target="_blank" rel="noopener">{IU.privacidadEnlace}</a></span></div>
                ) : null}
                {nErrores > 0 ? (
                  <div className="aviso mal" role="alert"><Icono nombre="alerta" /><span><strong>{nErrores === 1 ? IU.falta1 : plantilla(IU.faltan, { n: nErrores })}</strong> {aviso ?? IU.marcamos}</span></div>
                ) : aviso ? (
                  <div className="aviso mal" role="alert"><Icono nombre="alerta" /><span>{aviso}</span></div>
                ) : null}

                {paso.id === "resumen" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
                    {pasos.filter((p) => p.id !== "resumen" && p.id !== "autorizacion").map((p) => (
                      <div key={p.id} className="res">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t(p.corto)}</h2>
                          <button className="btn btn-txt btn-sm" type="button" onClick={() => irA(p.id)}>{IU.editar}<span className="solo-lector"> {t(p.corto)}</span></button>
                        </div>
                        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                          {p.campos.filter((c) => visibles.has(c) && c !== "ciudadOtra").map((c) => ({ c, v: textoRespuesta(def, c, datos) })).filter((f) => f.v).map((f) => (
                            <div key={f.c} className="fila-res"><dt>{preguntaDe(def, f.c).etiqueta}</dt><dd>{f.v}</dd></div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : paso.id === "autorizacion" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 28 }}>
                    <details className="leg" open>
                      <summary>{def.legal.titulo}<Icono nombre="abajo" /></summary>
                      <div>
                        {def.legal.provisional ? <p><span className="falta">{IU.autorizacion.provisional}</span></p> : null}
                        {def.legal.parrafos.map((p) => <p key={p}>{p}</p>)}
                        <a href="/privacidad" target="_blank" rel="noopener" style={{ fontWeight: 600 }}>{IU.autorizacion.politica}</a>
                      </div>
                    </details>
                    {def.legal.consentimientos.filter((c) => casillas.includes(CASILLA[c.clave])).map((c) => {
                      const id = CASILLA[c.clave];
                      return (
                        <div key={id} data-campo={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <CasillaAcepta id={id} marcada={(datos as Record<string, unknown>)[id] === true} error={errores[id]} alCambiar={(v) => cambiar(id, v)}>
                            {c.clave === "privacidad" ? <>Leí y acepto la <a href="/privacidad" target="_blank" rel="noopener">Política de privacidad</a></> : c.texto}
                          </CasillaAcepta>
                        </div>
                      );
                    })}
                    {claveTurnstile ? <Turnstile ref={turnstile} claveSitio={claveTurnstile} onToken={setToken} etiqueta={IU.autorizacion.verificacion} /> : null}
                    {fallo ? (
                      <div className="aviso mal" role="alert" style={{ marginTop: 0 }}>
                        <Icono nombre="alerta" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <span><strong>{IU.errores.conexionTitulo}</strong> {t(IU.errores.conexion)}</span>
                          <button className="btn btn-sec btn-sm" type="button" onClick={() => void enviar()} disabled={enviando} style={{ alignSelf: "flex-start" }}>{IU.errores.reintentar}</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="campos">{paso.campos.map(campo)}</div>
                )}
              </m.section>
            </AnimatePresence>

            {/* Campo trampa: invisible para personas; los bots que llenan todo lo completan. */}
            <div className="trampa" aria-hidden="true">
              <label htmlFor={CAMPO_TRAMPA}>No llenar</label>
              <input id={CAMPO_TRAMPA} name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
            </div>

            <footer className="ff">
              {indice > 0 ? <button className="btn btn-ter" type="button" onClick={() => irA(pasos[indice - 1]!.id)} disabled={enviando}><Icono nombre="flecha-atras" tam={20} />{IU.anterior}</button> : <span />}
              {ultimo ? (
                <button className="btn btn-pri btn-lg" type="submit" aria-busy={enviando || undefined} aria-disabled={enviando || undefined} data-track="inscripcion_enviada" data-pais={paisMed}>{enviando ? IU.enviando : IU.enviar}</button>
              ) : (
                <button className="btn btn-pri btn-lg" type="submit">{IU.siguiente}<Icono nombre="flecha" clase="fl" /></button>
              )}
            </footer>
          </form>
        </m.main>

        <aside className="lado" aria-label={IU.tuInscripcion}>
          <div className="lado-c">
            <span style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{IU.tuInscripcion}</span>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {pasos.map((p, k) => (
                <li key={p.id} className={k < indice ? "pl hecho" : k === indice ? "pl actual" : "pl"} aria-current={k === indice ? "step" : undefined}>
                  <span className="num">{k < indice ? <Icono nombre="visto" tam={14} estilo={{ strokeWidth: 2.6 }} /> : numero(p.id)}</span><span>{t(p.corto)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lado-i">
            <span><Icono nombre="birrete" /><span><strong>{IU.lateral.gratis}</strong> {IU.lateral.gratisTexto}</span></span>
            <span><Icono nombre="escudo" /><span>{IU.lateral.confidencial}</span></span>
            <span><Icono nombre="sobre" /><span>{IU.lateral.dudas} <a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a></span></span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Casilla del formulario que corresponde a cada consentimiento. */
const CASILLA = { privacidad: "aceptaPrivacidad", datos: "autorizaDatos", acudiente: "autorizaAcudiente" } as const;

/** Paso de la ciudad: una opción grande por sede y, donde aplica, "Otra ciudad" (con borde punteado). */
function Sedes({ def, valor, error, etiqueta, ayuda, paisMed, alElegir }: { def: DefinicionPais; valor: string; error?: string; etiqueta: string; ayuda?: string; paisMed: string; alElegir: (id: string) => void }) {
  const libre = def.reglas.ubicacion === "libre";
  const opciones = [...def.config.sedes.map((s) => ({ id: s.id, nombre: s.nombre })), ...(libre ? [{ id: CIUDAD_OTRA, nombre: IU.otraCiudad }] : [])];
  return (
    <fieldset className="campo" aria-describedby={[ayuda ? "f-sede-ayuda" : "", error ? "f-sede-error" : ""].filter(Boolean).join(" ") || undefined}>
      <legend className="solo-lector">{etiqueta}</legend>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opciones.map((s) => (
          <label key={s.id} className={["ciu", s.id === CIUDAD_OTRA ? "otra" : "", valor === s.id ? "is-sel" : "", error ? "is-error" : ""].filter(Boolean).join(" ")}>
            <input className="solo-lector" type="radio" name="sede" value={s.id} checked={valor === s.id} onChange={() => alElegir(s.id)} data-track="ciudad_seleccionada" data-otra={s.id === CIUDAD_OTRA} data-pais={paisMed} />
            {s.nombre}
          </label>
        ))}
      </div>
      {ayuda ? <span id="f-sede-ayuda" className="ayuda" style={{ marginTop: 4 }}>{ayuda}</span> : null}
      {error ? <MensajeError id="f-sede-error">{error}</MensajeError> : null}
    </fieldset>
  );
}

/** Fecha de nacimiento con tres listas (día, mes y año): más fácil que un calendario para elegir un año lejano. */
function Fecha({ id, etiqueta, valor, error, hoy, nota, alCambiar }: { id: string; etiqueta: string; valor: string; error?: string; hoy: string; nota?: string; alCambiar: (iso: string) => void }) {
  const [partes, setPartes] = useState<[string, string, string]>(() => { const p = valor.split("-"); return p.length === 3 ? [p[0]!, p[1]!, p[2]!] : ["", "", ""]; });
  const anioHoy = Number(hoy.slice(0, 4));
  const poner = (k: 0 | 1 | 2, v: string) => {
    const n: [string, string, string] = [...partes];
    n[k] = v;
    setPartes(n);
    alCambiar(n[0] && n[1] && n[2] ? n.join("-") : "");
  };
  const clase = error ? "input is-error" : "input";
  const dos = (n: number) => String(n).padStart(2, "0");
  return (
    <fieldset className="campo" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="lbl">{etiqueta}</legend>
      <div className="fecha">
        <select className={clase} aria-label={IU.dia} autoComplete="bday-day" value={partes[2]} onChange={(e) => poner(2, e.target.value)}>
          <option value="">{IU.dia}</option>{Array.from({ length: 31 }, (_, k) => <option key={k} value={dos(k + 1)}>{k + 1}</option>)}
        </select>
        <select className={clase} aria-label={IU.mes} autoComplete="bday-month" value={partes[1]} onChange={(e) => poner(1, e.target.value)}>
          <option value="">{IU.mes}</option>{IU.meses.map((mes, k) => <option key={mes} value={dos(k + 1)}>{mes}</option>)}
        </select>
        <select className={clase} aria-label={IU.anio} autoComplete="bday-year" value={partes[0]} onChange={(e) => poner(0, e.target.value)}>
          <option value="">{IU.anio}</option>{Array.from({ length: 40 }, (_, k) => anioHoy - 10 - k).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {nota && !error ? <span className="nota" role="status"><Icono nombre="info" />{nota}</span> : null}
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </fieldset>
  );
}

/** Estado "inscripciones cerradas" (también lo usa la página cuando el país ya cerró). */
export function Cerradas({ def, anio, rutaLanding }: { def: DefinicionPais; anio: string; rutaLanding: string }) {
  const tr = def.config.trato;
  return (
    <section className="fcard centro" style={{ alignItems: "flex-start", textAlign: "left" }} aria-labelledby="t-cer">
      <span style={{ width: 64, height: 64, borderRadius: "50%", background: "hsl(231.9 22.2% 92.9%)", color: "hsl(231.9 77.1% 20.6%)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="candado" tam={30} /></span>
      <h1 id="t-cer" className="ft">{plantilla(IU.cerradas.titulo, { pais: def.config.nombre })}</h1>
      <p className="fs" style={{ margin: 0 }}>{plantilla(IU.cerradas.cuerpo, { anio })}</p>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>{txt(IU.cerradas.dudas, tr)} <a href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a> {txt(IU.cerradas.dudas2, tr)}</p>
      <a className="btn btn-sec btn-lg" href={rutaLanding}>{IU.volver}</a>
    </section>
  );
}
