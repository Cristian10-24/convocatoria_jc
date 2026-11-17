// Notificaciones salientes (correo). Decisión 7: sin RESEND_API_KEY no se envía nada (implementación nula).
// Con la clave, el correo sale por Resend (API HTTP, sin dependencias). El resto del código solo ve `Notificador`.
// La inscripción todavía no envía correo; el enlace para restablecer la contraseña del panel sí.
import "server-only";
import { entorno } from "@/shared/config/env";

export type EventoInscripcion = {
  radicado: string;
  pais: string;
  nombres: string;
  correo: string;
  correoAcudiente?: string;
};

export type EventoRestablecer = { correo: string; nombre: string; enlace: string; minutos: number };

export interface Notificador {
  inscripcionRegistrada(evento: EventoInscripcion): Promise<void>;
  restablecerClave(evento: EventoRestablecer): Promise<void>;
}

const nulo: Notificador = {
  async inscripcionRegistrada() {
    /* sin envío por ahora */
  },
  async restablecerClave(e) {
    // Solo en desarrollo local, para poder probar el flujo sin proveedor de correo. Nunca en producción.
    if (entorno().NODE_ENV === "development") console.info(`[correo] Enlace para ${e.correo} (sin RESEND_API_KEY): ${e.enlace}`);
  },
};

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function resend(clave: string, remitente: string): Notificador {
  async function enviar(para: string, asunto: string, texto: string, html: string) {
    // Un fallo del proveedor no rompe la operación que lo pidió. No se registra destinatario ni contenido.
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: remitente, to: [para], subject: asunto, text: texto, html }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) console.error(`[correo] Resend respondió ${r.status}`);
    } catch (e) {
      console.error("[correo] No se pudo enviar:", e instanceof Error ? e.name : "error");
    }
  }
  return {
    async inscripcionRegistrada() {
      /* el correo de confirmación de inscripción llega en otra fase */
    },
    async restablecerClave(e) {
      const asunto = "Restablece tu contraseña del panel · Jóvenes creaTIvos";
      const texto = `Hola, ${e.nombre}:\n\nPara crear una contraseña nueva del panel de inscripciones, abre este enlace (vence en ${e.minutos} minutos y sirve una sola vez):\n${e.enlace}\n\nSi no lo pediste, ignora este correo: tu contraseña no cambia.`;
      const html = `<p>Hola, ${escapar(e.nombre)}:</p><p>Para crear una contraseña nueva del panel de inscripciones, abre este enlace. Vence en ${e.minutos} minutos y sirve una sola vez.</p><p><a href="${escapar(e.enlace)}">Crear contraseña nueva</a></p><p>Si no lo pediste, ignora este correo: tu contraseña no cambia.</p>`;
      await enviar(e.correo, asunto, texto, html);
    },
  };
}

export function notificador(): Notificador {
  const { RESEND_API_KEY, CORREO_REMITENTE } = entorno();
  return RESEND_API_KEY ? resend(RESEND_API_KEY, CORREO_REMITENTE ?? "Jóvenes creaTIvos <jovenescreativos@tocaunavida.org>") : nulo;
}
