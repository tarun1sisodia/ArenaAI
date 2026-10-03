// backend/src/modules/company-profile/company-profile.routes.ts
import type { FastifyInstance } from "fastify";
import type { createCompanyProfileController } from "./company-profile.controller.js";

export async function registerCompanyProfileRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createCompanyProfileController>
): Promise<void> {
  // Public
  app.get("/api/v1/company-profile", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicGet,
  });

  // Admin
  app.get("/api/v1/ops/admin/company-profile", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.patch("/api/v1/ops/admin/company-profile", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
}
