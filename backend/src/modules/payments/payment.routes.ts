import type { FastifyInstance } from "fastify";
import type { createPaymentController } from "./payment.controller.js";

export async function registerPaymentRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createPaymentController>,
): Promise<void> {
  app.post("/api/v1/payments/create-checkout", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.createCheckout,
  });
  app.get("/api/v1/payments/:paymentId/status", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getStatus,
  });
  app.post("/api/v1/payments/:paymentId/verify", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.verifyPayment,
  });
  app.post("/api/v1/payments/webhooks/:provider", {
    // SEC-001: generous per-IP limit allows all legitimate provider retries while blocking floods
    config: { rateLimit: { max: 500, timeWindow: "1 minute" } },
    handler: controller.webhook,
  });
}
