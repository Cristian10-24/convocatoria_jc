// Muestra del sistema de diseño 2027 (/sistema): cada pieza con sus estados, para comparar contra el lienzo.
// Es una página de trabajo: no se indexa ni se enlaza desde el sitio. Los datos son de ejemplo.
import type { ReactNode } from "react";
import { Aviso, Chip, Pendiente, Progreso } from "../Avisos";
import Boton from "../Boton";
import { CampoTelefono, CampoTexto, CasillaAcepta, GrupoOpciones } from "../Campos";
import Icono from "../Icono";

const COLORES: Array<[string, string]> = [
  ["--naranja", "Acción"], ["--naranja-hover", "Acción al pasar"], ["--naranja-texto", "Acento en texto"],
  ["--azul", "Azul de marca"], ["--azul-hover", "Azul al pasar"], ["--azul-linea", "Línea sobre azul"],
  ["--durazno", "Durazno"], ["--durazno-tinte", "Seleccionado"], ["--neutro", "Fondo neutro"],
  ["--texto-cuerpo", "Texto de cuerpo"], ["--texto-suave", "Texto suave"], ["--borde", "Borde"],
  ["--borde-suave", "Borde suave"], ["--error", "Error"], ["--ok", "Correcto"], ["--info", "Información"],
];

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24, padding: "48px 0", borderTop: "1px solid var(--borde-suave)" }}>
      <h2 className="h3">{titulo}</h2>
      {children}
    </section>
  );
}
const fila = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" } as const;

