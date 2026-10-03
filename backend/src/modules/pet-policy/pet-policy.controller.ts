// backend/src/modules/pet-policy/pet-policy.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createPetPolicyService } from "./pet-policy.service.js";
import { UpdatePetPolicySchema } from "./pet-policy.schema.js";

export function createPetPolicyController(service: ReturnType<typeof createPetPolicyService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);

  return {
    async publicGet(_request: FastifyRequest, reply: FastifyReply) {
      return sendSuccess(reply, await service.get());
    },

    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.get());
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const body = UpdatePetPolicySchema.parse(request.body);
      return sendSuccess(reply, await service.update(body));
    },
  };
}
