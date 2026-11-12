import { app, HttpResponseInit } from "@azure/functions";
import { openApiDocument } from "../Docs/openapi";

const swaggerHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>CloudLog · Function de Frete</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"></head>
<body><div id="swagger"></div><script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: "openapi.json", dom_id: "#swagger" });</script></body></html>`;

app.http("openapi", {
  route: "openapi.json", methods: ["GET"], authLevel: "anonymous",
  handler: async (): Promise<HttpResponseInit> => ({ jsonBody: openApiDocument, headers: { "Access-Control-Allow-Origin": "*" } }),
});

app.http("swagger", {
  route: "docs", methods: ["GET"], authLevel: "anonymous",
  handler: async (): Promise<HttpResponseInit> => ({ body: swaggerHtml, headers: { "content-type": "text/html; charset=utf-8" } }),
});
