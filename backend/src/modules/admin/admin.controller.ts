import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import type { Repositories } from "../../db/types.js";

export function createAdminController(db: Repositories) {
  return {
    async auditLogs(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const logs = await db.audit.list(100);
      return sendSuccess(reply, logs);
    },
  };
}
