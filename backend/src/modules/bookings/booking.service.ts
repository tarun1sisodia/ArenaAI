import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import type { Repositories } from "../../db/types.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newGuestAccessToken, newId, newTicketId, timingSafeEqualString } from "../../shared/ids.js";
import { maskEmail, maskPhone, phonesMatch, sanitizeText } from "../../shared/privacy.js";
import { assertTransition } from "../../shared/stateMachine.js";
import type { AuthUser, BookingRecord, RefundRecord } from "../../types/domain.js";
import type { BookingSelection } from "../../shared/bookingSelection.js";
import { calculateFare, findRoute } from "../fares/fare.engine.js";
import { calculateCancellationRefund } from "../fares/cancellation.engine.js";
import { isGroupExceptionVehicle, LOCAL_PACKAGES, PACKAGES } from "../fares/fare.catalogue.js";
import type { CreateDraftBookingRequest } from "./booking.schema.js";

import type { createFareService } from "../fares/fare.service.js";

type ResolvedSelection = {
  selection: BookingSelection | null;
  selectedCatalogItemId: string | null;
};

async function resolveBookingSelection(
  selection: BookingSelection | undefined,
  db: Repositories,
): Promise<ResolvedSelection> {
  if (!selection) return { selection: null, selectedCatalogItemId: null };
  if (selection.kind === "outstation") {
    const route = findRoute(selection.originName, selection.destinationName);
    return {
      selection: { ...selection, id: route.id, name: `${selection.originName} → ${selection.destinationName}` },
      selectedCatalogItemId: null,
    };
  }

  if (selection.source === "legacy") {
    throw Errors.validation("Legacy selection markers are read-only and cannot be submitted as a new booking.");
  }

  if (selection.source === "catalog") {
    const item = await db.catalog.getById(selection.id);
    const availability = item && (item as typeof item & { availability?: string }).availability;
    if (!item || item.status !== "published" || availability === "unavailable") {
      throw Errors.notFound("CATALOG_ITEM_NOT_FOUND", "This published trip is no longer available. Choose another item from the current catalogue.");
    }
    if (selection.kind === "package" && item.type !== "package" && item.type !== "tour") {
      throw Errors.validation("The selected catalogue item is not a tour package.");
    }
    if (selection.kind === "local" && item.type !== "tour" && item.type !== "ride") {
      throw Errors.validation("The selected catalogue item is not a local tour or transfer.");
    }
    if (selection.slug !== item.slug) {
      throw Errors.conflict("BOOKING_SELECTION_CHANGED", "The selected catalogue item changed. Refresh the catalogue and review your trip again.");
    }
    return {
      selection: { ...selection, id: item.id, slug: item.slug, name: item.title },
      selectedCatalogItemId: item.id,
    };
  }

  if (selection.kind === "package") {
    const item = PACKAGES.find((candidate) => candidate.id === selection.id || candidate.slug === selection.slug || candidate.slug === selection.id);
    if (!item || item.slug !== selection.slug) {
      throw Errors.notFound("PACKAGE_NOT_FOUND", "This curated package is no longer available. Choose another package and review again.");
    }
    return {
      selection: { ...selection, id: item.id, slug: item.slug, name: item.name },
      selectedCatalogItemId: null,
    };
  }

  const key = selection.localPackageKey;
  if (selection.source !== "curated" || !key || !Object.prototype.hasOwnProperty.call(LOCAL_PACKAGES, key)) {
    throw Errors.notFound("LOCAL_PACKAGE_NOT_FOUND", "This local service is no longer available. Choose another service.");
  }
  const local = LOCAL_PACKAGES[key];
  return {
    selection: {
      ...selection,
      id: key,
      tripType: key === "airport-transfer" ? "airport-transfer" : "local-tour",
      name: local.label,
    },
    selectedCatalogItemId: null,
  };
}

