import { z } from "zod";
import { REVIEW_STATUSES } from "../../types/domain.js";

export const SubmitReviewSchema = z
  .object({
    catalogItemId: z.string().min(1).max(80).optional(),
    catalogSlug: z.string().min(2).max(80).optional(),
    bookingTicketId: z.string().regex(/^AGR-[0-9]{8}-[0-9]{4}$/).optional(),
    guestAccessToken: z.string().min(16).max(128).optional(),
    displayName: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z\s.'-]+$/, "Display name must contain only letters")
      .transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    rating: z.number().int().min(1).max(5),
    reviewText: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .refine((v) => !/<script|javascript:/i.test(v), "Invalid review content")
      .transform((v) => v.replace(/<[^>]*>/g, "").trim())
      .refine((v) => {
        // Prevent repeated character spam like "aaaaa..."
        const repeated = /(.)\1{9,}/;
        return !repeated.test(v);
      }, "Review contains spam patterns"),
    socialProfileUrl: z.string().url().max(500).optional(),
    socialPlatform: z.string().trim().max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.catalogItemId || data.catalogSlug), {
    message: "Either catalogItemId or catalogSlug is required",
    path: ["catalogItemId"],
  });

export const ReviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const RejectReviewSchema = z.object({
  reason: z.string().trim().min(3).max(500).refine((v) => !/<script/i.test(v), "Invalid reason"),
});

export const AdminReviewQuerySchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  catalogItemId: z.string().max(80).optional(),
});
