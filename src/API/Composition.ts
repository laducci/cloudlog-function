import { CalculateFreightUseCase } from "../Application/Features/CalculateFreight/CalculateFreightUseCase";
import { ProcessDeliveryEventUseCase } from "../Application/Features/ProcessDeliveryEvent/ProcessDeliveryEventUseCase";
import { HttpDeliveryEstimateWriter } from "../Infrastructure/Http/HttpDeliveryEstimateWriter";
import { SystemClock } from "../Infrastructure/Time/SystemClock";

/** Composition Root da Function App. */
const clock = new SystemClock();
const writer = new HttpDeliveryEstimateWriter(process.env.ENTREGAS_SERVICE_URL ?? "http://localhost:8081");

export const useCases = {
  calculateFreight: new CalculateFreightUseCase({ clock }),
  processDeliveryEvent: new ProcessDeliveryEventUseCase({ clock, writer }),
};
