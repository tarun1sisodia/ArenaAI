import { z } from "zod";

export const AdminBookingQuerySchema = z.object({
  status: z
    .enum([
      "draft",
      "pending_payment",
      "paid_confirmed",
      "driver_assigned",
      "in_transit",
      "completed",
      "cancelled",
      "refunded",
    ])
    .optional(),
  ticketId: z.string().optional(),
  driverId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const AssignBookingSchema = z
  .object({
    driverId: z.string().uuid(),
    vehicleId: z.string().min(1).optional(),
    note: z.string().max(500).optional(),
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: z.string().uuid().optional(),
  })
  .strict();

export const BookingIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateRefundSchema = z
  .object({
    bookingId: z.string().uuid(),
    reason: z.string().min(5).max(500),
    idempotencyKey: z.string().uuid(),
  })
  .strict();
