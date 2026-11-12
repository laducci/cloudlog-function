import { FreightQuote, calculateFreight } from "../../../Domain/Freight/FreightCalculator";
import { ValidationError } from "../../../Domain/Errors";
import { Clock } from "../../../Domain/Ports";

export interface FreightInput { id?: unknown; distanceKm?: unknown; weightKg?: unknown; departureAt?: unknown }

/** Caso de uso: cotação de frete/prazo, individual ou em lote (usado pelo BFF). */
export class CalculateFreightUseCase {
  constructor(private readonly deps: { clock: Clock }) {}

  quote(input: FreightInput): FreightQuote & { id?: string } {
    const departureAt = input.departureAt ? new Date(String(input.departureAt)) : undefined;
    if (departureAt && Number.isNaN(departureAt.getTime())) throw new ValidationError("departureAt inválido.");
    const quote = calculateFreight({ distanceKm: Number(input.distanceKm), weightKg: Number(input.weightKg), departureAt }, this.deps.clock.now());
    return input.id !== undefined ? { id: String(input.id), ...quote } : quote;
  }

  quoteMany(inputs: FreightInput[]): { items: Array<FreightQuote & { id?: string }>; totalFreight: number } {
    if (!Array.isArray(inputs) || inputs.length > 200) throw new ValidationError("Envie uma lista com até 200 itens.");
    const items = inputs.map((i) => this.quote(i));
    return { items, totalFreight: Math.round(items.reduce((s, q) => s + q.freightCost, 0) * 100) / 100 };
  }
}
