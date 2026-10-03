import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import type { Repositories } from "../../db/types.js";
import { Errors } from "../../shared/errors.js";
import { newGuestAccessToken, newId, sha256Hex, timingSafeEqualString } from "../../shared/ids.js";
import type { AuthUser, BookingIntentRecord, FareBreakdown, ProfileRecord } from "../../types/domain.js";
import { projectBooking } from "../bookings/booking.service.js";
import type { createBookingService } from "../bookings/booking.service.js";
import type { createFareService } from "../fares/fare.service.js";
import type { CreateBookingIntentRequest } from "./booking-intent.schema.js";
import type { CreateDraftBookingRequest } from "../bookings/booking.schema.js";

const INTENT_TTL_MS = 15 * 60 * 1000;

function quoteEqual(a: FareBreakdown, b: FareBreakdown): boolean {
  return a.totalFare === b.totalFare && a.advanceAmount === b.advanceAmount && a.balanceAmount === b.balanceAmount;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function safeQuote(record: BookingIntentRecord) {
  return { ...record.quote, totalFare: record.quoteTotalFare, advanceAmount: record.quoteAdvanceAmount, balanceAmount: record.quoteBalanceAmount };
}

export function createBookingIntentService(deps: {
  db: Repositories;
  clock: Clock;
  fareService: ReturnType<typeof createFareService>;
  bookingService: ReturnType<typeof createBookingService>;
}) {
  const quoteFor = async (payload: Omit<CreateBookingIntentRequest, "idempotencyKey">) => deps.fareService.calculate({
    tripType: payload.tripType,
    vehicleTier: payload.vehicleTier,
    originName: payload.originName,
    destinationName: payload.destinationName,
    pickupDatetime: payload.pickupDatetime,
    returnDatetime: payload.returnDatetime,
    promoCode: payload.promoCode,
    packageId: payload.packageId,
    localPackageKey: payload.localPackageKey,
  });

  const verifySecret = (intent: BookingIntentRecord, raw: string | undefined) => {
    if (!raw || raw.length < 16 || !timingSafeEqualString(intent.resumeSecretHash, sha256Hex(raw))) {
      throw Errors.unauthorized("A valid booking intent secret is required.");
    }
  };

  const issueContinuation = async (existing: BookingIntentRecord, payload: Omit<CreateBookingIntentRequest, "idempotencyKey">) => {
    if (stableJson(existing.payload) !== stableJson(payload)) {
      throw Errors.conflict("IDEMPOTENCY_KEY_REUSED", "This request key was already used for different booking details. Start again to create a new booking.");
    }
    if (existing.consumedAt || existing.resultingBookingId) {
      throw Errors.conflict("BOOKING_INTENT_ALREADY_FINALIZED", "This booking was already finalized. Open My Bookings to continue.");
    }
    if (new Date(existing.expiresAt).getTime() <= deps.clock.now().getTime()) {
      throw Errors.conflict("BOOKING_INTENT_EXPIRED", "This booking intent has expired.");
    }
    // A retry after a lost create response receives a fresh one-time continuation secret.
    const rawSecret = newGuestAccessToken();
    const updated = await deps.db.bookingIntents.update({
      ...existing,
      resumeSecretHash: sha256Hex(rawSecret),
      updatedAt: toIso(deps.clock.now()),
    });
    return { intentId: updated.id, resumeSecret: rawSecret, quote: safeQuote(updated), expiresAt: updated.expiresAt };
  };

  return {
    async create(input: CreateBookingIntentRequest) {
      const payload = { ...input } as unknown as CreateDraftBookingRequest;
      delete (payload as { idempotencyKey?: string }).idempotencyKey;
      const existing = await deps.db.bookingIntents.getByIdempotencyKey(input.idempotencyKey);
      if (existing) return issueContinuation(existing, payload);

      const quote = await quoteFor(payload);
      const rawSecret = newGuestAccessToken();
      const now = deps.clock.now();
      const intent: BookingIntentRecord = {
        id: newId(), idempotencyKey: input.idempotencyKey, resumeSecretHash: sha256Hex(rawSecret),
        payload, quote, quoteTotalFare: quote.totalFare, quoteAdvanceAmount: quote.advanceAmount,
        quoteBalanceAmount: quote.balanceAmount, expiresAt: new Date(now.getTime() + INTENT_TTL_MS).toISOString(),
        fareReconfirmationPending: false,
        createdAt: toIso(now), updatedAt: toIso(now), consumedAt: null, claimedUserId: null, resultingBookingId: null,
      };
      try {
        const stored = await deps.db.bookingIntents.create(intent);
        return { intentId: stored.id, resumeSecret: rawSecret, quote: safeQuote(stored), expiresAt: stored.expiresAt };
      } catch (error) {
        // A concurrent retry may win the unique idempotency-key insert. Re-read and
        // rotate its one-time secret only when the same normalized payload was used.
        const concurrent = await deps.db.bookingIntents.getByIdempotencyKey(input.idempotencyKey);
        if (concurrent) return issueContinuation(concurrent, payload);
        throw error;
      }
    },

    async recover(id: string, rawSecret: string | undefined) {
      const intent = await deps.db.bookingIntents.getById(id);
      if (!intent || intent.consumedAt || new Date(intent.expiresAt).getTime() <= deps.clock.now().getTime()) {
        throw Errors.notFound("BOOKING_INTENT_NOT_FOUND", "Booking intent not found or expired.");
      }
      verifySecret(intent, rawSecret);
      return { intentId: intent.id, payload: intent.payload, quote: safeQuote(intent), expiresAt: intent.expiresAt };
    },

    async finalize(id: string, rawSecret: string | undefined, actor: AuthUser, acceptUpdatedFare = false) {
      if (!actor?.id) throw Errors.unauthorized();
      const result = await deps.db.transaction(async (trx) => {
        const intent = await trx.bookingIntents.getById(id);
        if (!intent) throw Errors.notFound("BOOKING_INTENT_NOT_FOUND", "Booking intent not found.");
        verifySecret(intent, rawSecret);
        if (intent.claimedUserId && intent.claimedUserId !== actor.id) throw Errors.forbidden("This booking intent belongs to another account.");
        if (intent.resultingBookingId && intent.claimedUserId === actor.id) {
          const replay = await trx.bookings.getById(intent.resultingBookingId);
          if (replay) return { kind: "finalized" as const, booking: projectBooking(replay, { unmask: false }), fare: replay.fareSnapshot, replay: true };
        }
        if (new Date(intent.expiresAt).getTime() <= deps.clock.now().getTime()) {
          throw Errors.conflict("BOOKING_INTENT_EXPIRED", "This booking intent has expired.");
        }
        const payload = intent.payload as CreateDraftBookingRequest;
        const currentQuote = await quoteFor(payload);
        if (!quoteEqual(intent.quote, currentQuote)) {
          const updated: BookingIntentRecord = {
            ...intent,
            quote: currentQuote,
            quoteTotalFare: currentQuote.totalFare,
            quoteAdvanceAmount: currentQuote.advanceAmount,
            quoteBalanceAmount: currentQuote.balanceAmount,
            fareReconfirmationPending: true,
            updatedAt: toIso(deps.clock.now()),
          };
          await trx.bookingIntents.update(updated);
          // Return a marker so the database transaction commits the updated quote;
          // the HTTP conflict is raised only after that commit.
          return { kind: "reconfirm" as const, quote: safeQuote(updated) };
        }
        if (intent.fareReconfirmationPending && !acceptUpdatedFare) {
          return { kind: "reconfirm" as const, quote: safeQuote(intent) };
        }
        const existingProfile = await trx.profiles.getById(actor.id);
        if (!existingProfile) {
          const profile: ProfileRecord = {
            id: actor.id,
            fullName: payload.customerName,
            phone: payload.customerPhone,
            email: payload.customerEmail ?? actor.email,
            role: "customer",
            createdAt: toIso(deps.clock.now()),
            updatedAt: toIso(deps.clock.now()),
          };
          try { await trx.profiles.upsert(profile); }
          catch { throw Errors.conflict("PROFILE_CONTACT_CONFLICT", "The phone or email is already linked to another account."); }
        }
        const created = await deps.bookingService.createDraft(payload, actor, trx);
        const consumed: BookingIntentRecord = {
          ...intent,
          quote: currentQuote,
          quoteTotalFare: currentQuote.totalFare,
          quoteAdvanceAmount: currentQuote.advanceAmount,
          quoteBalanceAmount: currentQuote.balanceAmount,
          fareReconfirmationPending: false,
          claimedUserId: actor.id,
          resultingBookingId: created.booking.id,
          consumedAt: toIso(deps.clock.now()),
          updatedAt: toIso(deps.clock.now()),
        };
        await trx.bookingIntents.update(consumed);
        return { kind: "finalized" as const, booking: projectBooking(created.booking, { unmask: false }), fare: created.booking.fareSnapshot, replay: false };
      });
      if (result.kind === "reconfirm") {
        throw Errors.conflict("FARE_RECONFIRMATION_REQUIRED", "The fare changed. Confirm the updated fare before finalizing.", { intentId: id, quote: result.quote });
      }
      return result;
    },
  };
}