function selectionForProjection(booking: BookingRecord): BookingSelection | null {
  if (booking.bookingSelection) return booking.bookingSelection;
  if (booking.packageId) {
    return {
      kind: "package",
      id: booking.packageId,
      slug: booking.packageId,
      source: "legacy",
      name: booking.fareSnapshot.label || booking.packageId,
    };
  }
  if (booking.tripType === "local-tour" || booking.tripType === "airport-transfer") {
    const key = booking.tripType === "airport-transfer" ? "airport-transfer" : "8hr-80km";
    return {
      kind: "local",
      id: key,
      source: "legacy",
      tripType: booking.tripType,
      localPackageKey: key,
      pickupLocation: booking.originName ?? "Agra",
      name: booking.fareSnapshot.label || "Local service",
    };
  }
  if (booking.originName && booking.destinationName) {
    let id = "legacy-outstation";
    try { id = findRoute(booking.originName, booking.destinationName).id; } catch { /* Keep the legacy marker. */ }
    return {
      kind: "outstation",
      id,
      tripType: booking.tripType === "round-trip" ? "round-trip" : "one-way",
      originName: booking.originName,
      destinationName: booking.destinationName,
      name: booking.fareSnapshot.label || `${booking.originName} → ${booking.destinationName}`,
    };
  }
  return null;
}

