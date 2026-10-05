// backend/src/modules/tour-packages/tour-packages.routes.ts
import type { FastifyInstance } from "fastify";
import type { createTourPackagesController } from "./tour-packages.controller.js";

export async function registerTourPackagesRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createTourPackagesController>
): Promise<void> {
  // Public manifest & detail
  app.get("/api/v1/tour-packages/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.manifest,
  });
  app.get("/api/v1/tour-packages/upgrades", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.listUpgrades,
  });
  app.get("/api/v1/tour-packages/by-code/:code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicGetByCode,
  });

  // Admin CRUD
  app.get("/api/v1/ops/admin/tour-packages", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/tour-packages/check-code", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.checkCode,
  });
  app.get("/api/v1/ops/admin/tour-packages/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.post("/api/v1/ops/admin/tour-packages", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });
  app.patch("/api/v1/ops/admin/tour-packages/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
  app.post("/api/v1/ops/admin/tour-packages/:id/publish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.publish,
  });
  app.post("/api/v1/ops/admin/tour-packages/:id/archive", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.archive,
  });
  app.delete("/api/v1/ops/admin/tour-packages/:id", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.remove,
  });
  app.post("/api/v1/ops/admin/tour-packages/upgrades", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.saveUpgrade,
  });
  app.delete("/api/v1/ops/admin/tour-packages/upgrades/:id", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.deleteUpgrade,
  });
  app.post("/api/v1/ops/admin/tour-packages/upload-image", {
    bodyLimit: 5_000_000,
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.uploadImage,
  });
  app.get("/api/v1/tour-packages/media/:file", {
    config: { rateLimit: { max: 300, timeWindow: "1 minute" } },
    handler: controller.getMedia,
  });
}
