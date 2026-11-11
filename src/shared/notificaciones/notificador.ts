// Notificaciones salientes (correo, WhatsApp...). Por ahora NO se envía nada (decisión 7): la implementación activa
// es la nula. Para agregar correo después, se implementa `Notificador` (p. ej. con un proveedor transaccional) y se
// devuelve desde `notificador()`; el resto del código no cambia.
import "server-only";

export type EventoInscripcion = {
  radicado: string;
  pais: string;
  nombres: string;
  correo: string;
  correoAcudiente?: string;
};

export interface Notificador {
  inscripcionRegistrada(evento: EventoInscripcion): Promise<void>;
}

const nulo: Notificador = {
  async inscripcionRegistrada() {
    /* sin envío por ahora */
  },
};

export function notificador(): Notificador {
  return nulo;
}
