"use client";
// Gráficas del tablero (Recharts). Solo se cargan en /admin: las páginas públicas no las descargan.
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Barra, Dia } from "../../panel/tablero";
import s from "./Panel.module.css";

const NARANJA = "#e9531f";
const MARINO = "#1c2a7a";
const formato = new Intl.NumberFormat("es");

const recortar = (t: string, max = 26) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);

/** Barras horizontales: sirven para cualquier "cuántos por categoría". */
export function GraficaBarras({ titulo, datos, nota, max = 15 }: { titulo: string; datos: Barra[]; nota?: string; max?: number }) {
  const visibles = datos.slice(0, max);
  const total = datos.reduce((a, d) => a + d.n, 0);
  return (
    <section className={s.tarjeta}>
      <h2>
        {titulo}
        {nota && <small>{nota}</small>}
      </h2>
      {visibles.length === 0 ? (
        <p className={s.vacio}>Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, visibles.length * 30 + 30)}>
          <BarChart data={visibles} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} title={titulo}>
            <CartesianGrid horizontal={false} stroke="#f1e7df" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#b9aea5" />
            <YAxis type="category" dataKey="etiqueta" width={170} tick={{ fontSize: 12 }} tickFormatter={(t: string) => recortar(t)} stroke="#b9aea5" interval={0} />
            <Tooltip
              cursor={{ fill: "#fff3ec" }}
              formatter={(v) => {
                const n = Number(v);
                return [`${formato.format(n)} (${total ? Math.round((n / total) * 100) : 0} %)`, "Inscritos"];
              }}
            />
            <Bar dataKey="n" fill={NARANJA} radius={[0, 6, 6, 0]} isAnimationActive={false} label={{ position: "right", fontSize: 11, fill: "#4b4a5c" }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

/** Inscripciones por día (barras) y acumulado (línea). */
export function GraficaDias({ datos, zona }: { datos: Dia[]; zona: string }) {
  return (
    <section className={`${s.tarjeta} ${s.tarjetaAncha}`}>
      <h2>
        Inscripciones por día
        <small>hora de {zona.replace("America/", "").replace("_", " ")}</small>
      </h2>
      {datos.length === 0 ? (
        <p className={s.vacio}>Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} title="Inscripciones por día">
            <CartesianGrid vertical={false} stroke="#f1e7df" />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`} stroke="#b9aea5" minTickGap={16} />
            <YAxis yAxisId="dia" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#b9aea5" />
            <YAxis yAxisId="acum" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#b9aea5" />
            <Tooltip
              labelFormatter={(d) => String(d).split("-").reverse().join("/")}
              formatter={(v, nombre) => [formato.format(Number(v)), nombre === "acumulado" ? "Acumulado" : "Ese día"]}
            />
            <Bar yAxisId="dia" dataKey="n" fill={NARANJA} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Line yAxisId="acum" dataKey="acumulado" stroke={MARINO} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
