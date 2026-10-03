// backend/src/modules/monuments/monuments.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createMonumentsService } from "./monuments.service.js";
import { MonumentIdSchema, UpdateMonumentSchema } from "./monuments.schema.js";

export function createMonumentsController(service: ReturnType<typeof createMonumentsService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);

  return {
    async publicList(_request: FastifyRequest, reply: FastifyReply) {
      return sendSuccess(reply, await service.list());
    },

    async list(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.list());
    },

    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = MonumentIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = MonumentIdSchema.parse(request.params);
      const body = UpdateMonumentSchema.parse(request.body);
      return sendSuccess(reply, await service.update(id, body));
    },
  };
}