export default function Muestra() {
  return (
    <>
      <div className="jc">
        <main className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--texto-suave)" }}>Jóvenes creaTIvos 2027 · sistema de diseño</p>
          <h1 className="h2" style={{ marginTop: 12 }}>Sitio <span className="ac">público</span></h1>
          <p className="lead" style={{ marginTop: 16 }}>Tokens, botones, campos, tarjetas y estados del sitio, con los valores del lienzo.</p>

          <Bloque titulo="Colores">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {COLORES.map(([token, uso]) => (
                <div key={token} style={{ border: "1px solid var(--borde-suave)", borderRadius: 12, overflow: "hidden", fontSize: 13 }}>
                  <div style={{ height: 64, background: `var(${token})` }} />
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}><strong>{uso}</strong><code>{token}</code></div>
                </div>
              ))}
            </div>
          </Bloque>

          <Bloque titulo="Tipografía">
            <p className="t1">Formando talento en <span className="ac">las TIC</span></p>
            <p className="h2">Rutas de <span className="ac">aprendizaje</span></p>
            <p className="h3">Habilidades Esenciales</p>
            <p className="lead">Programa diseñado para empezar desde cero, con mentoría y acompañamiento continuo.</p>
            <p className="txt">Espacio diseñado para transformar tus ideas en proyectos viables mediante metodologías prácticas.</p>
            <p className="ft">Datos personales</p>
            <p><Pendiente>[RANGO 2027 POR CONFIRMAR]</Pendiente></p>
          </Bloque>

          <Bloque titulo="Botones">
            <div style={fila}>
              <Boton tam="lg" flecha>Inscribirme</Boton>
              <Boton>Inscribirme</Boton>
              <Boton tam="sm">Inscribirme</Boton>
              <Boton variante="oscuro">Reintentar</Boton>
              <Boton variante="borde"><Icono nombre="flecha-atras" tam={20} />Anterior</Boton>
              <Boton variante="texto" tam="sm">Editar</Boton>
              <Boton disabled>Inactivo</Boton>
              <button className="rb foco" type="button" aria-label="Foto anterior"><Icono nombre="anterior" /></button>
              <button className="rb foco" type="button" aria-label="Foto siguiente"><Icono nombre="siguiente" /></button>
            </div>
            <div className="osc" style={{ ...fila, background: "var(--azul)", padding: 24, borderRadius: 12 }}>
              <Boton tam="lg" flecha>Inscribirme</Boton>
              <Boton variante="borde-blanco" tam="lg">Entérate en redes de la próxima etapa</Boton>
            </div>
          </Bloque>

          <Bloque titulo="Campos">
            <div className="gris" style={{ padding: "clamp(16px, 3vw, 32px)", borderRadius: 14 }}>
              <div className="fcard" style={{ maxWidth: 756 }}>
                <h3 className="ft">Datos personales</h3>
                <p className="fs">Tal como aparecen en tu documento.</p>
                <Aviso tipo="error"><strong>Faltan 2 datos.</strong> Te marcamos en rojo lo que falta.</Aviso>
                <div className="campos">
                  <CampoTexto id="m-correo" etiqueta="Correo electrónico" type="email" inputMode="email" autoComplete="email" defaultValue="lucia.prueba@gmail" ayuda="Verifica que esté bien escrito: por ahí te vamos a contactar." error="Revisa el correo: parece que le falta algo (por ejemplo, @gmail.com)." />
                  <CampoTexto id="m-nombres" etiqueta="Nombres" autoComplete="given-name" defaultValue="Lucía" />
                  <CampoTexto id="m-lenguajes" etiqueta="Lenguajes de programación que manejas" placeholder="Por ejemplo: Python, JavaScript" opcional />
                  <CampoTelefono id="m-wa" etiqueta="Número de WhatsApp" prefijo="+57" placeholder="300 123 4567" autoComplete="tel-national" ayuda="Verifica que esté bien escrito." />
                  <GrupoOpciones id="m-doc" etiqueta="Tipo de identificación" forma="rejilla" valor="ti" opciones={[{ valor: "cc", etiqueta: "Cédula de Ciudadanía" }, { valor: "ti", etiqueta: "Tarjeta de identidad" }, { valor: "ce", etiqueta: "Cédula de Extranjería" }, { valor: "pas", etiqueta: "Pasaporte" }]} />
                  <GrupoOpciones id="m-internet" etiqueta="¿Tienes acceso a internet?" forma="segmentos" valor="si" opciones={[{ valor: "si", etiqueta: "Sí" }, { valor: "no", etiqueta: "No" }]} />
                  <GrupoOpciones id="m-ocupacion" etiqueta="¿Cuál es tu ocupación actual?" ayuda="Puedes elegir más de una opción." tipo="varias" forma="rejilla" valor={["estudio"]} error="Elige al menos una opción." opciones={[{ valor: "estudio", etiqueta: "Estudio" }, { valor: "trabajo", etiqueta: "Trabajo" }, { valor: "emprendo", etiqueta: "Emprendo" }, { valor: "ninguna", etiqueta: "No trabajo ni estudio ni emprendo" }]} />
                  <div className="campo">
                    <span className="lbl">Ciudad</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button className="ciu foco is-sel" type="button">Medellín</button>
                      <button className="ciu foco" type="button">Bogotá D.C.</button>
                      <button className="ciu otra foco" type="button">Otra ciudad</button>
                    </div>
                  </div>
                  <CasillaAcepta id="m-acepta-1" marcada>Leí y acepto la Política de privacidad</CasillaAcepta>
                  <CasillaAcepta id="m-acepta-2" marcada={false} error="Marca la casilla para poder enviar tu inscripción.">Autorizo el tratamiento de mis datos personales</CasillaAcepta>
                </div>
              </div>
            </div>
          </Bloque>

          <Bloque titulo="Tarjetas y estados">
            <div className="g">
              <div className="bt" style={{ gridColumn: "span 4" }}><Icono nombre="birrete" /><h3>Certificado</h3><p className="txt">Recibe una certificación oficial que respalda tus nuevos conocimientos técnicos.</p></div>
              <div className="bt bt-tinte" style={{ gridColumn: "span 4" }}><Icono nombre="escudo" /><h3>Comunidad</h3><p className="txt">Únete a la red exclusiva de Jóvenes creaTIvos en toda Latinoamérica.</p></div>
              <div className="res" style={{ gridColumn: "span 4" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Datos personales</h3>
                <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="fila-res"><dt>Nombres</dt><dd>Lucía</dd></div>
                  <div className="fila-res"><dt>Número de WhatsApp</dt><dd>+57 300 123 4567</dd></div>
                </dl>
              </div>
            </div>
            <div style={fila}><Chip tono="aviso">Error 404</Chip><Chip tono="cerrada">Convocatoria cerrada</Chip><Chip tono="info">Mantenimiento</Chip></div>
            <Progreso valor={3} total={9} etiqueta="Progreso de la inscripción" />
            <Aviso tipo="privacidad" estilo={{ marginTop: 0 }}><strong>Tu privacidad.</strong> Son confidenciales y se usan para asignar mejor el programa.</Aviso>
            <Aviso tipo="info" icono="sobre" estilo={{ marginTop: 0 }}>Te enviamos un correo de confirmación. Si no lo ves, revisa la carpeta de spam.</Aviso>
          </Bloque>
        </main>
      </div>

      <div className="ad">
        <main className="awrap" style={{ paddingTop: 56, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 24 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>Panel de administración</h1>
          <div style={fila}>
            <Boton ambito="panel" tam="lg">Ingresar</Boton>
            <Boton ambito="panel" tam="sm"><Icono nombre="descargar" tam={18} />Exportar a Excel</Boton>
            <Boton ambito="panel" variante="borde" tam="sm">Exportar CSV</Boton>
            <Boton ambito="panel" variante="oscuro" tam="sm">Reintentar</Boton>
            <Boton ambito="panel" variante="texto" tam="sm">Limpiar filtros</Boton>
            <Boton ambito="panel" variante="peligro" tam="sm">Desactivar</Boton>
            <Boton ambito="panel" variante="borde" tam="sm" disabled>Anterior</Boton>
            <span className="tab is-on">Tablero</span><span className="tab">Inscritos</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
            <div className="kpi oscuro"><span style={{ fontSize: 14, fontWeight: 600 }}>Inscritos</span><span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>3.006</span><span style={{ fontSize: 13, opacity: 0.8 }}>Los 4 países</span></div>
            <div className="kpi"><span style={{ fontSize: 14, fontWeight: 600 }}>Últimos 7 días</span><span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>1.176</span><span style={{ fontSize: 13, opacity: 0.8 }}>+18 % vs. semana anterior</span></div>
            <div className="kpi"><span style={{ fontSize: 14, fontWeight: 600 }}>Con alertas</span><span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>1.925</span><span style={{ fontSize: 13, opacity: 0.8 }}>64 % del total</span></div>
          </div>
          <div className="caja" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
            <div className="campo"><label className="lbl" htmlFor="m-q">Buscar</label><input id="m-q" className="input input-sm" type="search" placeholder="Nombre, documento, correo o radicado" /></div>
            <div className="campo"><label className="lbl" htmlFor="m-pais">País</label><select id="m-pais" className="input input-sm" defaultValue=""><option value="">Todos</option><option>Uruguay</option></select></div>
            <div className="campo"><label className="lbl" htmlFor="m-clave">Contraseña</label><input id="m-clave" className="input input-sm is-error" type="password" defaultValue="12345678" aria-invalid="true" /><span className="err">Correo o contraseña incorrectos.</span></div>
          </div>
          <div className="caja" style={{ padding: 0 }}>
            <div className="tbl-marco" tabIndex={0} role="region" aria-label="Inscritos de ejemplo">
              <table className="tbl" style={{ minWidth: 760 }}>
                <thead><tr><th scope="col">Nombre</th><th scope="col">Documento</th><th scope="col">País · sede</th><th scope="col">Ciudad</th><th scope="col">Edad</th><th scope="col">Alertas</th></tr></thead>
                <tbody>
                  <tr>
                    <td><button className="enlace-fila" type="button">Prueba Diseño, Lucía</button><span className="sub-celda">JC27-UY-5E8T8JW7</span></td>
                    <td>54567894<span className="sub-celda">Cédula de identidad</span></td><td>Uruguay · Paysandú</td>
                    <td><span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>Salto<span className="chip mini t-otra">otra ciudad</span></span></td>
                    <td>16 <span className="chip mini c-info">menor</span></td><td />
                  </tr>
                  <tr>
                    <td><button className="enlace-fila" type="button">Acosta Torres, Camila</button><span className="sub-celda">JC27-UY-WG8MJJ8C</span></td>
                    <td>90002970<span className="sub-celda">Cédula de identidad</span></td><td>Uruguay · Paysandú</td>
                    <td><span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>Paysandú<span className="chip mini t-sede">sede</span></span></td>
                    <td>26</td><td><span className="chip mini c-alerta" style={{ whiteSpace: "normal", height: "auto", padding: "4px 10px", lineHeight: 1.3 }}>Dispone de menos de 10 horas semanales</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 20, alignItems: "start" }}>
            <section className="caja" style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true" aria-label="Cargando datos">
              <span className="lbl">Cargando</span>
              <div className="sk" style={{ height: 88 }} /><div className="sk" style={{ width: "70%" }} /><div className="sk" style={{ width: "90%" }} />
            </section>
            <section className="caja estado vacio">
              <Icono nombre="documento" tam={36} estilo={{ color: "var(--texto-suave)" }} />
              <strong style={{ fontSize: 20 }}>Todavía no hay inscripciones</strong>
              <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--texto-suave)", maxWidth: 320 }}>Cuando alguien se inscriba en tus países, aparecerá aquí.</span>
            </section>
            <section className="caja estado fallo" role="alert">
              <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--error-fondo)", color: "var(--error)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="alerta" tam={28} /></span>
              <strong style={{ fontSize: 20 }}>No pudimos cargar los datos</strong>
              <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--texto-suave)", maxWidth: 320 }}>Puede ser la conexión o el servidor. Los datos no se perdieron.</span>
              <Boton ambito="panel" variante="oscuro" tam="sm">Reintentar</Boton>
            </section>
          </div>
          <div className="aviso-info"><Icono nombre="alerta" />Entraste con una contraseña temporal.</div>
        </main>
      </div>
    </>
  );
}
