import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { useCases } from "../Composition";
import { cors, toErrorResponse } from "./httpErrors";

/**
 * HTTP Trigger - GET /api/frete?distanceKm=130&weightKg=850
 *               POST /api/frete  { distanceKm, weightKg }  ou  [ {id, distanceKm, weightKg}, ... ]
 */
export async function calcularFrete(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    if (request.method === "OPTIONS") return { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } };
    if (request.method === "GET") {
      const q = Object.fromEntries(request.query.entries());
      return { jsonBody: useCases.calculateFreight.quote(q), headers: cors };
    }
    const body = await request.json().catch(() => ({}));
    const result = Array.isArray(body) ? useCases.calculateFreight.quoteMany(body) : useCases.calculateFreight.quote(body as object);
    context.log(`frete calculado (${Array.isArray(body) ? body.length + " itens" : "1 item"})`);
    return { jsonBody: result, headers: cors };
  } catch (err) {
    return toErrorResponse(err);
  }
}

app.http("calcularFrete", { route: "frete", methods: ["GET", "POST", "OPTIONS"], authLevel: "anonymous", handler: calcularFrete });
