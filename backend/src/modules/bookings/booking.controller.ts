import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import {
  BookingAccessQuerySchema,
  CreateDraftBookingSchema,
  TicketIdParamSchema,
} from "./booking.schema.js";
import type { createBookingService } from "./booking.service.js";

export function createBookingController(service: ReturnType<typeof createBookingService>) {
  return {
    async createDraft(request: FastifyRequest, reply: FastifyReply) {
      const body = CreateDraftBookingSchema.parse(request.body);
      const result = await service.createDraft(body);
      return sendSuccess(
        reply,
        {
          bookingId: result.booking.id,
          ticketId: result.booking.ticketId,
          guestAccessToken: result.guestAccessToken,
          status: result.booking.status,
          fare: result.booking.fareSnapshot,
          next: {
            action: "create-checkout",
            path: "/api/v1/payments/create-checkout",
          },
        },
        201,
      );
    },

    async getBooking(request: FastifyRequest, reply: FastifyReply) {
      const params = TicketIdParamSchema.parse(request.params);
      const query = BookingAccessQuerySchema.parse(request.query);
      const headerToken =
        typeof request.headers["x-booking-token"] === "string"
          ? request.headers["x-booking-token"]
          : undefined;
      const data = await service.getVerifiedBooking({
        ticketId: params.ticketId,
        token: query.token ?? headerToken,
        phone: query.phone,
        actor: request.user ?? null,
      });
      return sendSuccess(reply, data);
    },
  };
}
