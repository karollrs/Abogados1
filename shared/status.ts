export const CRM_STATUSES = {
  PENDIENTE: "pendiente",
  EN_ESPERA: "en_espera_aceptacion",
  ASIGNADA: "asignada",
  FINALIZADO: "finalizado",
} as const;

export type CRMStatus =
  | "pendiente"
  | "en_espera_aceptacion"
  | "asignada"
  | "finalizado";
