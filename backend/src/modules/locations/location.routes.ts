import type { FastifyInstance } from "fastify";
import type { createLocationController } from "./location.controller.js";

export async function registerLocationRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createLocationController>,
): Promise<void> {
  app.get("/api/v1/locations/autocomplete", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.autocomplete,
  });
}
