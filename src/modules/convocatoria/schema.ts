// "Avísame cuando abran": forma de lo que envía la landing de un país en estado "muy pronto".
import { z } from "zod";
import { PAISES } from "@/shared/config/paises";
import { CAMPO_TRAMPA } from "@/shared/security/antibots";

export const SobreAviso = z.object({
  pais: z.enum(PAISES),
  correo: z.string().trim().min(5).max(120),
  /** Campo trampa: una persona nunca lo llena. */
  [CAMPO_TRAMPA]: z.string().max(200).optional(),
});
export type SobreAviso = z.infer<typeof SobreAviso>;
