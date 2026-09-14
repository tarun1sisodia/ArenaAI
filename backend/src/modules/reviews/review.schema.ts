import { z } from "zod";
import { REVIEW_STATUSES } from "../../types/domain.js";

export const SubmitReviewSchema = z
  .object({
    catalogItemId: z.string().min(1).optional(),
    catalogSlug: z.string().min(2).optional(),
    bookingTicketId: z.string().optional(),
    guestAccessToken: z.string().min(16).optional(),
    displayName: z.string().min(2).max(80),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(10).max(2000),
    socialProfileUrl: z.string().url().optional(),
    socialPlatform: z.string().max(40).optional(),
  })
  .strict();

export const ReviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const RejectReviewSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const AdminReviewQuerySchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  catalogItemId: z.string().optional(),
});
