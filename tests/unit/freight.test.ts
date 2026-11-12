import { calculateFreight } from "../../src/Domain/Freight/FreightCalculator";
import { ValidationError } from "../../src/Domain/Errors";
import { CalculateFreightUseCase } from "../../src/Application/Features/CalculateFreight/CalculateFreightUseCase";

const now = new Date("2026-11-12T12:00:00Z");

describe("Cálculo de frete e prazo (domínio)", () => {
  it("calcula valores e prazo de uma rota curta (Expresso)", () => {
    const q = calculateFreight({ distanceKm: 130, weightKg: 850 }, now);
    expect(q.breakdown).toEqual({ base: 120, distance: 305.5, weight: 27.63, toll: 18.4 });
    expect(q.freightCost).toBe(471.53);
    expect(q.restStops).toBe(0);
    expect(q.serviceLevel).toBe("Expresso");
    expect(q.estimatedDeliveryAt).toBe(new Date(now.getTime() + q.etaHours * 3600000).toISOString());
  });

  it("inclui pausas obrigatórias em rotas longas", () => {
    const q = calculateFreight({ distanceKm: 1100, weightKg: 20000 }, now);
    expect(q.restStops).toBe(3);
    expect(q.serviceLevel).toBe("Longa distância");
    expect(q.etaHours).toBeCloseTo(1.5 + 1100 / 62 + 1.5, 1);
  });

  it("rejeita distância e peso inválidos", () => {
    expect(() => calculateFreight({ distanceKm: 0, weightKg: 10 }, now)).toThrow(ValidationError);
    expect(() => calculateFreight({ distanceKm: 10, weightKg: 70000 }, now)).toThrow(ValidationError);
  });
});

describe("CalculateFreightUseCase", () => {
  const uc = new CalculateFreightUseCase({ clock: { now: () => now } });

  it("cota em lote e soma o frete total", () => {
    const r = uc.quoteMany([{ id: "a", distanceKm: 130, weightKg: 850 }, { id: "b", distanceKm: 130, weightKg: 850 }]);
    expect(r.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(r.totalFreight).toBe(943.06);
  });

  it("valida departureAt e tamanho do lote", () => {
    expect(() => uc.quote({ distanceKm: 1, weightKg: 1, departureAt: "ontem" })).toThrow(ValidationError);
    expect(() => uc.quoteMany(new Array(201).fill({ distanceKm: 1, weightKg: 1 }))).toThrow(ValidationError);
  });
});
