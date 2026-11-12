import { ProcessDeliveryEventUseCase } from "../../src/Application/Features/ProcessDeliveryEvent/ProcessDeliveryEventUseCase";
import { HttpDeliveryEstimateWriter } from "../../src/Infrastructure/Http/HttpDeliveryEstimateWriter";

const event = (over: Record<string, unknown> = {}, data: Record<string, unknown> = {}) => ({
  type: "DeliveryCreated", version: 1, source: "cloudlog-entregas-service", aggregateId: "d-1", occurredAt: "2026-11-12T12:00:00Z",
  data: { id: "d-1", code: "ENT-1", distanceKm: 130, weightKg: 850, status: "Pendente", ...data }, ...over,
});

describe("ProcessDeliveryEventUseCase (consumidor de eventos)", () => {
  const writes: Array<{ id: string; cost: number }> = [];
  const uc = new ProcessDeliveryEventUseCase({
    clock: { now: () => new Date("2026-11-12T12:00:00Z") },
    writer: { write: async (id, q) => { writes.push({ id, cost: q.freightCost }); } },
  });

  it("DeliveryCreated gera estimativa e grava na entrega", async () => {
    const r = await uc.execute(event());
    expect(r).toMatchObject({ handled: true, deliveryId: "d-1", freightCost: 471.53 });
    expect(writes).toEqual([{ id: "d-1", cost: 471.53 }]);
  });

  it("ignora DeliveryDeleted, entregas finalizadas e mensagens fora do contrato", async () => {
    expect((await uc.execute(event({ type: "DeliveryDeleted" }))).handled).toBe(false);
    expect((await uc.execute(event({}, { status: "Entregue" }))).handled).toBe(false);
    expect((await uc.execute({ hello: "world" })).handled).toBe(false);
  });
});

describe("HttpDeliveryEstimateWriter", () => {
  const quote = { freightCost: 10, etaHours: 2, estimatedDeliveryAt: "2026-11-12T14:00:00Z", serviceLevel: "Expresso" } as never;

  it("faz PUT em /deliveries/{id}/estimate", async () => {
    const calls: Array<[string, RequestInit]> = [];
    const fake = (async (url: string, init: RequestInit) => { calls.push([url, init]); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    await new HttpDeliveryEstimateWriter("https://entregas.example/", fake).write("d-1", quote);
    expect(calls[0][0]).toBe("https://entregas.example/deliveries/d-1/estimate");
    expect(calls[0][1].method).toBe("PUT");
  });

  it("ignora 404 (entrega excluída) e falha em erro 5xx para o Service Bus tentar de novo", async () => {
    const respond = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;
    await expect(new HttpDeliveryEstimateWriter("https://x", respond(404)).write("d", quote)).resolves.toBeUndefined();
    await expect(new HttpDeliveryEstimateWriter("https://x", respond(503)).write("d", quote)).rejects.toThrow("503");
  });
});
