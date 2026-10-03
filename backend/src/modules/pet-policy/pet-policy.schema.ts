// backend/src/modules/pet-policy/pet-policy.schema.ts
import { z } from "zod";

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim());

export const UpdatePetPolicySchema = z
  .object({
    is_offered: z.boolean().optional(),
    seat_protection_note: cleanText(1, 300).optional(),
    breed_restriction_note: cleanText(1, 300).optional(),
    comfort_stop_note: cleanText(1, 300).optional(),
    booking_instruction: cleanText(1, 500).optional(),
  })
  .strict();

export type UpdatePetPolicyInput = z.infer<typeof UpdatePetPolicySchema>;
