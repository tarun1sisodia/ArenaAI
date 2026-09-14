import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { maskEmail, maskPhone } from "../../shared/privacy.js";
import { assertTransition, isPaidEnoughForAssignment } from "../../shared/stateMachine.js";
import type { AuthUser, BookingRecord } from "../../types/domain.js";
import { toInternalVehicleId } from "../fares/fare.catalogue.js";
import type { createNotificationService } from "../notifications/notification.service.js";

export function createDispatchService(deps: {
  db: Repositories;
  clock: Clock;
  notifications: ReturnType<typeof createNotificationService>;
}) {
  return {
    async listBookings(filter: {
      status?: BookingRecord["status"];
      ticketId?: string;
      driverId?: string;
      page?: number;
      pageSize?: number;
    }) {
      const result = await deps.db.bookings.list(filter);
      return {
        total: result.total,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        items: result.items.map((booking) => ({
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
          assignedDriverId: booking.assignedDriverId,
          version: booking.version,
        })),
      };
    },

    async assign(input: {
      bookingId: string;
      driverId: string;
      vehicleId?: string;
      note?: string;
      expectedVersion?: number;
      actor: AuthUser;
      requestId: string;
    }) {
      return deps.db.transaction(async (trx) => {
        const booking = await trx.bookings.getById(input.bookingId);
        if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
        if (input.expectedVersion !== undefined && input.expectedVersion !== booking.version) {
          throw new AppError("ASSIGNMENT_CONFLICT", "Booking was updated by another dispatcher.", 409);
        }
        if (!isPaidEnoughForAssignment(booking.status) && booking.status !== "driver_assigned") {
          throw new AppError(
            "ASSIGNMENT_NOT_ALLOWED",
            "Driver assignment is allowed only after payment confirmation.",
            409,
          );
        }

        const driver = await trx.drivers.getById(input.driverId);
        if (!driver) throw Errors.notFound("DRIVER_NOT_FOUND", "Driver not found.");
        if (driver.currentStatus === "off_duty") {
          throw Errors.conflict("DRIVER_UNAVAILABLE", "Driver is not available.");
        }

        const vehicleId = input.vehicleId ?? driver.assignedVehicleId;
        if (vehicleId) {
          const vehicle = await trx.vehicles.getById(vehicleId) ?? await trx.vehicles.getById(toInternalVehicleId(booking.vehicleTier));
          if (input.vehicleId && !vehicle) {
            throw Errors.notFound("VEHICLE_NOT_FOUND", "Vehicle not found.");
          }
        }

        const now = toIso(deps.clock.now());
        if (booking.status !== "driver_assigned") {
          assertTransition(booking.status, "driver_assigned");
        }
        const updated = await trx.bookings.update({
          ...booking,
          status: "driver_assigned",
          assignedDriverId: driver.id,
          assignedVehicleId: vehicleId ?? booking.assignedVehicleId,
          specialNotes: input.note ? `${booking.specialNotes ?? ""}\n${input.note}`.trim() : booking.specialNotes,
          version: booking.version + 1,
          updatedAt: now,
        });
        await trx.drivers.update({ ...driver, currentStatus: "on_trip" });
        await trx.audit.append({
          id: newId(),
          actorId: input.actor.id,
          actorRole: input.actor.role,
          resourceType: "booking",
          resourceId: booking.id,
          action: "assign",
          before: { status: booking.status, assignedDriverId: booking.assignedDriverId, version: booking.version },
          after: { status: updated.status, assignedDriverId: updated.assignedDriverId, version: updated.version },
          reason: input.note ?? null,
          requestId: input.requestId,
          createdAt: now,
        });
        return { booking: updated, driver };
      });
    },

    async notifyDriver(input: { bookingId: string; actor: AuthUser; requestId: string }) {
      const booking = await deps.db.bookings.getById(input.bookingId);
      if (!booking) throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
      if (booking.status !== "driver_assigned" || !booking.assignedDriverId) {
        throw Errors.conflict("ASSIGNMENT_NOT_ALLOWED", "Assign a driver before notifying the customer.");
      }
      const driver = await deps.db.drivers.getById(booking.assignedDriverId);
      if (!driver) throw Errors.notFound("DRIVER_NOT_FOUND", "Driver not found.");
      await deps.notifications.queueDriverAssigned(booking, driver);
      await deps.db.audit.append({
        id: newId(),
        actorId: input.actor.id,
        actorRole: input.actor.role,
        resourceType: "booking",
        resourceId: booking.id,
        action: "notify-driver",
        before: null,
        after: { driverId: driver.id },
        reason: null,
        requestId: input.requestId,
        createdAt: toIso(deps.clock.now()),
      });
      return { queued: true, driverName: driver.fullName };
    },
  };
}
