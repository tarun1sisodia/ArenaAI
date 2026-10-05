import type { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../../shared/errors.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import {
  CreatePaymentCheckoutSchema,
  PaymentAccessSchema,
  PaymentIdParamSchema,
  VerifyPaymentSchema,
  WebhookProviderParamSchema,
} from "./payment.schema.js";
import { assertNoClientAmount, type createPaymentService } from "./payment.service.js";

export function createPaymentController(service: ReturnType<typeof createPaymentService>) {
  return {
    async createCheckout(request: FastifyRequest, reply: FastifyReply) {
      assertNoClientAmount(request.body);
      const body = CreatePaymentCheckoutSchema.parse(request.body);
      const data = await service.createCheckout(body, request.user ?? null);
      return sendSuccess(reply, data, 201);
    },

    async getStatus(request: FastifyRequest, reply: FastifyReply) {
      const params = PaymentIdParamSchema.parse(request.params);
      const query = PaymentAccessSchema.parse(request.query);
      const headerToken =
        typeof request.headers["x-booking-token"] === "string"
          ? request.headers["x-booking-token"]
          : undefined;
      const token = query.token ?? headerToken;
      if (!token && !request.user) throw Errors.unauthorized("Booking ownership proof is required.");
      const data = await service.getStatus(params.paymentId, token, request.user ?? null);
      return sendSuccess(reply, data);
    },

    async verifyPayment(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) throw Errors.unauthorized("Authenticated booking ownership is required.");
      const params = PaymentIdParamSchema.parse(request.params);
      const body = VerifyPaymentSchema.parse(request.body);
      const data = await service.verifyCheckoutPayment(params.paymentId, body, request.user);
      return sendSuccess(reply, data);
    },

    async webhook(request: FastifyRequest, reply: FastifyReply) {
      const params = WebhookProviderParamSchema.parse(request.params);
      const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
      const result = await service.reconcileWebhook({
        provider: params.provider,
        rawBody,
        headers: request.headers,
      });
      return sendSuccess(reply, result);
    },
  };
}
