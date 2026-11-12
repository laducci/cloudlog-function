import { HttpResponseInit } from "@azure/functions";
import { DomainError, ValidationError } from "../../Domain/Errors";

export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };

export function toErrorResponse(err: unknown): HttpResponseInit {
  if (err instanceof ValidationError) return { status: 400, jsonBody: { error: err.message }, headers: cors };
  if (err instanceof DomainError) return { status: 422, jsonBody: { error: err.message }, headers: cors };
  return { status: 500, jsonBody: { error: "Erro interno." }, headers: cors };
}
