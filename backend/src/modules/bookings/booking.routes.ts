import type { FastifyInstance } from "fastify";
import type { createBookingController } from "./booking.controller.js";

export async function registerBookingRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createBookingController>,
): Promise<void> {
  app.post("/api/v1/bookings/draft", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.createDraft,
  });
  app.get("/api/v1/bookings/:ticketId", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getBooking,
  });
}
