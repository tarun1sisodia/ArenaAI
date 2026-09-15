import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CalculateFareSchema } from "./fare.schema.js";
import type { createFareService } from "./fare.service.js";

export function createFareController(service: ReturnType<typeof createFareService>) {
  return {
    async calculate(request: FastifyRequest, reply: FastifyReply) {
      const body = CalculateFareSchema.parse(request.body);
      const fare = await service.calculate(body);
      return sendSuccess(reply, fare);
    },
  };
}
