import type { FastifyInstance } from "fastify";
import type { createInquiryController } from "./inquiry.controller.js";

export async function registerInquiryRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createInquiryController>,
): Promise<void> {
  app.post("/api/v1/inquiries", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    handler: controller.create,
  });
}
