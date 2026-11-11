// Contrato HTTP de POST /api/inscripciones (lo usan la ruta y el formulario del navegador).
import { z } from "zod";
import { PAISES } from "@/shared/config/paises";
import { CAMPO_TRAMPA } from "@/shared/security/antibots";

export const RUTA_API = "/api/inscripciones";

const utm = z.string().max(100).optional();

/** Sobre del envío: los datos del formulario + señales antibots + metadatos. */
export const SobreEnvio = z.object({
  pais: z.enum(PAISES),
  datos: z.record(z.string(), z.unknown()),
  [CAMPO_TRAMPA]: z.string().max(200).optional(),
  iniciadoEn: z.number().optional(),
  turnstile: z.string().max(2048).optional(),
  idempotencia: z.uuid().optional(),
  origen: z.object({ utm_source: utm, utm_medium: utm, utm_campaign: utm, utm_content: utm, utm_term: utm }).optional(),
});
export type SobreEnvio = z.infer<typeof SobreEnvio>;

export type RespuestaExito = { radicado: string; nombres: string; yaExistia: boolean };
export type RespuestaError = {
  error: "muy_grande" | "datos_invalidos" | "origen" | "limite" | "bot" | "verificacion" | "cerrada" | "duplicado" | "interno";
  errores?: Record<string, string>;
  paso?: string;
};
