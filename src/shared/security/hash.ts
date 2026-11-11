// Hash de la IP para auditoría: permite ver "muchas inscripciones desde la misma red" sin guardar la IP en claro.
import "server-only";
import { createHash } from "node:crypto";
import { entorno, esProduccion } from "@/shared/config/env";

export function hashIp(ip: string): string {
  const sal = entorno().IP_HASH_SALT;
  if (!sal && esProduccion()) throw new Error("[env] Falta IP_HASH_SALT");
  return createHash("sha256").update(`${sal ?? "desarrollo"}:${ip}`).digest("hex").slice(0, 32);
}
