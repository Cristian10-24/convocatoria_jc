// Gráficas del tablero, sin librerías (diseño 2027): listas con barras, serie diaria en SVG, barras apiladas "sede vs.
// otra ciudad" y ranking. Se dibujan en el servidor: no mandan JavaScript al navegador.
import type { ReactNode } from "react";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import type { Barra, Dia } from "../../panel/tablero";

// "always": en español, Intl no separa los miles de 4 cifras por defecto (3006); el diseño pide 3.006.
const formato = new Intl.NumberFormat("es", { useGrouping: "always" });
const fechaCorta = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaLarga = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dia = (iso: string) => new Date(`${iso}T00:00:00Z`);
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export type Tono = "azul" | "naranja" | "alerta" | "durazno" | "info";

export function Caja({ titulo, nota, ancha, children }: { titulo: string; nota?: string; ancha?: boolean; children: ReactNode }) {
  return (
    <section className={ancha ? "caja t-caja ancha" : "caja t-caja"}>
      <h3 className="h-caja">
        {titulo} {nota ? <span className="h-nota">{nota}</span> : null}
      </h3>
      {children}
    </section>
  );
}

/**
 * Lista con barras. El porcentaje es sobre `total` (por defecto, la suma de la lista; en respuestas múltiples se pasa
 * el total de inscritos). La barra es relativa al valor más alto.
 */
export function ListaBarras({ titulo, nota, datos, tono = "azul", total, max }: { titulo: string; nota?: string; datos: Barra[]; tono?: Tono; total?: number; max?: number }) {
  const filas = max ? datos.slice(0, max) : datos;
  const base = total ?? datos.reduce((a, d) => a + d.n, 0);
  const tope = Math.max(1, ...filas.map((d) => d.n));
  return (
    <Caja titulo={titulo} nota={nota}>
      {filas.length === 0 ? (
        <p className="t-vacio">Sin datos con estos filtros.</p>
      ) : (
        <ul className={`barras tono-${tono}`}>
          {filas.map((d) => (
            <li key={d.etiqueta}>
              <span className="b-fila">
                <span>{d.etiqueta}</span>
                <span className="b-cifra">
                  {formato.format(d.n)} <small>{pct(d.n, base)} %</small>
                </span>
              </span>
              <span className="b-pista" aria-hidden="true">
                <span style={{ width: `${Math.max(1, Math.round((d.n / tope) * 100))}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Caja>
  );
}

/** Ejes "redondos" para la serie: 1, 2 o 5 por potencia de 10. */
function tope(n: number): number {
  if (n <= 3) return 3;
  const p = 10 ** Math.floor(Math.log10(n));
  const paso = [1, 2, 5, 10].find((m) => m * p * 3 >= n) ?? 10;
  return paso * p * 3;
}

/** Inscripciones por día (barras) y acumulado (línea), en SVG. */
export function GraficaDias({ datos }: { datos: Dia[] }) {
  if (!datos.length) return null;
  const X0 = 40, X1 = 935, Y0 = 30, Y1 = 250;
  const ancho = (X1 - X0) / datos.length;
  const maxDia = tope(Math.max(...datos.map((d) => d.n)));
  const total = datos[datos.length - 1]!.acumulado;
  const maxAcum = tope(total);
  const y = (v: number, m: number) => Y1 - (v / m) * (Y1 - Y0);
  const xc = (i: number) => X0 + ancho * i + ancho / 2;
  const marcas = datos.length <= 1 ? [0] : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (datos.length - 1)));
  const etiqueta = `Inscripciones por día del ${fechaLarga.format(dia(datos[0]!.dia))} al ${fechaLarga.format(dia(datos[datos.length - 1]!.dia))}; acumulado ${formato.format(total)}`;
  return (
    <section className="caja t-caja ancha">
      <div className="t-caja-cab">
        <h2 className="h-caja">
          Inscripciones por día <span className="h-nota">y acumulado</span>
        </h2>
        <span className="leyenda">
          <span><i />Por día</span>
          <span><i className="linea" />Acumulado</span>
        </span>
      </div>
      <svg className="t-dias" viewBox="0 0 1000 280" role="img" aria-label={etiqueta}>
        {[0, 1 / 3, 2 / 3, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X1} y1={y(f, 1)} y2={y(f, 1)} stroke="var(--borde-tenue)" strokeWidth="1" />
            <text x={X0 - 8} y={y(f, 1) + 4} textAnchor="end">{formato.format(Math.round(maxDia * f))}</text>
            <text x={X1 + 8} y={y(f, 1) + 4}>{formato.format(Math.round(maxAcum * f))}</text>
          </g>
        ))}
        {datos.map((d, i) => (
          <rect key={d.dia} x={X0 + ancho * i + ancho * 0.13} y={y(d.n, maxDia)} width={Math.max(1, ancho * 0.74)} height={Y1 - y(d.n, maxDia)} rx="3" fill="var(--naranja)">
            <title>{`${fechaCorta.format(dia(d.dia))}: ${formato.format(d.n)}`}</title>
          </rect>
        ))}
        <polyline points={datos.map((d, i) => `${xc(i).toFixed(1)},${y(d.acumulado, maxAcum).toFixed(1)}`).join(" ")} fill="none" stroke="var(--azul)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {[...new Set(marcas)].map((i) => (
          <text key={i} x={xc(i)} y="272" textAnchor="middle">{fechaCorta.format(dia(datos[i]!.dia)).replace(".", "")}</text>
        ))}
      </svg>
    </section>
  );
}

/** Por país: viven en una ciudad sede o en otra ciudad (la demanda desde ciudades sin sede). */
export function SedeVsOtra({ datos }: { datos: { pais: string; sede: number; otra: number }[] }) {
  return (
    <Caja titulo="Sede vs. otra ciudad" nota="demanda desde ciudades sin sede">
      <div className="apiladas">
        {datos.map((d) => {
          const total = d.sede + d.otra || 1;
          return (
            <div key={d.pais}>
              <span className="b-fila">
                <span>{NOMBRE_PAIS[d.pais as keyof typeof NOMBRE_PAIS] ?? d.pais}</span>
                <small>{formato.format(d.sede)} sede · {formato.format(d.otra)} otra ({pct(d.otra, total)} %)</small>
              </span>
              <span className="apilada" aria-hidden="true">
                <span className="s1" style={{ width: `${((d.sede / total) * 100).toFixed(1)}%` }} />
                <span className="s2" style={{ width: `${((d.otra / total) * 100).toFixed(1)}%` }} />
              </span>
            </div>
          );
        })}
        <span className="leyenda">
          <span><i className="azul" />Vive en ciudad sede</span>
          <span><i className="durazno" />Vive en otra ciudad</span>
        </span>
      </div>
    </Caja>
  );
}

export function Ranking({ titulo, nota, datos }: { titulo: string; nota?: string; datos: Barra[] }) {
  return (
    <Caja titulo={titulo} nota={nota}>
      {datos.length === 0 ? (
        <p className="t-vacio">Sin datos con estos filtros.</p>
      ) : (
        <ol className="ranking">
          {datos.map((d, i) => (
            <li key={d.etiqueta}>
              <span>{i + 1}</span>
              <span>{d.etiqueta}</span>
              <span>{formato.format(d.n)}</span>
            </li>
          ))}
        </ol>
      )}
    </Caja>
  );
}
