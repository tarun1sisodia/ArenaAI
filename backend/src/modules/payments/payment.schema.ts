import { z } from "zod";
import { TICKET_ID_PATTERN } from "../../shared/ids.js";

export const CreatePaymentCheckoutSchema = z
  .object({
    ticketId: z.string().regex(TICKET_ID_PATTERN),
    guestAccessToken: z.string().min(16).max(128).optional(),
    idempotencyKey: z.string().uuid(),
    returnUrl: z.string().url().max(500).optional(),
    cancelUrl: z.string().url().max(500).optional(),
  })
  .strip();

export type CreatePaymentCheckoutRequest = z.infer<typeof CreatePaymentCheckoutSchema>;

export const PaymentIdParamSchema = z.object({
  paymentId: z.string().uuid(),
});

export const WebhookProviderParamSchema = z.object({
  provider: z.literal("razorpay"),
});

export const PaymentAccessSchema = z.object({
  token: z.string().min(16).max(128).optional(),
});
