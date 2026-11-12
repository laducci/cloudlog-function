import { ValidationError } from "../Errors";

export interface FreightRequest { distanceKm: number; weightKg: number; departureAt?: Date }

export interface FreightQuote {
  distanceKm: number;
  weightKg: number;
  freightCost: number;
  etaHours: number;
  drivingHours: number;
  restStops: number;
  estimatedDeliveryAt: string;
  serviceLevel: "Expresso" | "Padrão" | "Longa distância";
  breakdown: { base: number; distance: number; weight: number; toll: number };
}

/** Parâmetros de negócio da tabela de frete do CloudLog. */
export const FREIGHT_TABLE = {
  base: 120,
  perKm: 2.35,
  perKgPerKm: 0.00025,
  tollEvery100Km: 18.4,
  averageSpeedKmh: 62,
  loadingHours: 1.5,
  // Lei 13.103/2015: pausa de 30 min a cada 5h30 de direção
  maxContinuousDrivingHours: 5.5,
  restStopHours: 0.5,
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Serviço de domínio puro: calcula frete e prazo de uma entrega. */
export function calculateFreight(input: FreightRequest, now: Date): FreightQuote {
  const distanceKm = Number(input.distanceKm);
  const weightKg = Number(input.weightKg);
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 5000) throw new ValidationError("distanceKm deve estar entre 1 e 5000.");
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 60000) throw new ValidationError("weightKg deve estar entre 1 e 60000.");

  const t = FREIGHT_TABLE;
  const breakdown = {
    base: t.base,
    distance: round2(distanceKm * t.perKm),
    weight: round2(distanceKm * weightKg * t.perKgPerKm),
    toll: round2(Math.floor(distanceKm / 100) * t.tollEvery100Km),
  };
  const drivingHours = distanceKm / t.averageSpeedKmh;
  const restStops = Math.max(0, Math.ceil(drivingHours / t.maxContinuousDrivingHours) - 1);
  const etaHours = round2(t.loadingHours + drivingHours + restStops * t.restStopHours);
  const departure = input.departureAt ?? now;

  return {
    distanceKm,
    weightKg,
    freightCost: round2(breakdown.base + breakdown.distance + breakdown.weight + breakdown.toll),
    etaHours,
    drivingHours: round2(drivingHours),
    restStops,
    estimatedDeliveryAt: new Date(departure.getTime() + etaHours * 3_600_000).toISOString(),
    serviceLevel: distanceKm <= 150 ? "Expresso" : distanceKm <= 600 ? "Padrão" : "Longa distância",
    breakdown,
  };
}
