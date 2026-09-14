import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import type { Repositories } from "../../db/types.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newGuestAccessToken, newId, newTicketId } from "../../shared/ids.js";
import { last4, maskEmail, maskPhone, phonesMatch } from "../../shared/privacy.js";
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

      const now = toIso(deps.clock.now());
      let ticketId = newTicketId(deps.clock);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!(await deps.db.bookings.ticketExists(ticketId))) break;
        ticketId = newTicketId(deps.clock);
      }
      if (await deps.db.bookings.ticketExists(ticketId)) {
        throw Errors.conflict("TICKET_GENERATION_FAILED", "Could not allocate a unique ticket ID.");
      }

      const record: BookingRecord = {
        id: newId(),
        ticketId,
        userId: null,
        guestAccessToken: newGuestAccessToken(),
        tripType: input.tripType,
        vehicleTier: input.vehicleTier,
        originName: input.originName,
        destinationName: input.destinationName,
        pickupAddress: input.pickupAddress,
        dropAddress: input.dropAddress ?? null,
        pickupDatetime: new Date(input.pickupDatetime).toISOString(),
        returnDatetime: input.returnDatetime ? new Date(input.returnDatetime).toISOString() : null,
        flightTrainNumber: input.flightTrainNumber ?? null,
        distanceKm: fare.distanceKm,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
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
        specialNotes: input.specialNotes ?? null,
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
      const tokenOk = Boolean(input.token && input.token === booking.guestAccessToken);
      const phoneOk = Boolean(input.phone && phonesMatch(booking.customerPhone, input.phone));
      if (!isAdmin && !tokenOk && !phoneOk) {
        throw Errors.unauthorized("Booking token or matching phone is required.");
      }

      const driver = booking.assignedDriverId
        ? await deps.db.drivers.getById(booking.assignedDriverId)
        : null;
      const revealDriver = Boolean(isAdmin || tokenOk);
      return projectBooking(booking, driver, { unmask: Boolean(isAdmin), revealDriver });
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
  options: { unmask: boolean; revealDriver: boolean },
) {
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
    customerPhone: options.unmask ? booking.customerPhone : maskPhone(booking.customerPhone),
    customerEmail: booking.customerEmail
      ? options.unmask
        ? booking.customerEmail
        : maskEmail(booking.customerEmail)
      : null,
    phoneLast4: last4(booking.customerPhone),
    fare: booking.fareSnapshot,
    assignedDriver: driver && options.revealDriver
      ? {
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
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
}
