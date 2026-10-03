// backend/src/modules/dossier-signoffs/dossier-signoffs.schema.ts
import { z } from "zod";

const cleanOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim())
    .optional();

export const DossierSignoffIdSchema = z.object({
  id: z.string().uuid(),
});

export const UpdateDossierSignoffSchema = z
  .object({
    status: z.enum(["pending", "approved", "modification_requested"]).optional(),
    client_notes: cleanOptional(1000),
  })
  .strict();

export type UpdateDossierSignoffInput = z.infer<typeof UpdateDossierSignoffSchema>;
