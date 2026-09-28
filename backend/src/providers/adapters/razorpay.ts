import { verifyHmacSha256Hex } from "../../shared/hmac.js";
import { newId } from "../../shared/ids.js";
import type { Currency } from "../../types/domain.js";
import type {
  CheckoutResult,
  CreateCheckoutCommand,
  NormalizedProviderEvent,
  PaymentProvider,
  RefundCommand,
} from "../PaymentProvider.js";
import { createHmacPaymentAdapter } from "./hmacCheckout.js";

type RazorpayOptions = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isProduction?: boolean;
  fetchImpl?: typeof fetch;
};

export function createRazorpayAdapter(options: RazorpayOptions): PaymentProvider {
  const keyId = (options.keyId || "").trim().replace(/^['"]|['"]$/g, "");
  const keySecret = (options.keySecret || "").trim().replace(/^['"]|['"]$/g, "");
  const webhookSecret = (options.webhookSecret || "").trim().replace(/^['"]|['"]$/g, "");
  const isExplicitHmacTest = !options.isProduction && (!keyId || keyId.startsWith("rzp_test_local") || !keySecret);

  if (options.isProduction && !/^rzp_live_[A-Za-z0-9_-]+$/.test(keyId)) {
    throw new Error("Production Razorpay requires an rzp_live_ key. Test or local keys are prohibited.");
  }

  if (isExplicitHmacTest) {
    return createHmacPaymentAdapter({
      name: "razorpay",
      webhookSecret: webhookSecret || keySecret || "whsec_razorpay_test",
      publicKey: keyId,
      checkoutBaseUrl: "https://checkout.razorpay.com",
    });
  }

  if (options.isProduction && (!keySecret || !webhookSecret)) {
    throw new Error("Production Razorpay credentials and webhook secret are mandatory.");
  }

  if (!keySecret || !webhookSecret) {
    throw new Error("Razorpay webhook secret is required");
  }

  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    name: "razorpay",
    async createCheckout(command: CreateCheckoutCommand): Promise<CheckoutResult> {
      if (!Number.isFinite(command.amountMinor) || command.amountMinor <= 0) {
        throw new Error("Invalid amountMinor for Razorpay");
      }
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetchImpl("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: command.amountMinor,
          currency: command.currency,
          receipt: command.ticketId,
          payment_capture: 1,
          notes: {
            booking_id: command.bookingId,
            ticket_id: command.ticketId,
          },
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const keyPrefix = keyId ? `${keyId.slice(0, 8)}...` : "none";
        throw new Error(
          `Razorpay order failed: ${response.status} ${text.slice(0, 200)} [Key: ${keyPrefix}, KeyLen: ${keyId.length}, SecretLen: ${keySecret.length}]`,
        );
      }
      const body = (await response.json()) as { id: string; amount: number; currency: string };
      if (!body.id || !Number.isFinite(body.amount) || body.amount !== command.amountMinor || body.currency !== command.currency) {
        throw new Error(
          `Invalid Razorpay order response: expected ${command.amountMinor} ${command.currency}, got ${body?.amount} ${body?.currency}`,
        );
      }
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      return {
        provider: "razorpay",
        providerOrderId: body.id,
        checkoutSessionId: body.id,
        checkoutUrl: null,
        publicClientToken: keyId,
        amountMinor: body.amount,
        currency: body.currency as Currency,
        expiresAt: expires.toISOString(),
      };
    },
    verifyWebhook(rawBody, headers) {
      const signature = String(headers["x-razorpay-signature"] ?? headers["X-Razorpay-Signature"] ?? headers["x-razorpay-signature".toLowerCase()] ?? "");
      if (!signature) {
        // Try case-insensitive lookup
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase() === "x-razorpay-signature") {
            const sig = Array.isArray(v) ? v[0] : v;
            if (sig) return verifyHmacSha256Hex(webhookSecret, rawBody, String(sig));
          }
        }
        return false;
      }
      return verifyHmacSha256Hex(webhookSecret, rawBody, signature);
    },
    parseEvent(rawBody) {
      let payload: RazorpayWebhook;
      try {
        payload = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhook;
      } catch {
        throw new Error("Invalid Razorpay webhook JSON");
      }
      const entity = payload.payload?.payment?.entity ?? payload.payload?.order?.entity;
      if (!entity) throw new Error("Missing entity in Razorpay webhook");
      const amount = Number(entity?.amount ?? 0);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid amount in Razorpay webhook");
      const currency = String(entity?.currency ?? "INR") as Currency;
      const status = mapRazorpayStatus(payload.event, entity?.status);
      return {
        provider: "razorpay",
        eventId: payload.id || entity?.id || newId(),
        eventType: payload.event,
        providerOrderId: String(entity?.order_id ?? entity?.id ?? ""),
        providerPaymentId: payload.payload?.payment?.entity?.id ?? null,
        amountMinor: amount,
        currency,
        status,
        paymentMethod: entity?.method ?? null,
        feeMinor: Number(entity?.fee ?? 0),
        taxMinor: Number(entity?.tax ?? 0),
        raw: payload,
      };
    },
    async refund(command: RefundCommand) {
      if (!command.providerPaymentId) throw new Error("providerPaymentId required");
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetchImpl(`https://api.razorpay.com/v1/payments/${command.providerPaymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "X-Payout-Idempotency": command.idempotencyKey,
        },
        body: JSON.stringify({ amount: command.amountMinor, notes: { reason: command.reason } }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Razorpay refund failed: ${response.status} ${text.slice(0, 200)}`);
      }
      const body = (await response.json()) as { id: string; status: string };
      if (!body.id) throw new Error("Invalid Razorpay refund response");
      return {
        providerRefundId: body.id,
        status: body.status === "processed" ? "processed" : "pending",
      };
    },
  };
}

type RazorpayWebhook = {
  id?: string;
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: RazorpayPaymentEntity };
  };
};

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  fee?: number;
  tax?: number;
};

function mapRazorpayStatus(event: string, status?: string): NormalizedProviderEvent["status"] {
  if (event.includes("failed") || status === "failed") return "failed";
  if (event.includes("refund") || status === "refunded") return "refunded";
  // order.paid contains an order entity but may not contain the payment ID
  // required for refunds. Confirm only from payment.captured or an entity status.
  if (event === "payment.captured" || status === "captured") return "captured";
  return "pending";
}
