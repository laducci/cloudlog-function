import { HttpRequest, InvocationContext } from "@azure/functions";
import { calcularFrete } from "../../src/API/Functions/calcularFrete.function";

const ctx = new InvocationContext({ functionName: "calcularFrete" });

describe("HTTP Trigger calcularFrete", () => {
  it("GET com query string devolve a cotação", async () => {
    const res = await calcularFrete(new HttpRequest({ method: "GET", url: "http://localhost/api/frete?distanceKm=130&weightKg=850" }), ctx);
    expect(res.status ?? 200).toBe(200);
    expect((res.jsonBody as { freightCost: number }).freightCost).toBe(471.53);
  });

  it("POST com lista devolve itens e total", async () => {
    const body = JSON.stringify([{ id: "a", distanceKm: 100, weightKg: 100 }, { id: "b", distanceKm: 200, weightKg: 100 }]);
    const res = await calcularFrete(new HttpRequest({ method: "POST", url: "http://localhost/api/frete", body: { string: body } }), ctx);
    expect((res.jsonBody as { items: unknown[] }).items).toHaveLength(2);
  });

  it("parâmetros inválidos retornam 400", async () => {
    const res = await calcularFrete(new HttpRequest({ method: "GET", url: "http://localhost/api/frete?distanceKm=-1&weightKg=1" }), ctx);
    expect(res.status).toBe(400);
  });
});
