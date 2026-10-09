import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { requestContext } from "../shared/request-context.js";

function readTraceId(value: string | string[] | undefined): string | undefined {
  const incoming = Array.isArray(value) ? value[0] : value;
  if (typeof incoming === "string" && incoming.length >= 8 && incoming.length <= 128 && /^[a-zA-Z0-9-_]+$/.test(incoming)) {
    return incoming;
  }
  return undefined;
}

export function registerRequestId(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const correlationId =
      readTraceId(request.headers["x-correlation-id"]) ??
      readTraceId(request.headers["x-request-id"]) ??
      randomUUID();
    request.requestId = correlationId;
    request.correlationId = correlationId;
    requestContext.enterWith({ correlationId });
    reply.header("x-request-id", correlationId);
    reply.header("x-correlation-id", correlationId);
  });
}
