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
 * Security: uses timing-safe HMAC verification
 */
export function createHmacPaymentAdapter(options: HmacAdapterOptions): PaymentProvider {
  if (!options.webhookSecret || options.webhookSecret.length < 8) {
    throw new Error(`Webhook secret required for ${options.name}`);
  }
  const clock = options.clock ?? (() => new Date());
  return {
    name: options.name,
    async createCheckout(command: CreateCheckoutCommand): Promise<CheckoutResult> {
      if (!Number.isFinite(command.amountMinor) || command.amountMinor <= 0) {
        throw new Error("Invalid amountMinor");
      }
      const providerOrderId = `${options.name}_order_${command.idempotencyKey.replace(/-/g, "").slice(0, 18)}`;
      const expires = new Date(clock().getTime() + 30 * 60 * 1000);
      const checkoutUrl = `${options.checkoutBaseUrl}/${options.name}?order=${encodeURIComponent(providerOrderId)}`;
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
      if (!signature) return false;
      return verifyHmacSha256Hex(options.webhookSecret, rawBody, signature);
    },
    parseEvent(rawBody) {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
      } catch {
        throw new Error("Invalid JSON payload");
      }
      const amountMinor = Number(payload.amountMinor ?? payload.amount ?? 0);
      if (!Number.isFinite(amountMinor) || amountMinor < 0) {
        throw new Error("Invalid amount in webhook");
      }
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
      if (!command.providerPaymentId) throw new Error("providerPaymentId required for refund");
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
  // Case-insensitive header lookup
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      if (Array.isArray(value)) return value[0] ?? "";
      return value ?? "";
    }
  }
  return "";
}

function normalizeStatus(status: string): NormalizedProviderEvent["status"] {
  const value = status.toLowerCase();
  if (value.includes("fail")) return "failed";
  if (value.includes("refund")) return "refunded";
  if (value.includes("pend") || value.includes("authoriz")) return "pending";
  return "captured";
}
