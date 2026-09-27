import type { FastifyInstance } from "fastify";
import type { createCatalogController } from "./catalog.controller.js";

export async function registerCatalogRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createCatalogController>,
): Promise<void> {
  app.get("/api/v1/catalog/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.getManifest,
  });
  app.get("/api/v1/catalog/:slug", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getPublished,
  });
  app.get("/api/v1/ops/admin/catalog/manifest/status", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getManifestStatus,
  });
  app.post("/api/v1/ops/admin/catalog/republish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.republish,
  });
  app.get("/api/v1/ops/admin/catalog", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listAdmin,
  });
  app.post("/api/v1/ops/admin/catalog", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });
  app.patch("/api/v1/ops/admin/catalog/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
  app.post("/api/v1/ops/admin/catalog/:id/publish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.publish,
  });
  app.post("/api/v1/ops/admin/catalog/:id/archive", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.archive,
  });
  app.post("/api/v1/ops/admin/catalog/:id/media", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.attachMedia,
  });
  app.patch("/api/v1/ops/admin/media/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.updateMedia,
  });
}
