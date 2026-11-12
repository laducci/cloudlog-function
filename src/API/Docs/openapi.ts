const quote = {
  type: "object",
  properties: {
    id: { type: "string" }, distanceKm: { type: "number" }, weightKg: { type: "number" },
    freightCost: { type: "number", example: 471.53 }, etaHours: { type: "number" }, drivingHours: { type: "number" },
    restStops: { type: "integer", description: "Pausas de 30 min a cada 5h30 de direção (Lei 13.103/2015)" },
    estimatedDeliveryAt: { type: "string", format: "date-time" },
    serviceLevel: { type: "string", enum: ["Expresso", "Padrão", "Longa distância"] },
    breakdown: { type: "object", properties: { base: { type: "number" }, distance: { type: "number" }, weight: { type: "number" }, toll: { type: "number" } } },
  },
};
const input = { type: "object", required: ["distanceKm", "weightKg"], properties: { id: { type: "string" }, distanceKm: { type: "number", example: 130 }, weightKg: { type: "number", example: 850 }, departureAt: { type: "string", format: "date-time" } } };

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "CloudLog · Azure Function de Frete",
    version: "1.0.0",
    description:
      "HTTP Trigger que calcula frete e prazo. A mesma Function App tem um Service Bus Trigger (processarEventoEntrega) que consome " +
      "os eventos de entrega e grava a estimativa no Microserviço de Entregas. Alunos: Camilla Augusta Uber, João Davi, Laura Guillarducci.",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/frete": {
      get: {
        summary: "Cotar frete de uma entrega",
        parameters: [
          { name: "distanceKm", in: "query", required: true, schema: { type: "number" } },
          { name: "weightKg", in: "query", required: true, schema: { type: "number" } },
        ],
        responses: { 200: { description: "Cotação", content: { "application/json": { schema: quote } } }, 400: { description: "Parâmetros inválidos" } },
      },
      post: {
        summary: "Cotar frete de uma entrega ou de uma lista (lote, usado pelo BFF)",
        requestBody: { required: true, content: { "application/json": { schema: { oneOf: [input, { type: "array", items: input }] } } } },
        responses: { 200: { description: "Cotação ou { items, totalFreight }", content: { "application/json": { schema: { oneOf: [quote, { type: "object", properties: { items: { type: "array", items: quote }, totalFreight: { type: "number" } } }] } } } }, 400: { description: "Dados inválidos" } },
      },
    },
  },
};
