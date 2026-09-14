import type { AuthUser } from "./domain.js";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    rawBody?: Buffer;
    user?: AuthUser;
  }
}

export {};
