import { z } from "zod";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../../types/domain.js";

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
  billedKm: z.number().nonnegative(),
  alwaysRoundTrip: z.boolean(),
  tripType: z.enum(TRIP_TYPES),
  vehicleTier: z.enum(VEHICLE_TIERS),
  promoCode: z.string().nullable(),
  promoValid: z.boolean(),
  roundMultiplierApplied: z.boolean(),
  rules: z.array(z.string()),
});

export type FareResponse = z.infer<typeof FareResponseSchema>;
