import { z } from "zod";
import { IsoDatetimeSchema } from "../../shared/datetime.js";
import { TICKET_ID_PATTERN } from "../../shared/ids.js";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../types/domain.js";

// Secure validation: prevent XSS, injection, and unrealistic values
const SafeNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-zA-Z\s.'-]+$/, "Name must contain only letters, spaces, and .'-")
  .transform((v) => v.replace(/<[^>]*>/g, "").trim());

const SafeAddressSchema = z
  .string()
  .trim()
  .min(5)
  .max(300)
  .refine((v) => !/<script|javascript:|on\w+=/i.test(v), "Invalid characters in address");

const SafeNotesSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !/<script|javascript:|on\w+=/i.test(v), "Invalid characters in notes")
  .optional();

export const CreateDraftBookingSchema = z
  .object({
    tripType: z.enum(TRIP_TYPES),
    vehicleTier: z.enum(VEHICLE_TIERS).default("sedan"),
    originName: z.string().trim().min(2).max(120),
    destinationName: z.string().trim().min(2).max(120),
    pickupAddress: SafeAddressSchema,
    dropAddress: z.string().trim().max(300).optional().refine((v) => !v || !/<script/i.test(v), "Invalid drop address"),
    pickupDatetime: IsoDatetimeSchema.refine((value) => {
      const date = new Date(value);
      const now = new Date();
      // Must be at least 1 hour in future (allow 5 min clock skew)
      const minFuture = new Date(now.getTime() + 55 * 60 * 1000);
      if (date < minFuture) return false;
      // Not more than 365 days ahead
      const maxFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      return date <= maxFuture;
    }, "Pickup must be 1 hour to 365 days in future"),
    returnDatetime: IsoDatetimeSchema.optional().refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + 395 * 24 * 60 * 60 * 1000);
      return date <= maxFuture;
    }, "Return datetime too far in future"),
    // distanceKm removed from client schema (SEC-005) — server derives it from originName/destinationName
    customerName: SafeNameSchema,
    customerPhone: z.string().regex(/^\+?[0-9]{10,14}$/, "Valid phone number required"),
    customerEmail: z.string().email().max(255).optional(),
    flightTrainNumber: z.string().trim().max(50).optional().refine((v) => !v || /^[A-Za-z0-9-_ ]+$/.test(v), "Invalid flight/train number"),
    specialNotes: SafeNotesSchema,
    promoCode: z
      .string()
      .trim()
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Promo code must be alphanumeric with dash/underscore")
      .optional(),
    packageId: z.string().trim().max(80).optional(),
    localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
  })
  .strip()
  .refine((data) => data.originName.toLowerCase() !== data.destinationName.toLowerCase() || data.tripType === "local-tour" || data.localPackageKey !== undefined, {
    message: "Origin and destination must differ for non-local trips",
    path: ["destinationName"],
  })
  .refine((data) => {
    if (!data.returnDatetime) return true;
    const pickup = new Date(data.pickupDatetime).getTime();
    const ret = new Date(data.returnDatetime).getTime();
    return ret >= pickup;
  }, {
    message: "Return datetime must be at or after pickup",
    path: ["returnDatetime"],
  })
  .refine((data) => {
    if (!data.returnDatetime) return true;
    const pickup = new Date(data.pickupDatetime).getTime();
    const ret = new Date(data.returnDatetime).getTime();
    const diffDays = (ret - pickup) / (24 * 60 * 60 * 1000);
    return diffDays <= 30;
  }, {
    message: "Return cannot be more than 30 days after pickup",
    path: ["returnDatetime"],
  });

export type CreateDraftBookingRequest = z.infer<typeof CreateDraftBookingSchema>;

export const TicketIdParamSchema = z.object({
  ticketId: z.string().regex(TICKET_ID_PATTERN),
});

export const BookingAccessQuerySchema = z.object({
  token: z.string().min(16).max(128).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/).optional(),
});

export const MyBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export const BookingIdParamSchema = z.object({ bookingId: z.string().uuid() });
