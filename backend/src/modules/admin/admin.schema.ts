import { z } from "zod";

export const AdminBookingQuerySchema = z.object({
  status: z
    .enum([
      "draft",
      "pending_payment",
      "paid_confirmed",
      "in_transit",
      "completed",
      "cancelled",
      "refunded",
    ])
    .optional(),
  ticketId: z.string().max(30).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const BookingIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateRefundSchema = z
  .object({
    bookingId: z.string().uuid(),
    reason: z.string().trim().min(5).max(500).refine((v) => !/<script/i.test(v), "Invalid reason content"),
    idempotencyKey: z.string().uuid(),
    amountMinor: z.number().int().positive().optional(),
  })
  .strict();