export function createBookingService(deps: {
  db: Repositories;
  clock: Clock;
  fareVersion: string;
  fareService?: ReturnType<typeof createFareService>;
}) {
  return {
    async createDraft(input: CreateDraftBookingRequest, owner?: AuthUser | null, repository: Repositories = deps.db): Promise<{
      booking: BookingRecord;
      guestAccessToken: string;
    }> {
      const database = repository;
      const resolvedSelection = await resolveBookingSelection(input.bookingSelection, database);
      // Server-authoritative fare calculation - client totals are ignored
      let fare: import("../fares/fare.types.js").FareEngineResult;
      if (deps.fareService) {
        fare = await deps.fareService.calculate({
          tripType: input.tripType,
          vehicleTier: input.vehicleTier,
          originName: input.originName,
          destinationName: input.destinationName,
          pickupDatetime: input.pickupDatetime,
          returnDatetime: input.returnDatetime,
          promoCode: input.promoCode,
          packageId: input.packageId,
          localPackageKey: input.localPackageKey,
        });
      } else {
        // Fallback for isolated test environments without fareService
        let promoLookup:
          | ((code: string) => {
              discount: number;
              minTotal: number;
              desc: string;
              isActive?: boolean;
              validFrom?: string | null;
              validTo?: string | null;
              maxRedemptions?: number | null;
              redemptionCount?: number;
              allowGroupVehicles?: boolean;
            } | null)
          | undefined;
        let promoAllowGroupVehicles = false;
        if (input.promoCode) {
          const promo = await database.promos.getByCode(input.promoCode);
          if (promo) {
            promoAllowGroupVehicles = promo.allowGroupVehicles;
            promoLookup = () => ({
              discount: promo.discountAmount,
              minTotal: promo.minTotal,
              desc: promo.description,
              isActive: promo.isActive,
              validFrom: promo.validFrom,
              validTo: promo.validTo,
              maxRedemptions: promo.maxRedemptions,
              redemptionCount: promo.redemptionCount,
              allowGroupVehicles: promo.allowGroupVehicles,
            });
          }
        }
        // SEC-005: server derives distance from route catalogue/estimator, ignoring any client-supplied value
        const serverDistanceKm = input.packageId
          ? 100
          : input.localPackageKey === "12hr-120km"
            ? 120
            : input.localPackageKey === "airport-transfer"
              ? 20
              : input.localPackageKey === "8hr-80km"
                ? 80
                : findRoute(input.originName, input.destinationName).km;

        fare = calculateFare({
          tripType: input.tripType,
          vehicleTier: input.vehicleTier,
          originName: input.originName,
          destinationName: input.destinationName,
          pickupDatetime: input.pickupDatetime,
          returnDatetime: input.returnDatetime,
          distanceKm: serverDistanceKm,
          promoCode: input.promoCode,
          promoAllowGroupVehicles,
          packageId: input.packageId,
          localPackageKey: input.localPackageKey,
          fareVersion: deps.fareVersion,
        });

        if (
          promoLookup &&
          input.promoCode &&
          fare.promoValid !== false &&
          (!isGroupExceptionVehicle(input.vehicleTier) || promoAllowGroupVehicles)
        ) {
          const { applyPromo } = await import("../fares/fare.engine.js");
          const subtotal = fare.baseFare + fare.nightAllowance + fare.driverAllowance;
          const promoEval = applyPromo(input.promoCode, subtotal, promoLookup);
          if (!promoEval.valid) {
            fare.promoValid = false;
            fare.discountAmount = 0;
            const { advanceOf } = await import("../../shared/money.js");
            fare.totalFare = subtotal;
            fare.advanceAmount = advanceOf(fare.totalFare);
            fare.balanceAmount = fare.totalFare - fare.advanceAmount;
          }
        }
      }

      // SEC-007: targeted phone+time-window query — no global page scan
      // Reliably detects duplicates regardless of overall booking volume
      const fiveMinAgo = new Date(deps.clock.now().getTime() - 5 * 60 * 1000).toISOString();
      const recentByPhone = await database.bookings.listByPhone(input.customerPhone, { from: fiveMinAgo });
      const duplicate = recentByPhone.find((b) => {
        if (b.pickupDatetime !== new Date(input.pickupDatetime).toISOString()) return false;
        if (resolvedSelection.selection) {
          const prior = selectionForProjection(b);
          return prior !== null && prior.kind === resolvedSelection.selection.kind && prior.id === resolvedSelection.selection.id;
        }
        return b.originName === input.originName && b.destinationName === input.destinationName;
      });
      if (duplicate) {
        throw Errors.conflict("DUPLICATE_BOOKING", "A similar booking was just created. Please check your bookings.", {
          ticketId: duplicate.ticketId,
        });
      }

      const now = toIso(deps.clock.now());
      let ticketId = newTicketId(deps.clock);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!(await database.bookings.ticketExists(ticketId))) break;
        ticketId = newTicketId(deps.clock);
      }
      if (await database.bookings.ticketExists(ticketId)) {
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
        userId: owner?.id ?? null,
        guestAccessToken: newGuestAccessToken(),
        tripType: fare.tripType,
        vehicleTier: input.vehicleTier,
        originName: resolvedSelection.selection && resolvedSelection.selection.kind !== "outstation"
          ? (resolvedSelection.selection.kind === "package" ? (input.originName?.trim() || "Agra") : null)
          : input.originName.trim(),
        destinationName: resolvedSelection.selection && resolvedSelection.selection.kind !== "outstation"
          ? (resolvedSelection.selection.kind === "package" ? (input.destinationName?.trim() || null) : null)
          : input.destinationName.trim(),
        bookingSelection: resolvedSelection.selection,
        selectedCatalogItemId: resolvedSelection.selectedCatalogItemId,
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
        specialNotes,
        packageId: input.bookingSelection ? null : input.packageId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      if (owner?.id && !(await database.profiles.getById(owner.id))) {
        try {
          await database.profiles.upsert({
            id: owner.id,
            fullName: customerName,
            phone: input.customerPhone,
            email: input.customerEmail ?? owner.email,
            role: "customer",
            createdAt: now,
            updatedAt: now,
          });
        } catch {
          throw Errors.conflict("PROFILE_CONTACT_CONFLICT", "The phone or email is already linked to another account.");
        }
      }
      const created = await database.bookings.create(record);
      return { booking: created, guestAccessToken: created.guestAccessToken };
    },

    async getOwnProfile(userId: string) {
      return deps.db.profiles.getById(userId);
    },

    async listOwned(userId: string, page = 1, pageSize = 20) {
      const result = await deps.db.bookings.list({ userId, page: Math.max(1, page), pageSize: Math.min(50, Math.max(1, pageSize)) });
      return { items: result.items.map((booking) => projectBooking(booking, { unmask: false })), total: result.total, page: Math.max(1, page), pageSize: Math.min(50, Math.max(1, pageSize)) };
    },

    async getOwned(userId: string, bookingId: string) {
      const booking = await deps.db.bookings.getById(bookingId);
      if (!booking || booking.userId !== userId) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
      return projectBooking(booking, { unmask: false });
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

      const isAdmin = Boolean(input.actor && input.actor.role === "super_admin");

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

      return projectBooking(booking, { unmask: Boolean(isAdmin) });
    },

    async transition(
      bookingId: string,
      to: BookingRecord["status"],
      expectedVersion?: number,
    ): Promise<BookingRecord> {
      return deps.db.transaction(async (trx) => {
        const booking = await trx.bookings.getById(bookingId);
        if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
        if (expectedVersion !== undefined && booking.version !== expectedVersion) {
          throw Errors.conflict("VERSION_CONFLICT", "Booking was modified concurrently.");
        }
        assertTransition(booking.status, to);
        const now = deps.clock.now();
        const updated: BookingRecord = {
          ...booking,
          status: to,
          version: booking.version + 1,
          updatedAt: toIso(now),
        };

        if (to === "cancelled") {
          const payments = await trx.payments.listByBookingId(booking.id);
          const capturedPayments = payments.filter((p) => p.status === "captured");
          if (capturedPayments.length > 0) {
            const totalPaidMinor = capturedPayments.reduce((sum, p) => sum + p.amountMinor, 0);
            const pickupTime = new Date(booking.pickupDatetime).getTime();
            const noticeHours = Math.max(0, (pickupTime - now.getTime()) / (1000 * 60 * 60));

            const isTour =
              booking.bookingSelection?.kind === "package" ||
              (Boolean(booking.packageId) &&
                booking.tripType !== "local-tour" &&
                booking.tripType !== "airport-transfer");
            const policyType = isTour ? "tour_package" : "cab";

            const dbPolicies = await trx.cancellationPolicies.list();
            const refundEval = calculateCancellationRefund({
              policyType,
              noticeHours,
              paidAmountMinor: totalPaidMinor,
              customPolicies: dbPolicies,
            });

            const primaryPayment = capturedPayments[0];
            // A zero-refund policy means the advance is retained. The refunds
            // table intentionally enforces amount_minor > 0, so do not create
            // a synthetic zero-value refund row that would fail at the DB.
            if (primaryPayment && refundEval.refundAmountMinor > 0) {
              const refundRecord: RefundRecord = {
                id: newId(),
                paymentId: primaryPayment.id,
                bookingId: booking.id,
                providerRefundId: null,
                amountMinor: refundEval.refundAmountMinor,
                currency: primaryPayment.currency ?? "INR",
                reason: `Cancellation (${refundEval.noticePeriodText}): ${refundEval.ruleText}`,
                status: refundEval.refundAmountMinor > 0 ? "pending" : "processed",
                idempotencyKey: `cancel-${booking.id}-v${booking.version + 1}`,
                createdAt: toIso(now),
              };
              await trx.refunds.create(refundRecord);
            }
          }
        }

        return trx.bookings.update(updated);
      });
    },
  };
}

