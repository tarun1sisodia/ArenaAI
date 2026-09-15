import { z } from "zod";
import { IsoDatetimeSchema } from "../../shared/datetime.js";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../types/domain.js";

export const CalculateFareSchema = z
  .object({
    tripType: z.enum(TRIP_TYPES),
    vehicleTier: z.enum(VEHICLE_TIERS),
    originName: z.string().trim().min(2).max(120),
    destinationName: z.string().trim().min(2).max(120),
    pickupDatetime: IsoDatetimeSchema,
    returnDatetime: IsoDatetimeSchema.optional(),
    distanceKm: z.number().positive().max(5000).finite(),
    promoCode: z
      .string()
      .trim()
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid promo code format")
      .optional(),
    packageId: z.string().trim().max(80).optional(),
    localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
  })
  .strict()
  .refine((data) => {
    if (!data.returnDatetime) return true;
    return new Date(data.returnDatetime).getTime() >= new Date(data.pickupDatetime).getTime();
  }, {
    message: "Return must be after pickup",
    path: ["returnDatetime"],
  });

export type CalculateFareRequest = z.infer<typeof CalculateFareSchema>;

export const FareResponseSchema = z.object({
  baseFare: z.number().nonnegative(),
  nightAllowance: z.number().nonnegative(),
  driverAllowance: z.number().nonnegative(),
  discountAmount: z.number().nonnegative(),
  totalFare: z.number().positive(),
  advanceAmount: z.number().min(1),
  balanceAmount: z.number().nonnegative(),
  currency: z.literal("INR"),
  fareVersion: z.string(),
  label: z.string(),
  duration: z.string(),
  distanceKm: z.number().nonnegative(),
  tripType: z.enum(TRIP_TYPES),
  vehicleTier: z.enum(VEHICLE_TIERS),
  promoCode: z.string().nullable(),
  promoValid: z.boolean(),
  roundMultiplierApplied: z.boolean(),
  rules: z.array(z.string()),
});
