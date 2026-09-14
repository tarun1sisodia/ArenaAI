import { z } from "zod";

export const AutocompleteQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .refine((v) => !/<script|javascript:/i.test(v), "Invalid query"),
});
