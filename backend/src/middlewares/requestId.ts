import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

export function registerRequestId(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const incoming = request.headers["x-request-id"];
    let requestId: string;
    if (typeof incoming === "string" && incoming.length >= 8 && incoming.length <= 128) {
      // Validate incoming request-id is safe: alphanumeric + dash, no injection
      if (/^[a-zA-Z0-9-_]+$/.test(incoming)) {
        requestId = incoming;
      } else {
        requestId = randomUUID();
      }
    } else {
      requestId = randomUUID();
    }
    request.requestId = requestId;
    reply.header("x-request-id", requestId);
  });
}
