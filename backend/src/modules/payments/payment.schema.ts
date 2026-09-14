import { z } from "zod";
import { TICKET_ID_PATTERN } from "../../shared/ids.js";
import { CURRENCIES, PAYMENT_PROVIDERS } from "../../types/domain.js";

export const CreatePaymentCheckoutSchema = z
  .object({
    ticketId: z.string().regex(TICKET_ID_PATTERN),
    guestAccessToken: z.string().min(16).max(128),
    idempotencyKey: z.string().uuid(),
    provider: z.enum(PAYMENT_PROVIDERS).default("razorpay"),
    currency: z.enum(CURRENCIES).default("INR"),
    returnUrl: z.string().url().max(500).optional(),
    cancelUrl: z.string().url().max(500).optional(),
  })
  .strip();

export type CreatePaymentCheckoutRequest = z.infer<typeof CreatePaymentCheckoutSchema>;

export const PaymentIdParamSchema = z.object({
  paymentId: z.string().uuid(),
});

export const WebhookProviderParamSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDERS),
});

export const PaymentAccessSchema = z.object({
  token: z.string().min(16).max(128).optional(),
});
