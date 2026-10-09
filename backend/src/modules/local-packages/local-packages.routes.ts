// backend/src/modules/local-packages/local-packages.routes.ts
import type { FastifyInstance } from "fastify";
import type { createLocalPackagesController } from "./local-packages.controller.js";

export async function registerLocalPackagesRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createLocalPackagesController>
): Promise<void> {
  // Public manifest & detail (canonical /local-tours + compatibility /local-packages)
  app.get("/api/v1/local-tours", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.manifest });
  app.get("/api/v1/local-tours/by-code/:code", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.publicGetByCode });
  app.get("/api/v1/local-packages/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.manifest,
  });
  app.get("/api/v1/local-packages/by-code/:code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicGetByCode,
  });

  // Admin CRUD (canonical /local-tours + compatibility /local-packages)
  app.get("/api/v1/ops/admin/local-tours", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.list });
  app.get("/api/v1/ops/admin/local-packages", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/local-packages/check-code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.checkCode,
  });
  app.get("/api/v1/ops/admin/local-packages/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.post("/api/v1/ops/admin/local-packages", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });
  app.patch("/api/v1/ops/admin/local-packages/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
  app.post("/api/v1/ops/admin/local-packages/:id/publish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.publish,
  });
  app.post("/api/v1/ops/admin/local-packages/:id/archive", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.archive,
  });
  app.delete("/api/v1/ops/admin/local-packages/:id", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.remove,
  });
}
