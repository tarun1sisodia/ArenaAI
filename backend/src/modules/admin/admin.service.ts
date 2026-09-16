import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import type { InquiryListFilter, PaymentListFilter, Repositories } from "../../db/types.js";
import { maskEmail, maskPhone } from "../../shared/privacy.js";
import type { BookingRecord, InquiryStatus } from "../../types/domain.js";
import {
  AIRPORT_TRANSFERS,
  DEFAULT_PROMO,
  FARE_RULES_VERSION_DEFAULT,
  LOCAL_PACKAGES,
  OUTSTATION_RULES,
  PACKAGE_UPGRADES,
  PACKAGES,
  ROUTES,
  VEHICLES,
} from "../fares/fare.catalogue.js";

export function createAdminService(deps: { db: Repositories; clock?: Clock }) {
  return {
    async listBookings(filter: {
      status?: BookingRecord["status"];
      ticketId?: string;
      page?: number;
      pageSize?: number;
    }) {
      const result = await deps.db.bookings.list(filter);
      const items = result.items.map((booking) => ({
        id: booking.id,
        ticketId: booking.ticketId,
        status: booking.status,
        tripType: booking.tripType,
        vehicleTier: booking.vehicleTier,
        originName: booking.originName,
        destinationName: booking.destinationName,
        pickupDatetime: booking.pickupDatetime,
        customerName: booking.customerName,
        customerPhone: maskPhone(booking.customerPhone),
        customerEmail: booking.customerEmail ? maskEmail(booking.customerEmail) : null,
        advanceAmount: booking.advanceAmount,
        totalFare: booking.totalFare,
        version: booking.version,
      }));
      return {
        total: result.total,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        items,
        bookings: items,
      };
    },

    async listAuditLogs(limit = 100) {
      return deps.db.audit.list(limit);
    },

    async listInquiries(filter: InquiryListFilter) {
      const result = await deps.db.inquiries.list(filter);
      return {
        total: result.total,
        page: filter.page ?? 1,
        limit: filter.limit ?? 50,
        items: result.items,
        inquiries: result.items,
      };
    },

    async updateInquiry(id: string, updates: { status?: InquiryStatus; note?: string }) {
      const inquiry = await deps.db.inquiries.getById(id);
      if (!inquiry) {
        throw Errors.notFound("INQUIRY_NOT_FOUND", "Inquiry not found.");
      }
      if (updates.status) {
        inquiry.status = updates.status;
      }
      if (updates.note) {
        inquiry.notes = [...(inquiry.notes ?? []), updates.note];
      }
      inquiry.updatedAt = toIso(deps.clock ? deps.clock.now() : new Date());
      return deps.db.inquiries.update(inquiry);
    },

    async listPayments(filter: PaymentListFilter) {
      const result = await deps.db.payments.list(filter);
      return {
        total: result.total,
        totalCapturedPaise: result.totalCapturedPaise,
        totalRefundedPaise: result.totalRefundedPaise,
        page: filter.page ?? 1,
        limit: filter.limit ?? 50,
        items: result.items,
        payments: result.items,
      };
    },

    async getFareRules() {
      const dbRule = await deps.db.fareRules.getActive();
      return {
        version: dbRule?.version || FARE_RULES_VERSION_DEFAULT,
        outstation: OUTSTATION_RULES,
        vehicles: VEHICLES,
        packageUpgrades: PACKAGE_UPGRADES,
        localPackages: LOCAL_PACKAGES,
        airportTransfers: AIRPORT_TRANSFERS,
        routes: ROUTES,
        packages: PACKAGES,
        defaultPromo: DEFAULT_PROMO,
        dynamicConfig: dbRule?.config ?? null,
      };
    },
  };
}
