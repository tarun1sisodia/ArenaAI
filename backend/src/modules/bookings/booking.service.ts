import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import type { Repositories } from "../../db/types.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newGuestAccessToken, newId, newTicketId, timingSafeEqualString } from "../../shared/ids.js";
import { last4, maskEmail, maskPhone, phonesMatch, sanitizeText } from "../../shared/privacy.js";
import { assertTransition } from "../../shared/stateMachine.js";
import type { AuthUser, BookingRecord, DriverRecord } from "../../types/domain.js";
import { calculateFare } from "../fares/fare.engine.js";
import type { CreateDraftBookingRequest } from "./booking.schema.js";

export function createBookingService(deps: {
  db: Repositories;
  clock: Clock;
  fareVersion: string;
}) {
  return {
    async createDraft(input: CreateDraftBookingRequest): Promise<{
      booking: BookingRecord;
      guestAccessToken: string;
    }> {
      // Server-authoritative fare calculation - client totals are ignored
      // Validate promo against DB if present
      let promoLookup: ((code: string) => { discount: number; minTotal: number; desc: string; isActive?: boolean; validFrom?: string | null; validTo?: string | null; maxRedemptions?: number | null; redemptionCount?: number } | null) | undefined;
      if (input.promoCode) {
        const promo = await deps.db.promos.getByCode(input.promoCode);
        if (promo) {
          promoLookup = () => ({
            discount: promo.discountAmount,
            minTotal: promo.minTotal,
            desc: promo.description,
            isActive: promo.isActive,
            validFrom: promo.validFrom,
            validTo: promo.validTo,
            maxRedemptions: promo.maxRedemptions,
            redemptionCount: promo.redemptionCount,
          });
        }
      }
      const fare = calculateFare({
        tripType: input.tripType,
        vehicleTier: input.vehicleTier,
        originName: input.originName,
        destinationName: input.destinationName,
        pickupDatetime: input.pickupDatetime,
        returnDatetime: input.returnDatetime,
        distanceKm: input.distanceKm,
        promoCode: input.promoCode,
        packageId: input.packageId,
        localPackageKey: input.localPackageKey,
        fareVersion: deps.fareVersion,
      });
      // Re-evaluate promo with DB lookup if available
      if (promoLookup && input.promoCode) {
        const { applyPromo } = await import("../fares/fare.engine.js");
        const subtotal = fare.baseFare + fare.nightAllowance + fare.driverAllowance;
        const promoEval = applyPromo(input.promoCode, subtotal, promoLookup);
        if (!promoEval.valid) {
          // If promo invalid per DB (expired, limit reached), override fare to show invalid
          fare.promoValid = false;
          fare.discountAmount = 0;
          const { advanceOf } = await import("../../shared/money.js");
          fare.totalFare = subtotal;
          fare.advanceAmount = advanceOf(fare.totalFare);
          fare.balanceAmount = fare.totalFare - fare.advanceAmount;
        }
      }

      // Check for duplicate booking attempt: same phone + same pickup time within 5 min window
      // Prevents accidental double-click / retry creating duplicate tickets
      const recent = await deps.db.bookings.list({
        page: 1,
        pageSize: 20,
      });
      const fiveMinAgo = new Date(deps.clock.now().getTime() - 5 * 60 * 1000).toISOString();
      const duplicate = recent.items.find(
        (b) =>
          b.customerPhone === input.customerPhone &&
          b.originName === input.originName &&
          b.destinationName === input.destinationName &&
          b.pickupDatetime === new Date(input.pickupDatetime).toISOString() &&
          b.createdAt >= fiveMinAgo,
      );
      if (duplicate) {
        throw Errors.conflict("DUPLICATE_BOOKING", "A similar booking was just created. Please check your bookings.", {
          ticketId: duplicate.ticketId,
        });
      }

      const now = toIso(deps.clock.now());
      let ticketId = newTicketId(deps.clock);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!(await deps.db.bookings.ticketExists(ticketId))) break;
        ticketId = newTicketId(deps.clock);
      }
      if (await deps.db.bookings.ticketExists(ticketId)) {
        throw Errors.conflict("TICKET_GENERATION_FAILED", "Could not allocate a unique ticket ID.");
      }

      // Sanitize free-text fields
      const customerName = sanitizeText(input.customerName, 80);
      const pickupAddress = sanitizeText(input.pickupAddress, 300);
      const dropAddress = input.dropAddress ? sanitizeText(input.dropAddress, 300) : null;
      const specialNotes = input.specialNotes ? sanitizeText(input.specialNotes, 500) : null;

      const record: BookingRecord = {
        id: newId(),
        ticketId,
        userId: null,
        guestAccessToken: newGuestAccessToken(),
        tripType: input.tripType,
        vehicleTier: input.vehicleTier,
        originName: input.originName.trim(),
        destinationName: input.destinationName.trim(),
        pickupAddress,
        dropAddress,
        pickupDatetime: new Date(input.pickupDatetime).toISOString(),
        returnDatetime: input.returnDatetime ? new Date(input.returnDatetime).toISOString() : null,
        flightTrainNumber: input.flightTrainNumber?.trim() ?? null,
        distanceKm: fare.distanceKm,
        customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail?.toLowerCase().trim() ?? null,
        baseFare: fare.baseFare,
        nightAllowance: fare.nightAllowance,
        driverAllowance: fare.driverAllowance,
        discountAmount: fare.discountAmount,
        promoCode: fare.promoValid ? fare.promoCode : input.promoCode?.toUpperCase() ?? null,
        totalFare: fare.totalFare,
        advanceAmount: fare.advanceAmount,
        balanceAmount: fare.balanceAmount,
        fareRulesVersion: fare.fareVersion,
        fareSnapshot: fare,
        status: "pending_payment",
        version: 1,
        assignedDriverId: null,
        assignedVehicleId: null,
        specialNotes,
        packageId: input.packageId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      const created = await deps.db.bookings.create(record);
      return { booking: created, guestAccessToken: created.guestAccessToken };
    },

    async getVerifiedBooking(input: {
      ticketId: string;
      token?: string;
      phone?: string;
      actor?: AuthUser | null;
    }) {
      const booking = await deps.db.bookings.getByTicketId(input.ticketId);
      if (!booking) {
        throw Errors.notFound("BOOKING_NOT_FOUND", "The booking could not be found or verified.");
      }

      const isAdmin =
        input.actor &&
        ["dispatcher", "finance_operator", "super_admin"].includes(input.actor.role);

      // Secure token comparison using timing-safe equal
      const tokenOk = Boolean(
        input.token &&
          input.token.length >= 16 &&
          booking.guestAccessToken.length === input.token.length &&
          timingSafeEqualString(booking.guestAccessToken, input.token),
      );

      // Phone verification requires exact match, no suffix matching
      const phoneOk = Boolean(input.phone && phonesMatch(booking.customerPhone, input.phone));

      if (!isAdmin && !tokenOk && !phoneOk) {
        throw Errors.unauthorized("Booking token or matching phone is required.");
      }

      const driver = booking.assignedDriverId
        ? await deps.db.drivers.getById(booking.assignedDriverId)
        : null;

      // Only reveal driver contact to token holders or admins, not to phone-only verifiers
      // This prevents phone enumeration leaking driver PII
      const revealDriver = Boolean(isAdmin || tokenOk);
      const unmask = Boolean(isAdmin);

      return projectBooking(booking, driver, { unmask, revealDriver, isAdmin: Boolean(isAdmin) });
    },

    async transition(bookingId: string, to: BookingRecord["status"]): Promise<BookingRecord> {
      return deps.db.transaction(async (trx) => {
        const booking = await trx.bookings.getById(bookingId);
        if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
        assertTransition(booking.status, to);
        const updated: BookingRecord = {
          ...booking,
          status: to,
          version: booking.version + 1,
          updatedAt: toIso(deps.clock.now()),
        };
        return trx.bookings.update(updated);
      });
    },
  };
}

