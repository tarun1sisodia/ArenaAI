import type { AuthUser } from "./domain.js";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    correlationId: string;
    rawBody?: Buffer;
    user?: AuthUser;
  }
}

export {};
