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
  ticketId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const BookingIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateRefundSchema = z
  .object({
    bookingId: z.string().uuid(),
    reason: z.string().min(5).max(500),
    idempotencyKey: z.string().uuid(),
    amountMinor: z.number().int().positive().optional(),
  })
  .strict();
