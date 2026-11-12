import { app, InvocationContext } from "@azure/functions";
import { useCases } from "../Composition";

/** Service Bus Queue Trigger - consome os eventos do Microserviço de Entregas. */
export async function processarEventoEntrega(message: unknown, context: InvocationContext): Promise<void> {
  const result = await useCases.processDeliveryEvent.execute(message);
  if (result.handled) {
    context.log(`[evento] entrega ${result.deliveryId} enriquecida: frete R$ ${result.freightCost}, prazo ${result.etaHours} h`);
  } else {
    context.log(`[evento] ignorado: ${result.reason}`);
  }
}

app.serviceBusQueue("processarEventoEntrega", {
  connection: "SERVICEBUS_CONNECTION",
  queueName: "%SERVICEBUS_QUEUE%",
  handler: processarEventoEntrega,
});
