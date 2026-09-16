import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { AuthUser, CatalogItemRecord } from "../../types/domain.js";
import type { AttachMediaSchema, CreateCatalogSchema, UpdateCatalogSchema, UpdateMediaSchema } from "./catalog.schema.js";
import type { z } from "zod";

export function createCatalogService(deps: { db: Repositories; clock: Clock }) {
  return {
    async getPublished(slug: string) {
      const item = await deps.db.catalog.getBySlug(slug) ?? await deps.db.catalog.getById(slug);
      if (!item || item.status !== "published") {
        throw Errors.notFound("CATALOG_NOT_FOUND", "Published catalog item not found.");
      }
      const media = (await deps.db.media.listByCatalogItem(item.id)).filter((entry) => entry.status === "published");
      const reviews = await deps.db.reviews.listPublishedByCatalog(item.id);
      return {
        ...publicCatalog(item),
        gallery: media.map((entry) => ({
          id: entry.id,
          mediaType: entry.mediaType,
          altText: entry.altText,
          caption: entry.caption,
          sortOrder: entry.sortOrder,
          storagePath: entry.storagePath,
        })),
        reviews: reviews.map(publicReview),
      };
    },

    async listAdmin(filter: { type?: CatalogItemRecord["type"]; status?: CatalogItemRecord["status"]; q?: string }) {
      return deps.db.catalog.list(filter);
    },

    async create(input: z.infer<typeof CreateCatalogSchema>, actor: AuthUser) {
      const now = toIso(deps.clock.now());
      return deps.db.catalog.create({
        id: newId(),
        type: input.type,
        slug: input.slug,
        title: input.title,
        shortDescription: input.shortDescription,
        description: input.description,
        status: "draft",
        durationText: input.durationText,
        routeSummary: input.routeSummary,
        startingPriceInr: input.startingPriceInr,
        version: 1,
        createdBy: actor.id,
        updatedBy: actor.id,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    },

    async update(id: string, input: z.infer<typeof UpdateCatalogSchema>, actor: AuthUser) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      return deps.db.catalog.update({
        ...item,
        ...input,
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
    },

    async publish(id: string, actor: AuthUser, requestId: string) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        status: "published",
        publishedAt: now,
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "publish",
        before: { status: item.status },
        after: { status: "published" },
        reason: null,
        requestId,
        createdAt: now,
      });
      return updated;
    },

    async archive(id: string, actor: AuthUser, requestId: string) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        status: "archived",
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "archive",
        before: { status: item.status },
        after: { status: "archived" },
        reason: null,
        requestId,
        createdAt: now,
      });
      return updated;
    },

    async attachMedia(id: string, input: z.infer<typeof AttachMediaSchema>, actor: AuthUser) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      return deps.db.media.create({
        id: newId(),
        catalogItemId: item.id,
        storagePath: input.storagePath,
        mediaType: input.mediaType,
        altText: input.altText,
        caption: input.caption ?? null,
        sortOrder: input.sortOrder,
        status: "draft",
        sourceType: "admin_upload",
        copyrightOwner: null,
        createdBy: actor.id,
        approvedBy: null,
        publishedAt: null,
        createdAt: now,
      });
    },

    async updateMedia(id: string, input: z.infer<typeof UpdateMediaSchema>, actor: AuthUser) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      return deps.db.media.update({
        ...item,
        altText: input.altText ?? item.altText,
        caption: input.caption ?? item.caption,
        sortOrder: input.sortOrder ?? item.sortOrder,
        status: input.status ?? item.status,
        approvedBy: input.status === "published" ? actor.id : item.approvedBy,
        publishedAt: input.status === "published" ? now : item.publishedAt,
      });
    },
  };
}

async function requireItem(db: Repositories, id: string): Promise<CatalogItemRecord> {
  const item = await db.catalog.getById(id) ?? await db.catalog.getBySlug(id);
  if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Catalog item not found.");
  return item;
}

function publicCatalog(item: CatalogItemRecord) {
  return {
    id: item.id,
    type: item.type,
    slug: item.slug,
    title: item.title,
    shortDescription: item.shortDescription,
    description: item.description,
    durationText: item.durationText,
    routeSummary: item.routeSummary,
    startingPriceInr: item.startingPriceInr,
    version: item.version,
    publishedAt: item.publishedAt,
  };
}

function publicReview(review: {
  id: string;
  displayName: string;
  rating: number;
  reviewText: string;
  verificationStatus: string;
  publishedAt: string | null;
}) {
  const badge =
    review.verificationStatus === "booking_verified"
      ? "Verified booking"
      : review.verificationStatus === "manually_verified" || review.verificationStatus === "social_link_submitted"
        ? "Identity link reviewed"
        : null;
  return {
    id: review.id,
    displayName: review.displayName,
    rating: review.rating,
    reviewText: review.reviewText,
    verificationBadge: badge,
    publishedAt: review.publishedAt,
  };
}
