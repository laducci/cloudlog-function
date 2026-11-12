import { isDeliveryEvent, needsEstimate } from "../../../Domain/Events/DeliveryEvent";
import { calculateFreight } from "../../../Domain/Freight/FreightCalculator";
import { Clock, DeliveryEstimateWriter } from "../../../Domain/Ports";

export type ProcessResult = { handled: false; reason: string } | { handled: true; deliveryId: string; freightCost: number; etaHours: number };

/**
 * Caso de uso disparado pela fila do Service Bus (EDA):
 * evento DeliveryCreated/Updated -> calcula frete e prazo -> grava na entrega.
 */
export class ProcessDeliveryEventUseCase {
  constructor(private readonly deps: { clock: Clock; writer: DeliveryEstimateWriter }) {}

  async execute(message: unknown): Promise<ProcessResult> {
    if (!isDeliveryEvent(message)) return { handled: false, reason: "mensagem fora do contrato DeliveryEvent" };
    if (!needsEstimate(message)) return { handled: false, reason: `${message.type} (${message.data.status}) não precisa de estimativa` };
    const quote = calculateFreight({ distanceKm: message.data.distanceKm, weightKg: message.data.weightKg }, this.deps.clock.now());
    await this.deps.writer.write(message.aggregateId, quote);
    return { handled: true, deliveryId: message.aggregateId, freightCost: quote.freightCost, etaHours: quote.etaHours };
  }
}
