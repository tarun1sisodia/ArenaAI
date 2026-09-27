import type { FastifyInstance } from "fastify";
import type { createCatalogController } from "./catalog.controller.js";

export async function registerCatalogRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createCatalogController>,
): Promise<void> {
  // ── Public (customer site) ────────────────────────────────────────────────
  // Published catalog listing — the single source of trips both frontends read.
  app.get("/api/v1/catalog", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listPublished,
  });
  app.get("/api/v1/catalog/:slug", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getPublished,
  });
  // Inline (DB-backed) media bytes — immutable, long-cached.
  app.get("/api/v1/media/:id", {
    config: { rateLimit: { max: 300, timeWindow: "1 minute" } },
    handler: controller.serveMedia,
  });

  // ── Operations desk (admin) ───────────────────────────────────────────────
  app.get("/api/v1/ops/admin/catalog", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listAdmin,
  });
  app.get("/api/v1/ops/admin/catalog/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getAdminItem,
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
    // Inline image uploads carry base64 payloads (≤2.5 MB binary ≈ 3.4 MB
    // body). Every other route keeps the global 1 MB guard.
    bodyLimit: 4_000_000,
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.attachMedia,
  });
  app.patch("/api/v1/ops/admin/media/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.updateMedia,
  });
  app.delete("/api/v1/ops/admin/media/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.deleteMedia,
  });
}
