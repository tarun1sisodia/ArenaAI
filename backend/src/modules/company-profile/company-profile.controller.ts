// backend/src/modules/company-profile/company-profile.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createCompanyProfileService } from "./company-profile.service.js";
import { UpdateCompanyProfileSchema } from "./company-profile.schema.js";

export function createCompanyProfileController(service: ReturnType<typeof createCompanyProfileService>) {
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
      const body = UpdateCompanyProfileSchema.parse(request.body);
      return sendSuccess(reply, await service.update(body));
    },
  };
}
