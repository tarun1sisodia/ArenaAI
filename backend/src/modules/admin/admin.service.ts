import type { Clock } from "../../shared/clock.js";
import type { Repositories } from "../../db/types.js";
import { maskEmail, maskPhone } from "../../shared/privacy.js";
import type { BookingRecord } from "../../types/domain.js";

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
  };
}
