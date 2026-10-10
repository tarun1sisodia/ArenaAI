import { z } from "zod";
import { IsoDatetimeSchema } from "../../../shared/datetime.js";
import { BookingSelectionSchema } from "../../../shared/bookingSelection.js";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../../types/domain.js";

export const CalculateFareBaseSchema = z
  .object({
    tripType: z.enum(TRIP_TYPES).optional(),
    vehicleTier: z.enum(VEHICLE_TIERS),
    originName: z.string().trim().min(2).max(120).optional(),
    destinationName: z.string().trim().min(2).max(120).optional(),
    bookingSelection: BookingSelectionSchema.optional(),
    pickupDatetime: IsoDatetimeSchema,
    returnDatetime: IsoDatetimeSchema.optional(),
    // Accepted only for compatibility with older clients; the server never trusts a client distance.
    distanceKm: z.number().positive().max(5000).finite().optional(),
    promoCode: z
      .string()
      .trim()
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid promo code format")
      .optional(),
    packageId: z.string().trim().max(80).optional(),
    localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
  })
  .strict();

export const CalculateFareSchema = CalculateFareBaseSchema
  .superRefine((data, ctx) => {
    if (
      data.bookingSelection &&
      "source" in data.bookingSelection &&
      data.bookingSelection.source === "historical"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingSelection", "source"],
        message: "Historical booking selections are read-only.",
      });
    }
    if (!data.bookingSelection) {
      if (!data.tripType)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tripType"],
          message: "Trip type is required.",
        });
      if (!data.originName)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["originName"],
          message: "Origin is required for direct fare requests.",
        });
      if (!data.destinationName)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationName"],
          message: "Destination is required for direct fare requests.",
        });
      return;
    }
    if (
      data.bookingSelection.kind === "outstation" &&
      data.bookingSelection.originName.toLowerCase() ===
        data.bookingSelection.destinationName.toLowerCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingSelection", "destinationName"],
        message: "Origin and destination must differ for outstation trips.",
      });
    }
  })
  .refine(
    (data) =>
      !data.returnDatetime ||
      new Date(data.returnDatetime).getTime() >= new Date(data.pickupDatetime).getTime(),
    {
      message: "Return must be after pickup",
      path: ["returnDatetime"],
    },
  )
  .transform((data) => {
    const selection = data.bookingSelection;
    if (!selection)
      return {
        ...data,
        tripType: data.tripType!,
        originName: data.originName!,
        destinationName: data.destinationName!,
      };
    if (selection.kind === "outstation") {
      return {
        ...data,
        tripType: selection.tripType,
        originName: selection.originName,
        destinationName: selection.destinationName,
      };
    }
    if (selection.kind === "local") {
      return {
        ...data,
        tripType: selection.tripType,
        originName: selection.pickupLocation,
        destinationName:
          selection.transferTarget ??
          (selection.tripType === "airport-transfer" ? "Agra Airport" : ""),
        packageId: selection.source === "catalog" ? selection.id : undefined,
        localPackageKey: selection.source === "curated" ? selection.localPackageKey : undefined,
      };
    }
    return {
      ...data,
      tripType: "round-trip" as const,
      originName: data.originName || "",
      destinationName: data.destinationName || "",
      packageId: selection.id,
      localPackageKey: undefined,
    };
  });

export type CalculateFareRequest = z.infer<typeof CalculateFareSchema>;