export function projectBooking(
  booking: BookingRecord,
  options: { unmask: boolean },
) {
  // Mask PII by default, unmask only for authorized admin
  const customerPhone = options.unmask ? booking.customerPhone : maskPhone(booking.customerPhone);
  const customerEmail = booking.customerEmail
    ? options.unmask
      ? booking.customerEmail
      : maskEmail(booking.customerEmail)
    : null;
  const bookingSelection = selectionForProjection(booking);
  const routeSelection = bookingSelection?.kind === "outstation" ? bookingSelection : null;

  return {
    id: booking.id,
    ticketId: booking.ticketId,
    status: booking.status,
    tripType: booking.tripType,
    vehicleTier: booking.vehicleTier,
    originName: routeSelection?.originName ?? (bookingSelection ? null : booking.originName),
    destinationName: routeSelection?.destinationName ?? (bookingSelection ? null : booking.destinationName),
    bookingSelection,
    selectedCatalogItemId: booking.selectedCatalogItemId,
    pickupAddress: booking.pickupAddress,
    dropAddress: booking.dropAddress,
    pickupDatetime: booking.pickupDatetime,
    returnDatetime: booking.returnDatetime,
    distanceKm: booking.distanceKm,
    customerName: booking.customerName,
    customerPhone,
    customerEmail,
    // phoneLast4 removed from public response (SEC-008) — reduces phone enumeration search space
    fare: booking.fareSnapshot,

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
