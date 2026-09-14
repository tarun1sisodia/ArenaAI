import type { Env } from "../../config/env.js";
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newId, sha256Hex } from "../../shared/ids.js";
import { convertInrPaiseToMinor, rupeesToPaise } from "../../shared/money.js";
import { assertTransition } from "../../shared/stateMachine.js";
import type {
  Currency,
  PaymentProviderName,
  PaymentRecord,
} from "../../types/domain.js";
import type { PaymentProviderRegistry } from "../../providers/PaymentProvider.js";
import { assertBookingPayable } from "../bookings/booking.service.js";
import type { createNotificationService } from "../notifications/notification.service.js";
import type { CreatePaymentCheckoutRequest } from "./payment.schema.js";

const ALLOWED: Record<PaymentProviderName, Currency[]> = {
  razorpay: ["INR"],
  paypal: ["USD", "EUR", "GBP"],
  card: ["INR", "USD", "EUR", "GBP"],
};

export function createPaymentService(deps: {
  db: Repositories;
  clock: Clock;
  env: Env;
  providers: PaymentProviderRegistry;
  notifications: ReturnType<typeof createNotificationService>;
}) {
  return {
    async createCheckout(input: CreatePaymentCheckoutRequest) {
      const existing = await deps.db.payments.getByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return toPublicCheckout(existing);
      }

      const booking = await deps.db.bookings.getByTicketId(input.ticketId);
      if (!booking || booking.guestAccessToken !== input.guestAccessToken) {
        throw Errors.notFound("BOOKING_NOT_FOUND", "The booking could not be found or verified.");
      }
      assertBookingPayable(booking);
      assertProviderCurrency(input.provider, input.currency);

      const open = await deps.db.payments.getOpenByBookingId(booking.id);
      if (open && new Date(open.expiresAt).getTime() > deps.clock.now().getTime()) {
        return toPublicCheckout(open);
      }

      const inrPaise = rupeesToPaise(booking.advanceAmount);
      const amountMinor = convertInrPaiseToMinor(inrPaise, input.currency, {
        USD: deps.env.FX_USD_PER_INR,
        EUR: deps.env.FX_EUR_PER_INR,
        GBP: deps.env.FX_GBP_PER_INR,
      });

      const adapter = deps.providers[input.provider];
      const checkout = await adapter.createCheckout({
        bookingId: booking.id,
        ticketId: booking.ticketId,
        amountMinor,
        currency: input.currency,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
        idempotencyKey: input.idempotencyKey,
      });

      const now = toIso(deps.clock.now());
      if (booking.status === "draft") {
        assertTransition(booking.status, "pending_payment");
        await deps.db.bookings.update({
          ...booking,
          status: "pending_payment",
          updatedAt: now,
        });
      }

      const payment: PaymentRecord = {
        id: newId(),
        bookingId: booking.id,
        provider: input.provider,
        providerOrderId: checkout.providerOrderId,
        providerPaymentId: null,
        checkoutSessionId: checkout.checkoutSessionId,
        checkoutUrl: checkout.checkoutUrl,
        publicClientToken: checkout.publicClientToken,
        amountMinor: checkout.amountMinor,
        currency: checkout.currency,
        inrAmountPaise: inrPaise,
        status: "pending",
        paymentMethod: null,
        feeMinor: 0,
        taxMinor: 0,
        idempotencyKey: input.idempotencyKey,
        webhookEventId: null,
        reconciliationStatus: "pending",
        failureReason: null,
        verifiedAt: null,
        expiresAt: checkout.expiresAt,
        createdAt: now,
        updatedAt: now,
      };
      const created = await deps.db.payments.create(payment);
      return toPublicCheckout(created, booking.ticketId);
    },

    async getStatus(paymentId: string, token: string) {
      const payment = await deps.db.payments.getById(paymentId);
      if (!payment) throw Errors.notFound("PAYMENT_NOT_FOUND", "Payment not found.");
      const booking = await deps.db.bookings.getById(payment.bookingId);
      if (!booking || booking.guestAccessToken !== token) {
        throw Errors.unauthorized("Booking token is required.");
      }
      return {
        paymentId: payment.id,
        ticketId: booking.ticketId,
        status: payment.status,
        reconciliationStatus: payment.reconciliationStatus,
        provider: payment.provider,
        currency: payment.currency,
        amountMinor: payment.amountMinor,
        bookingStatus: booking.status,
      };
    },

    async reconcileWebhook(input: {
      provider: PaymentProviderName;
      rawBody: Buffer;
      headers: Record<string, string | string[] | undefined>;
    }) {
      const adapter = deps.providers[input.provider];
      if (!adapter.verifyWebhook(input.rawBody, input.headers)) {
        throw Errors.unauthorized("Invalid provider webhook signature.");
      }

      const event = adapter.parseEvent(input.rawBody);
      const stored = await deps.db.webhooks.record({
        id: newId(),
        provider: input.provider,
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.raw,
        payloadHash: sha256Hex(input.rawBody),
        processed: false,
        receivedAt: toIso(deps.clock.now()),
      });
      if (!stored.created) {
        return { duplicate: true, status: "already_processed" as const };
      }

      const payment = await deps.db.payments.getByProviderOrderId(event.providerOrderId);
      if (!payment) {
        return { duplicate: false, status: "unknown_order" as const };
      }

      if (event.status === "failed") {
        await deps.db.payments.update({
          ...payment,
          status: "failed",
          webhookEventId: event.eventId,
          reconciliationStatus: "matched",
          failureReason: event.eventType,
          updatedAt: toIso(deps.clock.now()),
        });
        return { duplicate: false, status: "failed" as const };
      }

      if (event.status !== "captured") {
        return { duplicate: false, status: "ignored" as const };
      }

      const amountOk = event.amountMinor === payment.amountMinor;
      const currencyOk = event.currency === payment.currency;
      if (!amountOk || !currencyOk) {
        await deps.db.payments.update({
          ...payment,
          status: "needs_review",
          webhookEventId: event.eventId,
          reconciliationStatus: "needs_review",
          failureReason: `amount/currency mismatch event=${event.amountMinor} ${event.currency} order=${payment.amountMinor} ${payment.currency}`,
          updatedAt: toIso(deps.clock.now()),
        });
        return { duplicate: false, status: "needs_review" as const };
      }

      await deps.db.transaction(async (trx) => {
        const freshPayment = await trx.payments.getById(payment.id);
        const booking = await trx.bookings.getById(payment.bookingId);
        if (!freshPayment || !booking) return;
        if (freshPayment.status === "captured" && booking.status === "paid_confirmed") {
          return;
        }
        const now = toIso(deps.clock.now());
        await trx.payments.update({
          ...freshPayment,
          providerPaymentId: event.providerPaymentId,
          status: "captured",
          paymentMethod: event.paymentMethod,
          feeMinor: event.feeMinor,
          taxMinor: event.taxMinor,
          webhookEventId: event.eventId,
          reconciliationStatus: "matched",
          verifiedAt: now,
          updatedAt: now,
        });
        if (booking.status !== "paid_confirmed") {
          assertTransition(booking.status, "paid_confirmed");
          await trx.bookings.update({
            ...booking,
            status: "paid_confirmed",
            version: booking.version + 1,
            updatedAt: now,
          });
        }
      });

      const booking = await deps.db.bookings.getById(payment.bookingId);
      if (booking) {
        await deps.notifications.queuePaymentConfirmed(booking);
      }
      return { duplicate: false, status: "captured" as const };
    },

    async refund(input: {
      bookingId: string;
      reason: string;
      idempotencyKey: string;
      actorId: string;
    }) {
      const existing = await deps.db.refunds.getByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;

      const booking = await deps.db.bookings.getById(input.bookingId);
      if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
      if (booking.status !== "paid_confirmed") {
        throw Errors.conflict("REFUND_NOT_ELIGIBLE", "Booking is not eligible for refund.");
      }
      const payments = await deps.db.payments.listByBookingId(booking.id);
      const captured = payments.find((item) => item.status === "captured");
      if (!captured?.providerPaymentId) {
        throw Errors.conflict("REFUND_NOT_ELIGIBLE", "No captured payment exists for this booking.");
      }

      const adapter = deps.providers[captured.provider];
      const result = await adapter.refund({
        providerPaymentId: captured.providerPaymentId,
        amountMinor: captured.amountMinor,
        currency: captured.currency,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
      });

      const now = toIso(deps.clock.now());
      const refund = await deps.db.refunds.create({
        id: newId(),
        paymentId: captured.id,
        bookingId: booking.id,
        providerRefundId: result.providerRefundId,
        amountMinor: captured.amountMinor,
        currency: captured.currency,
        reason: input.reason,
        status: result.status === "processed" ? "processed" : "pending",
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
      });

      if (result.status === "processed") {
        await deps.db.payments.update({
          ...captured,
          status: "refunded",
          updatedAt: now,
        });
        assertTransition(booking.status, "refunded");
        await deps.db.bookings.update({
          ...booking,
          status: "refunded",
          version: booking.version + 1,
          updatedAt: now,
        });
      }
      return refund;
    },
  };
}

function assertProviderCurrency(provider: PaymentProviderName, currency: Currency): void {
  if (!ALLOWED[provider].includes(currency)) {
    throw new AppError(
      "UNSUPPORTED_PAYMENT_OPTION",
      `${provider} does not accept ${currency}.`,
      400,
    );
  }
}

function toPublicCheckout(payment: PaymentRecord, ticketId?: string) {
  return {
    paymentId: payment.id,
    ticketId,
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    checkoutUrl: payment.checkoutUrl,
    publicClientToken: payment.publicClientToken,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    expiresAt: payment.expiresAt,
    status: payment.status,
  };
}

export function assertNoClientAmount(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const record = body as Record<string, unknown>;
  if ("amount" in record || "advanceAmount" in record || "amountMinor" in record) {
    delete record.amount;
    delete record.advanceAmount;
    delete record.amountMinor;
  }
}
