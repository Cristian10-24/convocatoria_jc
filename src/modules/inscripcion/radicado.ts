// Número de inscripción (radicado) corto y legible: "JC27-UY-7K3M9QXA".
// Se deriva del _id de Mongo (los 5 bytes finales: 2 aleatorios del proceso + contador de 3), en base 32 de Crockford
// (sin I, L, O ni U para que no se confunda al dictarlo). Tiene índice único; si alguna vez choca, el servicio
// reintenta con un _id nuevo.
import type { ObjectId } from "mongodb";
import type { PaisSlug } from "@/shared/config/paises";

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODIGO_PAIS: Record<PaisSlug, string> = { col: "CO", pan: "PA", ecu: "EC", uy: "UY" };

/** "jc-2027" → "JC27". */
export function prefijoConvocatoria(convocatoria: string): string {
  const m = /^([a-z]+)-?(\d{2,4})$/i.exec(convocatoria);
  return m ? `${m[1]!.toUpperCase()}${m[2]!.slice(-2)}` : convocatoria.toUpperCase().slice(0, 6);
}

export function radicadoDe(id: ObjectId, pais: PaisSlug, convocatoria: string): string {
  const bytes = id.id;
  let n = 0;
  for (let i = bytes.length - 5; i < bytes.length; i++) n = n * 256 + bytes[i]!;
  let s = "";
  for (let i = 0; i < 8; i++) {
    s = ALFABETO[n % 32] + s;
    n = Math.floor(n / 32);
  }
  return `${prefijoConvocatoria(convocatoria)}-${CODIGO_PAIS[pais]}-${s}`;
}
