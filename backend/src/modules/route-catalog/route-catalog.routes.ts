import type { FastifyInstance } from "fastify";
import type { createRouteCatalogController } from "./route-catalog.controller.js";

export async function registerRouteCatalogRoutes(app: FastifyInstance, controller: ReturnType<typeof createRouteCatalogController>): Promise<void> {
  app.get("/api/v1/route-catalog/manifest", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.manifest });
  app.get("/api/v1/route-catalog/fleets", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.fleets });
  app.get("/api/v1/ops/admin/route-catalog", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.list });
  app.get("/api/v1/ops/admin/route-catalog/slug-check", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } }, handler: controller.slugCheck });
  app.get("/api/v1/ops/admin/route-catalog/:id", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.get });
  app.post("/api/v1/ops/admin/route-catalog", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } }, handler: controller.create });
  app.patch("/api/v1/ops/admin/route-catalog/:id", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } }, handler: controller.update });
  app.post("/api/v1/ops/admin/route-catalog/:id/publish", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, handler: controller.publish });
  app.post("/api/v1/ops/admin/route-catalog/:id/archive", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, handler: controller.archive });
  app.delete("/api/v1/ops/admin/route-catalog/:id", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, handler: controller.remove });
  app.post("/api/v1/ops/admin/route-catalog/suggest-fares", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.suggestFares });
}
