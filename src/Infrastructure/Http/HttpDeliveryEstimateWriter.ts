import { FreightQuote } from "../../Domain/Freight/FreightCalculator";
import { DeliveryEstimateWriter } from "../../Domain/Ports";

/** Adaptador HTTP: PUT {ENTREGAS_SERVICE_URL}/deliveries/{id}/estimate */
export class HttpDeliveryEstimateWriter implements DeliveryEstimateWriter {
  constructor(private readonly baseUrl: string, private readonly fetchFn: typeof fetch = fetch) {}

  async write(deliveryId: string, quote: FreightQuote): Promise<void> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/deliveries/${encodeURIComponent(deliveryId)}/estimate`;
    const res = await this.fetchFn(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        freightCost: quote.freightCost, etaHours: quote.etaHours,
        estimatedDeliveryAt: quote.estimatedDeliveryAt, serviceLevel: quote.serviceLevel,
      }),
      signal: AbortSignal.timeout(15000),
    });
    // 404/422: a entrega foi excluída ou finalizada antes do processamento - não adianta reprocessar
    if (res.status === 404 || res.status === 422) return;
    if (!res.ok) throw new Error(`Serviço de Entregas respondeu ${res.status} ao gravar a estimativa.`);
  }
}
