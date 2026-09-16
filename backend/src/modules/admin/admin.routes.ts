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

  app.get("/api/v1/ops/admin/bookings", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listBookings,
  });

  app.post("/api/v1/ops/admin/bookings/:id/transition", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.transitionBooking,
  });

  app.post("/api/v1/ops/admin/refunds", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.refund,
  });
}
