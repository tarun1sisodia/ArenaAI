import type { Currency, PaymentProviderName } from "../types/domain.js";

export type CreateCheckoutCommand = {
  bookingId: string;
  ticketId: string;
  amountMinor: number;
  currency: Currency;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey: string;
};

export type CheckoutResult = {
  provider: PaymentProviderName;
  providerOrderId: string;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  publicClientToken: string | null;
  amountMinor: number;
  currency: Currency;
  expiresAt: string;
};

export type NormalizedProviderEvent = {
  provider: PaymentProviderName;
  eventId: string;
  eventType: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amountMinor: number;
  currency: Currency;
  status: "captured" | "failed" | "refunded" | "pending";
  paymentMethod: string | null;
  feeMinor: number;
  taxMinor: number;
  raw: unknown;
};

export type RefundCommand = {
  providerPaymentId: string;
  amountMinor: number;
  currency: Currency;
  reason: string;
  idempotencyKey: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(command: CreateCheckoutCommand): Promise<CheckoutResult>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean;
  parseEvent(rawBody: Buffer): NormalizedProviderEvent;
  refund(command: RefundCommand): Promise<{ providerRefundId: string; status: "processed" | "pending" }>;
}

export type PaymentProviderRegistry = Record<PaymentProviderName, PaymentProvider>;
