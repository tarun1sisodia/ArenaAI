import type { FastifyInstance } from "fastify";
import type { createAdminController } from "./admin.controller.js";

export async function registerAdminRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createAdminController>,
): Promise<void> {
  app.get("/api/v1/ops/admin/audit-logs", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.auditLogs,
  });
}
