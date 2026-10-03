// backend/src/modules/monuments/monuments.schema.ts
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

export const MonumentIdSchema = z.object({
  id: z.string().uuid(),
});

export const UpdateMonumentSchema = z
  .object({
    name: cleanText(2, 100).optional(),
    visiting_hours: cleanText(2, 100).optional(),
    closed_note: cleanText(1, 100).optional(),
    historical_context: cleanOptional(500),
    sort_order: z.number().int().min(0).max(100).optional(),
  })
  .strict();

export type UpdateMonumentInput = z.infer<typeof UpdateMonumentSchema>;
