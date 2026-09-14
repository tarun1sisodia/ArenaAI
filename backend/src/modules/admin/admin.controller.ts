import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { DISPATCH_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import type { createPaymentService } from "../payments/payment.service.js";
import { AdminBookingQuerySchema, CreateRefundSchema } from "./admin.schema.js";
import type { createAdminService } from "./admin.service.js";

export function createAdminController(
  service: ReturnType<typeof createAdminService>,
  payments: ReturnType<typeof createPaymentService>,
) {
  return {
    async listBookings(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, DISPATCH_ROLES);
      const query = AdminBookingQuerySchema.parse(request.query);
      const data = await service.listBookings(query);
      return sendSuccess(reply, data);
    },

    async auditLogs(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const logs = await service.listAuditLogs(100);
      return sendSuccess(reply, logs);
    },

    async refund(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const actor = requireUser(request);
      const body = CreateRefundSchema.parse(request.body);
      const data = await payments.refund({
        bookingId: body.bookingId,
        reason: body.reason,
        idempotencyKey: body.idempotencyKey,
        actorId: actor.id,
      });
      return sendSuccess(reply, data, 201);
    },
  };
}
