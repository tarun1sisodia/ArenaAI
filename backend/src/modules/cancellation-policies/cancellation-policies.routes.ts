// backend/src/modules/cancellation-policies/cancellation-policies.routes.ts
import type { FastifyInstance } from "fastify";
import type { createCancellationPoliciesController } from "./cancellation-policies.controller.js";

export async function registerCancellationPoliciesRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createCancellationPoliciesController>
): Promise<void> {
  // Public
  app.get("/api/v1/cancellation-policies", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicList,
  });

  // Admin
  app.get("/api/v1/ops/admin/cancellation-policies", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/cancellation-policies/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.patch("/api/v1/ops/admin/cancellation-policies/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
}
