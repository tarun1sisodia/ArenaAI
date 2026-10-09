// backend/src/modules/transfer-routes/transfer-routes.routes.ts
import type { FastifyInstance } from "fastify";
import type { createTransferRoutesController } from "./transfer-routes.controller.js";

export async function registerTransferRoutesRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createTransferRoutesController>
): Promise<void> {
  // Public manifest & detail (canonical /transfers + compatibility /transfer-routes)
  app.get("/api/v1/transfers", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.manifest });
  app.get("/api/v1/transfers/by-code/:code", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.publicGetByCode });
  app.get("/api/v1/transfer-routes/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.manifest,
  });
  app.get("/api/v1/transfer-routes/by-code/:code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicGetByCode,
  });

  // Admin CRUD (canonical /transfers + compatibility /transfer-routes)
  app.get("/api/v1/ops/admin/transfers", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.list });
  app.get("/api/v1/ops/admin/transfer-routes", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/transfer-routes/check-code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.checkCode,
  });
  app.get("/api/v1/ops/admin/transfer-routes/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.post("/api/v1/ops/admin/transfer-routes", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });
  app.patch("/api/v1/ops/admin/transfer-routes/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
  app.post("/api/v1/ops/admin/transfer-routes/:id/publish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.publish,
  });
  app.post("/api/v1/ops/admin/transfer-routes/:id/archive", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.archive,
  });
  app.delete("/api/v1/ops/admin/transfer-routes/:id", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.remove,
  });
}
