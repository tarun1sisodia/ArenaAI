// backend/src/modules/cancellation-policies/cancellation-policies.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createCancellationPoliciesService } from "./cancellation-policies.service.js";
import {
  CancellationPolicyIdSchema,
  UpdateCancellationPolicySchema,
} from "./cancellation-policies.schema.js";

export function createCancellationPoliciesController(
  service: ReturnType<typeof createCancellationPoliciesService>
) {
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
      const { id } = CancellationPolicyIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = CancellationPolicyIdSchema.parse(request.params);
      const body = UpdateCancellationPolicySchema.parse(request.body);
      return sendSuccess(reply, await service.update(id, body));
    },
  };
}
