// backend/src/modules/pet-policy/pet-policy.routes.ts
import type { FastifyInstance } from "fastify";
import type { createPetPolicyController } from "./pet-policy.controller.js";

export async function registerPetPolicyRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createPetPolicyController>
): Promise<void> {
  // Public
  app.get("/api/v1/pet-policy", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicGet,
  });

  // Admin
  app.get("/api/v1/ops/admin/pet-policy", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.patch("/api/v1/ops/admin/pet-policy", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
}
