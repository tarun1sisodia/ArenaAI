import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { AuthUser, ReviewRecord } from "../../types/domain.js";
import type { SubmitReviewSchema } from "./review.schema.js";
import type { z } from "zod";

export function createReviewService(deps: { db: Repositories; clock: Clock }) {
  return {
    async listPublished(catalogIdOrSlug: string) {
      const item =
        await deps.db.catalog.getBySlug(catalogIdOrSlug) ??
        await deps.db.catalog.getById(catalogIdOrSlug);
      if (!item || item.status !== "published" || item.availability === "unavailable") {
        throw Errors.notFound("CATALOG_NOT_FOUND", "Published catalog item not found.");
      }
      const reviews = await deps.db.reviews.listPublishedByCatalog(item.id);
      return reviews.map((review) => ({
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
        reviewText: review.reviewText,
        verificationBadge:
          review.verificationStatus === "booking_verified"
            ? "Verified booking"
            : review.verificationStatus === "manually_verified"
              ? "Identity link reviewed"
              : null,
        publishedAt: review.publishedAt,
      }));
    },

    async submit(input: z.infer<typeof SubmitReviewSchema>, actor: AuthUser | null) {
      let catalogItemId = input.catalogItemId ?? null;
      if (!catalogItemId && input.catalogSlug) {
        const item = await deps.db.catalog.getBySlug(input.catalogSlug);
        catalogItemId = item?.id ?? null;
      }
      const catalogItem = catalogItemId ? await deps.db.catalog.getById(catalogItemId) : null;
      if (!catalogItem || catalogItem.status !== "published" || catalogItem.availability === "unavailable") {
        throw Errors.notFound("CATALOG_NOT_FOUND", "Reviews can only be submitted for an available published trip.");
      }
      let bookingId: string | null = null;
      let verificationStatus: ReviewRecord["verificationStatus"] = input.socialProfileUrl
        ? "social_link_submitted"
        : "unverified";
      if (input.bookingTicketId && input.guestAccessToken) {
        const booking = await deps.db.bookings.getByTicketId(input.bookingTicketId);
        if (booking && booking.guestAccessToken === input.guestAccessToken && booking.status === "completed") {
          if (booking.selectedCatalogItemId !== catalogItem.id) {
            throw Errors.conflict("REVIEW_BOOKING_MISMATCH", "The completed booking does not match this catalogue trip.");
          }
          bookingId = booking.id;
          verificationStatus = "booking_verified";
        }
      }
      const now = toIso(deps.clock.now());
      return deps.db.reviews.create({
        id: newId(),
        bookingId,
        catalogItemId,
        customerId: actor?.id ?? null,
        displayName: input.displayName,
        rating: input.rating,
        reviewText: input.reviewText,
        status: "pending_review",
        verificationStatus,
        socialProfileUrl: input.socialProfileUrl ?? null,
        socialPlatform: input.socialPlatform ?? null,
        verificationNotes: null,
        reviewedBy: null,
        reviewedAt: null,
        publishedAt: null,
        guestAccessToken: input.guestAccessToken ?? null,
        createdAt: now,
      });
    },

    async listAdmin(filter: { status?: ReviewRecord["status"]; catalogItemId?: string }) {
      return deps.db.reviews.list(filter);
    },

    async approve(id: string, actor: AuthUser, requestId: string) {
      return transition(deps, id, "approved", actor, requestId, "approve");
    },

    async reject(id: string, actor: AuthUser, requestId: string, reason: string) {
      return transition(deps, id, "rejected", actor, requestId, "reject", reason);
    },

    async publish(id: string, actor: AuthUser, requestId: string) {
      const review = await requireReview(deps.db, id);
      if (review.status !== "approved") {
        throw new AppError("REVIEW_NOT_APPROVED", "Only approved reviews can be published.", 409);
      }
      return transition(deps, id, "published", actor, requestId, "publish");
    },

    async archive(id: string, actor: AuthUser, requestId: string) {
      return transition(deps, id, "archived", actor, requestId, "archive");
    },
  };
}

async function requireReview(db: Repositories, id: string): Promise<ReviewRecord> {
  const review = await db.reviews.getById(id);
  if (!review) throw Errors.notFound("REVIEW_NOT_FOUND", "Review not found.");
  return review;
}

async function transition(
  deps: { db: Repositories; clock: Clock },
  id: string,
  status: ReviewRecord["status"],
  actor: AuthUser,
  requestId: string,
  action: string,
  reason?: string,
) {
  const review = await requireReview(deps.db, id);
  const now = toIso(deps.clock.now());
  const updated = await deps.db.reviews.update({
    ...review,
    status,
    reviewedBy: actor.id,
    reviewedAt: now,
    publishedAt: status === "published" ? now : review.publishedAt,
    verificationNotes: reason ?? review.verificationNotes,
  });
  await deps.db.audit.append({
    id: newId(),
    actorId: actor.id,
    actorRole: actor.role,
    resourceType: "review",
    resourceId: review.id,
    action,
    before: { status: review.status },
    after: { status },
    reason: reason ?? null,
    requestId,
    createdAt: now,
  });
  return updated;
}
