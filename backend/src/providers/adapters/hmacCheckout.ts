import { hmacSha256Hex, verifyHmacSha256Hex } from "../../shared/hmac.js";
import { newId } from "../../shared/ids.js";
import type { Currency, PaymentProviderName } from "../../types/domain.js";
import type {
  CheckoutResult,
  CreateCheckoutCommand,
  NormalizedProviderEvent,
  PaymentProvider,
  RefundCommand,
} from "../PaymentProvider.js";

type HmacAdapterOptions = {
  name: PaymentProviderName;
  webhookSecret: string;
  publicKey?: string;
  checkoutBaseUrl: string;
  clock?: () => Date;
};

/**
 * Shared sandbox adapter used by PayPal and card processors in test/dev,
 * and as a stand-in until live provider credentials are configured.
 * Razorpay uses the same HMAC scheme for local tests.
 */
export function createHmacPaymentAdapter(options: HmacAdapterOptions): PaymentProvider {
  const clock = options.clock ?? (() => new Date());
  return {
    name: options.name,
    async createCheckout(command: CreateCheckoutCommand): Promise<CheckoutResult> {
      const providerOrderId = `${options.name}_order_${command.idempotencyKey.replace(/-/g, "").slice(0, 18)}`;
      const expires = new Date(clock().getTime() + 30 * 60 * 1000);
      const checkoutUrl = `${options.checkoutBaseUrl}/${options.name}?order=${providerOrderId}`;
      return {
        provider: options.name,
        providerOrderId,
        checkoutSessionId: providerOrderId,
        checkoutUrl,
        publicClientToken: options.publicKey ?? null,
        amountMinor: command.amountMinor,
        currency: command.currency,
        expiresAt: expires.toISOString(),
      };
    },
    verifyWebhook(rawBody, headers) {
      const signature = header(headers, webhookHeaderName(options.name));
      return verifyHmacSha256Hex(options.webhookSecret, rawBody, signature);
    },
    parseEvent(rawBody) {
      const payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
      const amountMinor = Number(payload.amountMinor ?? payload.amount ?? 0);
      const currency = String(payload.currency ?? "INR") as Currency;
      return {
        provider: options.name,
        eventId: String(payload.eventId ?? payload.id ?? newId()),
        eventType: String(payload.eventType ?? payload.event ?? "payment.captured"),
        providerOrderId: String(payload.providerOrderId ?? payload.order_id ?? ""),
        providerPaymentId: payload.providerPaymentId ? String(payload.providerPaymentId) : payload.payment_id ? String(payload.payment_id) : null,
        amountMinor,
        currency,
        status: normalizeStatus(String(payload.status ?? "captured")),
        paymentMethod: payload.paymentMethod ? String(payload.paymentMethod) : null,
        feeMinor: Number(payload.feeMinor ?? 0),
        taxMinor: Number(payload.taxMinor ?? 0),
        raw: payload,
      };
    },
    async refund(command: RefundCommand) {
      return {
        providerRefundId: `${options.name}_rfnd_${command.idempotencyKey.slice(0, 12)}`,
        status: "processed" as const,
      };
    },
  };
}

export function razorpayWebhookHeader(): string {
  return "x-razorpay-signature";
}

export function webhookHeaderName(provider: PaymentProviderName): string {
  if (provider === "razorpay") return "x-razorpay-signature";
  if (provider === "paypal") return "paypal-transmission-sig";
  return "x-card-signature";
}

export function signWebhook(secret: string, body: Buffer | string): string {
  return hmacSha256Hex(secret, body);
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeStatus(status: string): NormalizedProviderEvent["status"] {
  const value = status.toLowerCase();
  if (value.includes("fail")) return "failed";
  if (value.includes("refund")) return "refunded";
  if (value.includes("pend") || value.includes("authoriz")) return "pending";
  return "captured";
}
