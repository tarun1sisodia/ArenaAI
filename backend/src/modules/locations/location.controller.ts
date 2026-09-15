import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { AutocompleteQuerySchema } from "./location.schema.js";
import type { createLocationService } from "./location.service.js";

export function createLocationController(service: ReturnType<typeof createLocationService>) {
  return {
    async autocomplete(request: FastifyRequest, reply: FastifyReply) {
      const query = AutocompleteQuerySchema.parse(request.query);
      const data = await service.autocomplete(query.q);
      return sendSuccess(reply, data);
    },
  };
}
