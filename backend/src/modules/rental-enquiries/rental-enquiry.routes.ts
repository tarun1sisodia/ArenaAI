import type { FastifyInstance } from "fastify";
import type { createRentalEnquiryController } from "./rental-enquiry.controller.js";
export async function registerRentalEnquiryRoutes(app: FastifyInstance, controller: ReturnType<typeof createRentalEnquiryController>): Promise<void> {
  app.post("/api/v1/rental-enquiries", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } }, handler: controller.create });
  app.get("/api/v1/ops/admin/rental-enquiries", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.list });
  app.patch("/api/v1/ops/admin/rental-enquiries/:id", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } }, handler: controller.update });
}