export function projectBooking(
  booking: BookingRecord,
  driver: DriverRecord | null,
  options: { unmask: boolean; revealDriver: boolean; isAdmin?: boolean },
) {
  // Mask PII by default, unmask only for authorized admin
  const customerPhone = options.unmask ? booking.customerPhone : maskPhone(booking.customerPhone);
  const customerEmail = booking.customerEmail
    ? options.unmask
      ? booking.customerEmail
      : maskEmail(booking.customerEmail)
    : null;

  return {
    id: booking.id,
    ticketId: booking.ticketId,
    status: booking.status,
    tripType: booking.tripType,
    vehicleTier: booking.vehicleTier,
    originName: booking.originName,
    destinationName: booking.destinationName,
    pickupAddress: booking.pickupAddress,
    dropAddress: booking.dropAddress,
    pickupDatetime: booking.pickupDatetime,
    returnDatetime: booking.returnDatetime,
    distanceKm: booking.distanceKm,
    customerName: booking.customerName,
    customerPhone,
    customerEmail,
    phoneLast4: last4(booking.customerPhone),
    fare: booking.fareSnapshot,
    assignedDriver: driver && options.revealDriver
      ? {
          id: driver.id,
          fullName: driver.fullName,
          // Only reveal full phone to admin or token holder, still masked for others
          phone: options.unmask || options.revealDriver ? driver.phone : maskPhone(driver.phone),
          rating: driver.rating,
          policeVerified: driver.policeVerified,
        }
      : null,
    version: booking.version,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export function assertBookingPayable(booking: BookingRecord): void {
  if (booking.status !== "pending_payment" && booking.status !== "draft") {
    throw new AppError("BOOKING_NOT_PAYABLE", "This booking cannot accept a new checkout.", 409);
  }
  // Additional check: pickup must not be in past
  if (new Date(booking.pickupDatetime).getTime() < Date.now() - 60 * 60 * 1000) {
    throw new AppError("BOOKING_EXPIRED", "This booking's pickup time has passed.", 410);
  }
}
