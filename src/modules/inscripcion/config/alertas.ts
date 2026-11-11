// Alertas: requisitos que la persona no cumple (o un posible duplicado). NO impiden inscribirse (decisión 3 y F8):
// se guardan con la inscripción y el panel las muestra y filtra.
export const ALERTAS = {
  sin_internet: "No tiene acceso a internet",
  sin_computador: "No tiene acceso a una computadora",
  pocas_horas: "Dispone de menos de 10 horas semanales (el programa pide 8 h exclusivas)",
  edad_mayor: "Supera la edad máxima de la convocatoria",
  egreso_antiguo: "Terminó la secundaria hace más años de los permitidos",
  correo_repetido: "Otra inscripción usa el mismo correo (posible duplicado)",
} as const;

export type CodigoAlerta = keyof typeof ALERTAS;
export type Alerta = { codigo: CodigoAlerta; motivo: string };
