// Celulares: validación por país y formato E.164. Funciones puras (servidor y navegador).
// Adaptado de validation-jc (src/lib/clausura/contacto.ts y src/lib/testimonios/celular.ts).
import { TELEFONOS, type CodigoTelefono } from "@/shared/config/paises";

export type CelularValido = { ok: true; e164: string; nacional: string; pais: CodigoTelefono };

/**
 * Valida un celular escrito por la persona. Acepta espacios, guiones, paréntesis, "+" y "00".
 * - Con indicativo conocido (+57, +507, +593, +598, +54): el resto debe tener la longitud de ese país.
 * - Sin indicativo: se usa el país por defecto (el de la convocatoria). Se tolera un 0 inicial.
 * Rechaza números con todos los dígitos iguales (3000000000, 1111111...).
 */
export function validarCelular(texto: string, porDefecto: CodigoTelefono): CelularValido | { ok: false } {
  const t = texto.trim();
  if (!t || /[^\d\s+().-]/.test(t)) return { ok: false };
  let d = t.replace(/\D/g, "");
  const conIndicativo = t.startsWith("+") || t.startsWith("00");
  if (t.startsWith("00")) d = d.slice(2);
  if (d.length < 7 || d.length > 15) return { ok: false };

  const intentar = (codigo: CodigoTelefono, digitos: string): CelularValido | null => {
    const p = TELEFONOS[codigo];
    const nacional = digitos.replace(/^0/, "");
    if (nacional.length !== p.nacional || /^(\d)\1+$/.test(nacional)) return null;
    return { ok: true, e164: `+${p.indicativo}${nacional}`, nacional, pais: codigo };
  };

  const orden = [porDefecto, ...(Object.keys(TELEFONOS) as CodigoTelefono[]).filter((c) => c !== porDefecto)];
  if (conIndicativo) {
    for (const c of orden) {
      const ind = TELEFONOS[c].indicativo;
      if (d.startsWith(ind)) {
        const r = intentar(c, d.slice(ind.length));
        if (r) return r;
      }
    }
    return { ok: false };
  }
  // Sin "+": primero como número nacional del país por defecto; luego por si escribió el indicativo sin "+".
  const nacional = intentar(porDefecto, d);
  if (nacional) return nacional;
  for (const c of orden) {
    const ind = TELEFONOS[c].indicativo;
    if (d.startsWith(ind)) {
      const r = intentar(c, d.slice(ind.length));
      if (r) return r;
    }
  }
  return { ok: false };
}

/** "+573001234567" -> "+57 300 123 4567" (agrupación simple para mostrar y exportar). */
export function formatearCelular(e164: string): string {
  const m = /^\+(\d+)$/.exec(e164);
  if (!m) return e164;
  const codigo = (Object.keys(TELEFONOS) as CodigoTelefono[]).find((c) => m[1]!.startsWith(TELEFONOS[c].indicativo) && m[1]!.length === TELEFONOS[c].indicativo.length + TELEFONOS[c].nacional);
  if (!codigo) return e164;
  const { indicativo } = TELEFONOS[codigo];
  const nacional = m[1]!.slice(indicativo.length);
  const grupos = nacional.length === 10 ? [3, 3, 4] : nacional.length === 9 ? [2, 3, 4] : [4, 4];
  let i = 0;
  const partes = grupos.map((g) => nacional.slice(i, (i += g)));
  return `+${indicativo} ${partes.join(" ")}`;
}
