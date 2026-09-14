import type { FastifyInstance } from "fastify";
import type { createDispatchController } from "./dispatch.controller.js";

export async function registerDispatchRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createDispatchController>,
): Promise<void> {
  app.get("/api/v1/ops/admin/bookings", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.patch("/api/v1/ops/admin/bookings/:id/assign", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.assign,
  });
  app.post("/api/v1/ops/admin/bookings/:id/notify-driver", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.notifyDriver,
  });
  app.post("/api/v1/ops/admin/refunds", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.refund,
  });
}
