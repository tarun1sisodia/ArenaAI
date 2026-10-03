import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { Errors } from "../../shared/errors.js";
import { requireUser } from "../../middlewares/authGuard.js";
import { BookingIntentFinalizeSchema, BookingIntentParamSchema, BookingIntentSecretSchema, CreateBookingIntentSchema } from "./booking-intent.schema.js";
import type { createBookingIntentService } from "./booking-intent.service.js";

export function createBookingIntentController(service: ReturnType<typeof createBookingIntentService>) {
  const secret = (request: FastifyRequest) => {
    const value = request.headers["x-booking-intent-secret"];
    if (typeof value !== "string") throw Errors.unauthorized("A valid booking intent secret is required.");
    return BookingIntentSecretSchema.parse(value);
  };
  return {
    async create(request: FastifyRequest, reply: FastifyReply) {
      return sendSuccess(reply, await service.create(CreateBookingIntentSchema.parse(request.body)), 201);
    },
    async recover(request: FastifyRequest, reply: FastifyReply) {
      const params = BookingIntentParamSchema.parse(request.params);
      return sendSuccess(reply, await service.recover(params.id, secret(request)));
    },
    async finalize(request: FastifyRequest, reply: FastifyReply) {
      const actor = requireUser(request);
      const params = BookingIntentParamSchema.parse(request.params);
      const body = BookingIntentFinalizeSchema.parse(request.body);
      return sendSuccess(reply, await service.finalize(params.id, secret(request), actor, body.acceptUpdatedFare === true), 201);
    },
  };
}
