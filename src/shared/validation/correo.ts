// Correo electrónico: normalización, formato y sugerencia de dominio ("¿quisiste decir gmail.com?").
// Funciones puras. Adaptado de validation-jc (src/lib/validation/email.ts).
// Diferencia: aquí NO se bloquean correos de colegio (.edu): un estudiante puede no tener otro; solo se sugiere.

const DOMINIOS_COMUNES = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "hotmail.es", "outlook.es", "yahoo.es"];
const DOMINIOS_VALIDOS = new Set([
  ...DOMINIOS_COMUNES,
  "mail.com", "msn.com", "aol.com", "me.com", "proton.me", "protonmail.com",
  "yahoo.com.co", "hotmail.com.co", "outlook.com.co", "yahoo.com.ar", "hotmail.com.ar", "adinet.com.uy", "vera.com.uy",
]);

/** Errores frecuentes con su corrección. */
const TIPEOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.es": "gmail.com", "gmail.com.co": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com",
  "hotmil.com": "hotmail.com", "homail.com": "hotmail.com",
  "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outloo.com": "outlook.com",
  "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "icloud.co": "icloud.com", "iclod.com": "icloud.com",
};

const FORMATO = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function normalizarCorreo(valor: string): string {
  return valor.replace(/\s+/g, "").toLowerCase();
}

export function correoValido(correo: string): boolean {
  return correo.length <= 120 && FORMATO.test(correo) && !correo.includes("..");
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

/** Dominio sugerido o null si el dominio parece correcto. */
export function sugerirDominio(dominio: string): string | null {
  if (DOMINIOS_VALIDOS.has(dominio)) return null;
  if (TIPEOS[dominio]) return TIPEOS[dominio]!;
  let mejor: string | null = null;
  let distancia = Infinity;
  for (const d of DOMINIOS_COMUNES) {
    const dist = levenshtein(dominio, d);
    if (dist < distancia) {
      mejor = d;
      distancia = dist;
    }
  }
  return distancia <= (dominio.length >= 8 ? 2 : 1) ? mejor : null;
}

/** Correo completo sugerido (p. ej. "ana@gmial.com" -> "ana@gmail.com") o null. */
export function sugerenciaCorreo(valor: string): string | null {
  const correo = normalizarCorreo(valor);
  if (!correoValido(correo)) return null;
  const at = correo.lastIndexOf("@");
  const fijo = sugerirDominio(correo.slice(at + 1));
  return fijo ? correo.slice(0, at + 1) + fijo : null;
}
