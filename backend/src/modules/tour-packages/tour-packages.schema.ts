// backend/src/modules/tour-packages/tour-packages.schema.ts
import { z } from "zod";

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim());

const cleanOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim())
    .optional();

const base = z
  .object({
    package_code: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{2,80}$/)
      .refine(
        (value) => !/^\d+-btn-/.test(value) && !/command/i.test(value) && !/--/.test(value),
        "Slug contains a reserved or junk pattern."
      ),
    name: cleanText(2, 100),
    duration_text: cleanText(2, 60),
    days: z.number().int().min(1).max(30).default(1),
    nights: z.number().int().min(0).max(30).default(0),
    base_tier_code: cleanText(2, 40).default("sedan"),
    starting_price_inr: z.number().positive().max(1_000_000).finite(),
    fleet_prices: z.record(z.number().positive().max(1_000_000).finite()),
    night_charge_inr: z.number().nonnegative().max(100_000).default(0),
    inclusions_highlight: cleanOptional(500),
    inclusions_note: cleanOptional(1000),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_active: z.boolean().default(true),
  })
  .strict();

export const CreateTourPackageSchema = base;
export const UpdateTourPackageSchema = base.partial().omit({ status: true }).extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});
export const TourPackageIdSchema = z.object({ id: z.string().uuid() });
export const TourPackageCodeSchema = z.object({ code: z.string().trim().min(2).max(80) });
export const TourPackageQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const TourPackageUpgradeSchema = z
  .object({
    id: z.string().uuid().optional(),
    package_id: z.string().uuid().nullable().optional(),
    tier_code: cleanText(2, 40),
    passenger_note: cleanOptional(120),
    surcharge_inr: z.number().nonnegative().max(100_000).default(0),
  })
  .strict();

export type CreateTourPackageInput = z.infer<typeof CreateTourPackageSchema>;
export type UpdateTourPackageInput = z.infer<typeof UpdateTourPackageSchema>;
export type TourPackageUpgradeInput = z.infer<typeof TourPackageUpgradeSchema>;
