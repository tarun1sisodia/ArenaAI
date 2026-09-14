import type { FastifyInstance } from "fastify";
import type { createCatalogController } from "./catalog.controller.js";

export async function registerCatalogRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createCatalogController>,
): Promise<void> {
  app.get("/api/v1/catalog/:slug", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getPublished,
  });
  app.get("/api/v1/ops/admin/catalog", controller.listAdmin);
  app.post("/api/v1/ops/admin/catalog", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });
  app.patch("/api/v1/ops/admin/catalog/:id", controller.update);
  app.post("/api/v1/ops/admin/catalog/:id/publish", controller.publish);
  app.post("/api/v1/ops/admin/catalog/:id/archive", controller.archive);
  app.post("/api/v1/ops/admin/catalog/:id/media", controller.attachMedia);
  app.patch("/api/v1/ops/admin/media/:id", controller.updateMedia);
}
