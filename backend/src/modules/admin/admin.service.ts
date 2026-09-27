import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { FareRuleRecord, InquiryListFilter, PaymentListFilter, Repositories } from "../../db/types.js";
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
        distanceKm: booking.distanceKm,
        returnDatetime: booking.returnDatetime,
        baseFare: booking.baseFare,
        nightAllowance: booking.nightAllowance,
        driverAllowance: booking.driverAllowance,
        discountAmount: booking.discountAmount,
        specialNotes: booking.specialNotes,
        createdAt: booking.createdAt,
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
      const cfg = (dbRule?.config as any) || {};

      const mergedVehicles = Array.isArray(cfg.vehicles)
        ? VEHICLES.map((v) => {
            const override = cfg.vehicles.find((ov: any) => ov.tier === v.tier || ov.id === v.tier);
            return override ? { ...v, ...override } : v;
          })
        : VEHICLES;

      const mergedOutstation = cfg.outstation
        ? { ...OUTSTATION_RULES, ...cfg.outstation }
        : OUTSTATION_RULES;

      const mergedLocalPackages = cfg.localPackages
        ? { ...LOCAL_PACKAGES, ...cfg.localPackages }
        : LOCAL_PACKAGES;

      return {
        version: dbRule?.version || FARE_RULES_VERSION_DEFAULT,
        outstation: mergedOutstation,
        vehicles: mergedVehicles,
        packageUpgrades: PACKAGE_UPGRADES,
        localPackages: mergedLocalPackages,
        airportTransfers: AIRPORT_TRANSFERS,
        routes: ROUTES,
        packages: PACKAGES,
        defaultPromo: DEFAULT_PROMO,
        dynamicConfig: dbRule?.config ?? null,
      };
    },

    async updateFareRules(actor: any, updates: any, _ip?: string) {
      const now = new Date().toISOString();
      // fare_rules.version is VARCHAR(20) and both fare/audit IDs are UUIDs
      // in PostgreSQL. Keep generated values within those database contracts;
      // the memory repository does not enforce either constraint.
      const versionStr = updates.version || `r${Date.now().toString(36)}`;
      const record: FareRuleRecord = {
        id: newId(),
        version: versionStr,
        config: updates,
        effectiveFrom: updates.effectiveFrom || now,
        isActive: true,
        createdAt: now,
      };

      await deps.db.fareRules.save(record);

      if (deps.db.audit) {
        await deps.db.audit.append({
          id: newId(),
          action: "update_fare_rules",
          actorId: actor?.id || "super_admin",
          actorRole: (actor?.role as any) || "super_admin",
          resourceType: "fare_rules",
          resourceId: versionStr,
          before: null,
          after: updates,
          reason: `Fare rules updated by ${actor?.email || actor?.id || "admin"}`,
          requestId: `req_${Date.now().toString(36)}`,
          createdAt: now,
        });
      }

      return this.getFareRules();
    },
  };
}
