// backend/src/modules/dossier-signoffs/dossier-signoffs.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createDossierSignoffsService } from "./dossier-signoffs.service.js";
import {
  DossierSignoffIdSchema,
  UpdateDossierSignoffSchema,
} from "./dossier-signoffs.schema.js";

export function createDossierSignoffsController(
  service: ReturnType<typeof createDossierSignoffsService>
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
      const { id } = DossierSignoffIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const user = requireUser(request);
      const { id } = DossierSignoffIdSchema.parse(request.params);
      const body = UpdateDossierSignoffSchema.parse(request.body);
      return sendSuccess(reply, await service.update(id, body, user.id));
    },
  };
}
