import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import {
  catalogMediaLimit,
  type AuthUser,
  type CatalogItemRecord,
  type CatalogMediaRecord,
} from "../../types/domain.js";
import type { AttachMediaSchema, CreateCatalogSchema, PublicCatalogQuerySchema, UpdateCatalogSchema, UpdateMediaSchema } from "./catalog.schema.js";
import type { z } from "zod";

export function createCatalogService(deps: { db: Repositories; clock: Clock }) {
  return {
    /**
     * PUBLIC listing — the single source of trips for the customer site.
     * Returns every published item (optionally filtered by vertical / trip type)
     * with cover image and gallery so newly published catalog entries appear on
     * the frontend automatically.
     */
    async listPublished(filter: z.infer<typeof PublicCatalogQuerySchema>) {
      const items = await deps.db.catalog.list({ status: "published", type: filter.type });
      const published = filter.tripType ? items.filter((item) => item.tripType === filter.tripType) : items;
      return Promise.all(
        published.map(async (item) => {
          const media = (await deps.db.media.listByCatalogItem(item.id))
            .filter((entry) => entry.status === "published")
            .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
          return { ...publicCatalog(item), ...mediaSummary(media) };
        }),
      );
    },

    async getPublished(slug: string) {
      const item = await deps.db.catalog.getBySlug(slug) ?? await deps.db.catalog.getById(slug);
      if (!item || item.status !== "published") {
        throw Errors.notFound("CATALOG_NOT_FOUND", "Published catalog item not found.");
      }
      const media = (await deps.db.media.listByCatalogItem(item.id)).filter((entry) => entry.status === "published");
      const reviews = await deps.db.reviews.listPublishedByCatalog(item.id);
      return {
        ...publicCatalog(item),
        ...mediaSummary(media),
        reviews: reviews.map(publicReview),
      };
    },

    async listAdmin(filter: { type?: CatalogItemRecord["type"]; status?: CatalogItemRecord["status"]; q?: string }) {
      return deps.db.catalog.list(filter);
    },

    /** Admin editor detail: the item plus its full media list (any status). */
    async getAdminItem(idOrSlug: string) {
      const item = await requireItem(deps.db, idOrSlug);
      const media = (await deps.db.media.listByCatalogItem(item.id)).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
      return { ...adminCatalog(item), media: media.map(adminMedia) };
    },

    async create(input: z.infer<typeof CreateCatalogSchema>, actor: AuthUser) {
      const now = toIso(deps.clock.now());
      return deps.db.catalog.create({
        id: newId(),
        type: input.type,
        slug: input.slug,
        title: input.title,
        shortDescription: input.shortDescription,
        description: input.description ?? input.shortDescription,
        status: "draft",
        durationText: input.durationText,
        routeSummary: input.routeSummary,
        startingPriceInr: input.startingPriceInr,
        distanceKm: input.distanceKm ?? null,
        availability: input.availability ?? "available",
        seatsLeft: input.seatsLeft ?? null,
        stops: input.stops ?? [],
        tripType: input.tripType ?? null,
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
      const updated = await deps.db.catalog.update({
        ...item,
        ...input,
        description: input.description ?? item.description,
        distanceKm: input.distanceKm !== undefined ? input.distanceKm : item.distanceKm,
        seatsLeft: input.seatsLeft !== undefined ? input.seatsLeft : item.seatsLeft,
        stops: input.stops ?? item.stops,
        tripType: input.tripType !== undefined ? input.tripType : item.tripType,
        availability: input.availability ?? item.availability,
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
        action: "update",
        before: { title: item.title, startingPriceInr: item.startingPriceInr, status: item.status },
        after: { title: updated.title, startingPriceInr: updated.startingPriceInr, status: updated.status },
        reason: null,
        requestId: "",
        createdAt: now,
      });
      return updated;
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

      // ── Gallery policy (client rule): "Famous Places & Monuments" (place)
      //    carry a multi-image gallery; every other category gets exactly one
      //    cover image. Enforced server-side so no client can bypass it.
      const existing = (await deps.db.media.listByCatalogItem(item.id)).filter(
        (entry) => entry.status !== "archived",
      );
      const limit = catalogMediaLimit(item.type);
      if (existing.length >= limit) {
        const guidance =
          limit === 1
            ? "Remove the current cover image first (or replace it) — this category allows exactly one image."
            : `This gallery is full (${limit} images). Remove an image before adding another.`;
        throw Errors.unprocessable(
          "MEDIA_LIMIT_REACHED",
          `${item.type} items accept at most ${limit} image${limit === 1 ? "" : "s"}. ${guidance}`,
          { limit, type: item.type },
        );
      }

      const mediaId = newId();
      const inline = Boolean(input.dataBase64);
      const sizeBytes = inline ? Buffer.from(input.dataBase64 as string, "base64").length : null;

      return deps.db.media.create({
        id: mediaId,
        catalogItemId: item.id,
        storagePath: inline ? `/api/v1/media/${mediaId}` : (input.storagePath as string),
        mediaType: input.mediaType,
        altText: input.altText,
        caption: input.caption ?? null,
        sortOrder: input.sortOrder,
        // Uploaded media is published immediately so the desk never needs a
        // developer to make a new cover visible on the customer site.
        status: "published",
        sourceType: "admin_upload",
        copyrightOwner: null,
        mimeType: inline ? (input.mimeType as string) : null,
        contentBase64: inline ? (input.dataBase64 as string) : null,
        sizeBytes,
        createdBy: actor.id,
        approvedBy: actor.id,
        publishedAt: now,
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

    async deleteMedia(id: string, actor: AuthUser, requestId: string) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      await deps.db.media.delete(id);
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_media",
        resourceId: id,
        action: "delete",
        before: { storagePath: item.storagePath, catalogItemId: item.catalogItemId },
        after: null,
        reason: null,
        requestId: requestId ?? "",
        createdAt: now,
      });
      return { deleted: true, id };
    },

    /** Raw inline media bytes for the public serve route. */
    async getMediaContent(id: string) {
      const item = await deps.db.media.getById(id);
      if (!item || !item.contentBase64 || !item.mimeType) return null;
      return {
        buffer: Buffer.from(item.contentBase64, "base64"),
        mimeType: item.mimeType,
        updatedAt: item.createdAt,
      };
    },
  };
}

async function requireItem(db: Repositories, id: string): Promise<CatalogItemRecord> {
  const item = await db.catalog.getById(id) ?? await db.catalog.getBySlug(id);
  if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Catalog item not found.");
  return item;
}

/** Cover image (first media) + full gallery for public payloads. */
function mediaSummary(media: CatalogMediaRecord[]) {
  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  const cover = sorted[0] ?? null;
  return {
    coverImage: cover ? mediaUrl(cover) : null,
    gallery: sorted.map((entry) => ({
      id: entry.id,
      mediaType: entry.mediaType,
      altText: entry.altText,
      caption: entry.caption,
      sortOrder: entry.sortOrder,
      ...mediaUrl(entry),
    })),
  };
}

function mediaUrl(entry: CatalogMediaRecord) {
  const url = entry.contentBase64 ? `/api/v1/media/${entry.id}` : entry.storagePath;
  return { url };
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
    distanceKm: item.distanceKm,
    availability: item.availability,
    seatsLeft: item.seatsLeft,
    stops: item.stops,
    tripType: item.tripType,
    version: item.version,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
  };
}

function adminCatalog(item: CatalogItemRecord) {
  return {
    ...publicCatalog(item),
    status: item.status,
    version: item.version,
    createdBy: item.createdBy,
    updatedBy: item.updatedBy,
    createdAt: item.createdAt,
  };
}

function adminMedia(entry: CatalogMediaRecord) {
  return {
    id: entry.id,
    catalogItemId: entry.catalogItemId,
    mediaType: entry.mediaType,
    altText: entry.altText,
    caption: entry.caption,
    sortOrder: entry.sortOrder,
    status: entry.status,
    sourceType: entry.sourceType,
    storagePath: entry.storagePath,
    url: mediaUrl(entry).url,
    mimeType: entry.mimeType,
    sizeBytes: entry.sizeBytes,
    createdAt: entry.createdAt,
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
