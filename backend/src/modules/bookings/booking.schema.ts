import { z } from "zod";
import { IsoDatetimeSchema } from "../../shared/datetime.js";
import { TICKET_ID_PATTERN } from "../../shared/ids.js";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../types/domain.js";

export const CreateDraftBookingSchema = z
  .object({
    tripType: z.enum(TRIP_TYPES),
    vehicleTier: z.enum(VEHICLE_TIERS),
    originName: z.string().trim().min(2).max(120),
    destinationName: z.string().trim().min(2).max(120),
    pickupAddress: z.string().trim().min(5).max(300),
    dropAddress: z.string().trim().max(300).optional(),
    pickupDatetime: IsoDatetimeSchema,
    returnDatetime: IsoDatetimeSchema.optional(),
    distanceKm: z.number().positive().max(5000),
    customerName: z.string().trim().min(2).max(80),
    customerPhone: z.string().regex(/^\+?[0-9]{10,14}$/, "Valid phone number required"),
    customerEmail: z.string().email().optional(),
    flightTrainNumber: z.string().trim().max(50).optional(),
    specialNotes: z.string().max(500).optional(),
    promoCode: z.string().trim().max(30).optional(),
    packageId: z.string().trim().max(80).optional(),
    localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
  })
  .strip();

export type CreateDraftBookingRequest = z.infer<typeof CreateDraftBookingSchema>;

export const TicketIdParamSchema = z.object({
  ticketId: z.string().regex(TICKET_ID_PATTERN),
});

export const BookingAccessQuerySchema = z.object({
  token: z.string().min(16).optional(),
  phone: z.string().min(4).optional(),
  phoneLast4: z.string().regex(/^[0-9]{4}$/).optional(),
});
