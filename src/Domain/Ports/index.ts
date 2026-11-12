import { FreightQuote } from "../Freight/FreightCalculator";

export interface Clock { now(): Date }

/** Porta de saída: devolve a estimativa calculada ao microserviço de Entregas. */
export interface DeliveryEstimateWriter {
  write(deliveryId: string, quote: FreightQuote): Promise<void>;
}
