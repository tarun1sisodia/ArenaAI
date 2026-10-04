import { z } from "zod";

export const PromoCodeFormat = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, "Promo code must be 3-30 uppercase alphanumeric characters, dashes, or underscores.");

const optionalDate = z
  .union([z.string().datetime(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val === undefined ? null : val));

export const CreatePromoSchema = z
  .object({
    code: PromoCodeFormat,
    discountAmount: z.number().positive("Discount amount must be greater than 0"),
    minTotal: z.number().nonnegative("Minimum total cannot be negative").default(0),
    description: z.string().trim().min(1, "Description is required"),
    isActive: z.boolean().default(true),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    validFrom: optionalDate,
    validTo: optionalDate,
    allowGroupVehicles: z.boolean().default(false),
    isBroadcast: z.boolean().default(false),
  })
  .strict();

export const UpdatePromoSchema = z
  .object({
    code: PromoCodeFormat.optional(),
    discountAmount: z.number().positive("Discount amount must be greater than 0").optional(),
    minTotal: z.number().nonnegative("Minimum total cannot be negative").optional(),
    description: z.string().trim().min(1, "Description cannot be empty").optional(),
    isActive: z.boolean().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    validFrom: optionalDate,
    validTo: optionalDate,
    allowGroupVehicles: z.boolean().optional(),
    isBroadcast: z.boolean().optional(),
  })
  .strict();

export const PromoIdParamsSchema = z
  .object({
    id: z.string().uuid("Invalid promo code UUID"),
  })
  .strict();

export type CreatePromoInput = z.input<typeof CreatePromoSchema>;
export type UpdatePromoInput = z.input<typeof UpdatePromoSchema>;

