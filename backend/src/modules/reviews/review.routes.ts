import type { FastifyInstance } from "fastify";
import type { createReviewController } from "./review.controller.js";

export async function registerReviewRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createReviewController>,
): Promise<void> {
  app.get("/api/v1/catalog/:id/reviews", controller.listPublished);
  app.post("/api/v1/reviews", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.submit,
  });
  app.get("/api/v1/ops/admin/reviews", controller.listAdmin);
  app.post("/api/v1/ops/admin/reviews/:id/approve", controller.approve);
  app.post("/api/v1/ops/admin/reviews/:id/reject", controller.reject);
  app.post("/api/v1/ops/admin/reviews/:id/publish", controller.publish);
  app.post("/api/v1/ops/admin/reviews/:id/archive", controller.archive);
}
