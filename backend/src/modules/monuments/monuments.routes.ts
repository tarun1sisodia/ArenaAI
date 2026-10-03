// backend/src/modules/monuments/monuments.routes.ts
import type { FastifyInstance } from "fastify";
import type { createMonumentsController } from "./monuments.controller.js";

export async function registerMonumentsRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createMonumentsController>
): Promise<void> {
  // Public
  app.get("/api/v1/monuments", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicList,
  });

  // Admin
  app.get("/api/v1/ops/admin/monuments", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/monuments/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.patch("/api/v1/ops/admin/monuments/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
}
