// Calcula las alertas de una inscripción ya validada. Función pura.
import { ALERTAS, type Alerta, type CodigoAlerta } from "./config/alertas";
import type { ConfigPaisInscripcion } from "./config/tipos";
import type { DatosInscripcion } from "./schema";

export function calcularAlertas(
  cfg: ConfigPaisInscripcion,
  d: DatosInscripcion,
  contexto: { hoy: string; correoRepetido: boolean },
): Alerta[] {
  const codigos: CodigoAlerta[] = [];
  if (!d.internet) codigos.push("sin_internet");
  if (d.computadora === "ninguna") codigos.push("sin_computador");
  if (d.horas === "menos5" || d.horas === "5a10") codigos.push("pocas_horas");
  if (d.edad > cfg.edad.alertaMayorDe) codigos.push("edad_mayor");
  if (d.anioEgreso !== undefined && Number(contexto.hoy.slice(0, 4)) - d.anioEgreso > cfg.maxAniosEgreso) codigos.push("egreso_antiguo");
  if (contexto.correoRepetido) codigos.push("correo_repetido");
  return codigos.map((codigo) => ({ codigo, motivo: ALERTAS[codigo] }));
}
