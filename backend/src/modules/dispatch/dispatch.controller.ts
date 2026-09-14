import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { DISPATCH_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import { requireUser } from "../../middlewares/authGuard.js";
import type { createPaymentService } from "../payments/payment.service.js";
import {
  AdminBookingQuerySchema,
  AssignBookingSchema,
  BookingIdParamSchema,
  CreateRefundSchema,
} from "./dispatch.schema.js";
import type { createDispatchService } from "./dispatch.service.js";

export function createDispatchController(
  service: ReturnType<typeof createDispatchService>,
  payments: ReturnType<typeof createPaymentService>,
) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, DISPATCH_ROLES);
      const query = AdminBookingQuerySchema.parse(request.query);
      const data = await service.listBookings(query);
      return sendSuccess(reply, data);
    },

    async assign(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, DISPATCH_ROLES);
      const actor = requireUser(request);
      const params = BookingIdParamSchema.parse(request.params);
      const body = AssignBookingSchema.parse(request.body);
      const data = await service.assign({
        bookingId: params.id,
        driverId: body.driverId,
        vehicleId: body.vehicleId,
        note: body.note,
        expectedVersion: body.expectedVersion,
        actor,
        requestId: request.requestId,
      });
      return sendSuccess(reply, {
        bookingId: data.booking.id,
        status: data.booking.status,
        assignedDriverId: data.booking.assignedDriverId,
        version: data.booking.version,
      });
    },

    async notifyDriver(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, DISPATCH_ROLES);
      const actor = requireUser(request);
      const params = BookingIdParamSchema.parse(request.params);
      const data = await service.notifyDriver({
        bookingId: params.id,
        actor,
        requestId: request.requestId,
      });
      return sendSuccess(reply, data);
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
