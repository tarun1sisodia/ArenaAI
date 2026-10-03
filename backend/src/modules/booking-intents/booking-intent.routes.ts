import type { FastifyInstance } from "fastify";
import type { createBookingIntentController } from "./booking-intent.controller.js";

export async function registerBookingIntentRoutes(app: FastifyInstance, controller: ReturnType<typeof createBookingIntentController>): Promise<void> {
  app.post("/api/v1/booking-intents", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, handler: controller.create });
  app.get("/api/v1/booking-intents/:id", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } }, handler: controller.recover });
  app.post("/api/v1/booking-intents/:id/finalize", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, handler: controller.finalize });
}
