import { z } from "zod";
import { CreateDraftBookingSchema } from "../bookings/booking.schema.js";

export const CreateBookingIntentSchema = CreateDraftBookingSchema.and(z.object({ idempotencyKey: z.string().uuid() }));
export type CreateBookingIntentRequest = z.infer<typeof CreateBookingIntentSchema>;

export const BookingIntentParamSchema = z.object({ id: z.string().uuid() });
export const BookingIntentFinalizeSchema = z.object({ acceptUpdatedFare: z.boolean().optional() }).strip();
export type BookingIntentFinalizeRequest = z.infer<typeof BookingIntentFinalizeSchema>;

export const BookingIntentSecretSchema = z.string().min(16).max(128);
