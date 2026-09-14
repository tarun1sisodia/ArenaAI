import type { FastifyInstance } from "fastify";
import type { createReviewController } from "./review.controller.js";

export async function registerReviewRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createReviewController>,
): Promise<void> {
  app.get("/api/v1/catalog/:id/reviews", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listPublished,
  });
  app.post("/api/v1/reviews", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.submit,
  });
  app.get("/api/v1/ops/admin/reviews", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listAdmin,
  });
  app.post("/api/v1/ops/admin/reviews/:id/approve", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.approve,
  });
  app.post("/api/v1/ops/admin/reviews/:id/reject", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.reject,
  });
  app.post("/api/v1/ops/admin/reviews/:id/publish", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.publish,
  });
  app.post("/api/v1/ops/admin/reviews/:id/archive", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.archive,
  });
}
