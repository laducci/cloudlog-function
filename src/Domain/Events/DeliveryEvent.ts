/** Cópia local do contrato publicado pelo cloudlog-entregas-service (consumer-side contract). */
export interface DeliveryEvent {
  type: "DeliveryCreated" | "DeliveryUpdated" | "DeliveryDeleted";
  version: number;
  source: string;
  aggregateId: string;
  occurredAt: string;
  data: { id: string; code: string; distanceKm: number; weightKg: number; status: string };
}

const ACTIVE = ["Pendente", "Em rota", "Atrasada"];

export function isDeliveryEvent(value: unknown): value is DeliveryEvent {
  const e = value as DeliveryEvent;
  return !!e && typeof e.type === "string" && typeof e.aggregateId === "string" && !!e.data && typeof e.data.distanceKm === "number";
}

/** Regra: só recalcula para entregas criadas/alteradas que ainda estão ativas. */
export function needsEstimate(e: DeliveryEvent): boolean {
  return (e.type === "DeliveryCreated" || e.type === "DeliveryUpdated") && ACTIVE.includes(e.data.status);
}
