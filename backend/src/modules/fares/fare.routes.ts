import type { FastifyInstance } from "fastify";
import type { createFareController } from "./fare.controller.js";

export async function registerFareRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createFareController>,
): Promise<void> {
  app.post("/api/v1/fares/calculate", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.calculate,
  });
  app.get("/api/v1/fleet", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.fleet,
  });
}
