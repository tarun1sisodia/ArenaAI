// backend/src/modules/company-profile/company-profile.schema.ts
import { z } from "zod";

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim());

export const UpdateCompanyProfileSchema = z
  .object({
    brand_name: cleanText(2, 100).optional(),
    office_address: cleanText(5, 300).optional(),
    primary_phone: cleanText(5, 30).optional(),
    whatsapp_number: cleanText(5, 30).optional(),
    email: cleanText(3, 100).optional(),
    gstin: cleanText(3, 30).optional(),
    operating_hours: cleanText(2, 100).optional(),
    maps_location: cleanText(2, 200).optional(),
    dossier_version: cleanText(1, 20).optional(),
    dossier_status: z.enum(["pending_review", "signed_off", "modifications_needed"]).optional(),
  })
  .strict();

export type UpdateCompanyProfileInput = z.infer<typeof UpdateCompanyProfileSchema>;
