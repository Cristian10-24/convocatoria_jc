// Exportación de inscritos a Excel (hoja de datos + hoja resumen) y a CSV.
// Toda celda de texto pasa por celdaSegura / celdaCsv: un valor que empieza con =, +, - o @ no se ejecuta como
// fórmula al abrir el archivo (inyección de fórmulas).
import "server-only";
import ExcelJS from "exceljs";
import { NOMBRE_PAIS } from "@/shared/config/paises";
import { celdaCsv, celdaSegura } from "@/shared/security/exportacion";
import type { Inscripcion } from "../repository";
import { columnasExportacion, nombreCiudad, nombreSede, textoAlerta, type ValorCelda } from "./presentacion";

/** CSV con separador ";" (el que espera Excel en español) y BOM para que abra bien las tildes. */
export function generarCsv(docs: Inscripcion[], verSensibles: boolean): string {
  const columnas = columnasExportacion(verSensibles);
  const sep = ";";
  const lineas = [columnas.map((c) => celdaCsv(c.titulo, sep)).join(sep)];
  for (const d of docs) lineas.push(columnas.map((c) => celdaCsv(c.valor(d), sep)).join(sep));
  return `﻿${lineas.join("\r\n")}\r\n`;
}

const seguro = (v: ValorCelda): ValorCelda => (typeof v === "string" ? (celdaSegura(v) as string) : v);

function conteo<T>(docs: T[], clave: (d: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const d of docs) m.set(clave(d), (m.get(clave(d)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

export async function generarXlsx(
  docs: Inscripcion[],
  opciones: { verSensibles: boolean; generadoPor: string; filtros: string; ahora?: Date },
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Convocatoria Jóvenes creaTIvos";
  libro.created = opciones.ahora ?? new Date();

  const hoja = libro.addWorksheet("Inscritos", { views: [{ state: "frozen", ySplit: 1 }] });
  const columnas = columnasExportacion(opciones.verSensibles);
  hoja.columns = columnas.map((c, i) => ({ header: c.titulo, key: `c${i}`, width: c.ancho ?? 20 }));
  hoja.getRow(1).font = { bold: true };
  for (const d of docs) hoja.addRow(columnas.map((c) => seguro(c.valor(d))));
  const colFecha = hoja.getColumn(2);
  colFecha.numFmt = "yyyy-mm-dd hh:mm";
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };

  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [{ width: 44 }, { width: 14 }];
  const titulo = (texto: string) => {
    resumen.addRow([]);
    resumen.addRow([texto]).font = { bold: true };
  };
  resumen.addRow(["Exportación de inscritos"]).font = { bold: true, size: 14 };
  resumen.addRow(["Generado", (opciones.ahora ?? new Date()).toISOString()]);
  resumen.addRow(["Por", seguro(opciones.generadoPor)]);
  resumen.addRow(["Filtros", seguro(opciones.filtros || "ninguno")]);
  resumen.addRow(["Total", docs.length]);
  resumen.addRow(["Menores de edad", docs.filter((d) => d.acudiente).length]);
  resumen.addRow(["Con alertas", docs.filter((d) => d.alertas?.length).length]);

  titulo("Por país");
  for (const [k, n] of conteo(docs, (d) => NOMBRE_PAIS[d.pais] ?? d.pais)) resumen.addRow([seguro(k), n]);
  titulo("Por sede");
  for (const [k, n] of conteo(docs, (d) => `${NOMBRE_PAIS[d.pais] ?? d.pais} · ${nombreSede(d.pais, d.sede)}`)) resumen.addRow([seguro(k), n]);
  titulo("Por ciudad");
  for (const [k, n] of conteo(docs, (d) => `${nombreSede(d.pais, d.sede)} · ${nombreCiudad(d)}`)) resumen.addRow([seguro(k), n]);
  titulo("Alertas");
  const alertas = docs.flatMap((d) => (d.alertas ?? []).map((a) => a.codigo));
  for (const [k, n] of conteo(alertas, (c) => textoAlerta(c))) resumen.addRow([seguro(k), n]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
