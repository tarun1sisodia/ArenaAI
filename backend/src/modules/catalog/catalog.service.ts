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
import { CATALOG_RAW_DATA, VEHICLES } from "../fares/fare.catalogue.js";
import type { AttachMediaSchema, CreateCatalogSchema, PublicCatalogQuerySchema, UpdateCatalogSchema, UpdateMediaSchema } from "./catalog.schema.js";
import { mediaObjectPath, type MediaStorage } from "./media.storage.js";
import type { z } from "zod";

import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";

async function requestFrontendRebuild(reason: string, _manifestVersion: number): Promise<void> {
  await triggerFrontendRebuild(reason);
}

export function createCatalogService(deps: { db: Repositories; clock: Clock; mediaStorage?: MediaStorage | null }) {
  let manifestVersion = 1;
  let lastRegeneratedAt = toIso(deps.clock.now());
  let cachedManifest: any = null;
  let cachedEtag = `W/"manifest-v1-${Date.now()}"`;

  function bumpManifest() {
    manifestVersion += 1;
    lastRegeneratedAt = toIso(deps.clock.now());
    cachedManifest = null;
    cachedEtag = `W/"manifest-v${manifestVersion}-${new Date(lastRegeneratedAt).getTime()}"`;
  }

  function compileBaseRoutes(): Record<string, any> {
    const routes: Record<string, any> = {};
    for (const [slug, item] of Object.entries(CATALOG_RAW_DATA)) {
      const fs = item.fares?.sedan ?? 2000;
      const fe = item.fares?.ertiga ?? 2700;
      const fi = item.fares?.innova ?? 3600;
      const ft = item.fares?.tempo ?? 5500;
      const fu = item.fares?.urbania ?? 7500;
      const fh = item.hatchbackFare || Math.round(fs * 0.85);

      routes[slug] = {
        o: item.origin || item.from,
        d: item.destination || item.to,
        km: item.km,
        m: item.durationMins || Math.round((item.km / 55) * 60),
        fh,
        fs,
        fe,
        fi,
        ft,
        fu,
        pm: item.pricingModel || "oneway",
        c: item.corridor || "Direct Highway Corridor",
        toll: item.toll === 1 ? 1 : 0,
      };
    }
    return routes;
  }

  async function buildManifest() {
    const routes = compileBaseRoutes();
    const allDbItems = await deps.db.catalog.list({});

    // Incorporate database routes & exclusions
    for (const item of allDbItems) {
      if ((item.type as string) === "ride" || (item.type as string) === "route") {
        if (item.status !== "published") {
          // Strictly exclude unpublished (draft) or archived routes from manifest
          delete routes[item.slug];
        } else {
          // Published database route overrides static baseline
          const startingPrice = item.startingPriceInr || 2000;
          const existing = routes[item.slug];
          routes[item.slug] = {
            o: item.routeSummary?.split("·")[0]?.trim() || existing?.o || item.title,
            d: item.routeSummary?.split("·").slice(-1)[0]?.trim() || existing?.d || item.title,
            km: existing?.km ?? 200,
            m: existing?.m ?? 240,
            fh: Math.round(startingPrice * 0.85),
            fs: startingPrice,
            fe: Math.round(startingPrice * 1.35),
            fi: Math.round(startingPrice * 1.8),
            ft: Math.round(startingPrice * 2.75),
            fu: Math.round(startingPrice * 3.75),
            pm: existing?.pm ?? "oneway",
            c: item.routeSummary || existing?.c || "Direct Highway Corridor",
            toll: existing?.toll ?? 1,
          };
        }
      }
    }

    const allPublished = allDbItems.filter((i) => i.status === "published");

    const packages = await Promise.all(
      allPublished
        .filter((item) => item.type === "package" || item.type === "tour")
        .map(async (item) => {
          const media = (await deps.db.media.listByCatalogItem(item.id))
            .filter((entry) => entry.status === "published")
            .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
          const cover = media.find((m) => m.sortOrder === 0) || media[0];
          const image = cover
            ? (cover.storagePath || (cover.contentBase64 ? `/api/v1/media/${cover.id}` : null))
            : "/assets/packages/taj-dawn.webp";

          return {
            id: item.id,
            slug: item.slug,
            name: item.title,
            title: item.title,
            type: item.type,
            category: item.type,
            kicker: item.type === "package" ? "Tour Package" : "Day Tour",
            duration: item.durationText || "1 day",
            from: item.startingPriceInr,
            startingPriceInr: item.startingPriceInr,
            image: image || "/assets/packages/taj-dawn.webp",
            places: (item.routeSummary || "")
              .split(/[,·|]/)
              .map((s) => s.trim())
              .filter(Boolean),
            blurb: item.shortDescription || item.description,
            description: item.description,
            includes: [
              "Private AC vehicle",
              "Professional chauffeur",
              "All tolls, parking & state tax",
              "Guide assistance",
              "Bottled water",
            ],
            excludes: ["Monument tickets", "Meals"],
            status: item.status,
            updatedAt: item.updatedAt,
          };
        }),
    );

    const vehicles = VEHICLES.map((v) => ({
      id: v.id,
      tier: v.tier,
      name: v.name,
      seats: v.seats,
      bags: v.bags,
      perKm: v.perKm,
      alwaysRoundTrip: Boolean(v.alwaysRoundTrip),
    }));

    return {
      version: manifestVersion,
      updatedAt: lastRegeneratedAt,
      routeCount: Object.keys(routes).length,
      packageCount: packages.length,
      routes,
      packages,
      vehicles,
    };
  }

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

    async getManifest() {
      if (!cachedManifest) {
        cachedManifest = await buildManifest();
      }
      return { manifest: cachedManifest, etag: cachedEtag };
    },

    async getManifestStatus() {
      return {
        version: manifestVersion,
        updatedAt: lastRegeneratedAt,
        routeCount: cachedManifest?.routeCount ?? Object.keys(compileBaseRoutes()).length,
        packageCount: cachedManifest?.packageCount ?? 0,
      };
    },

    async republish(actor: AuthUser, requestId: string) {
      bumpManifest();
      cachedManifest = await buildManifest();
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_manifest",
        resourceId: "site_manifest",
        action: "republish",
        before: { version: manifestVersion - 1 },
        after: { version: manifestVersion, updatedAt: lastRegeneratedAt },
        reason: "Manual republish from admin panel",
        requestId,
        createdAt: lastRegeneratedAt,
      });
      return {
        version: cachedManifest.version,
        updatedAt: cachedManifest.updatedAt,
        routeCount: cachedManifest.routeCount,
        packageCount: cachedManifest.packageCount,
      };
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
      const created = await deps.db.catalog.create({
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
      bumpManifest();
      return created;
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
      bumpManifest();
      if (item.status === "published") void requestFrontendRebuild("catalog-update", manifestVersion);
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
      bumpManifest();
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
      void requestFrontendRebuild("catalog-publish", manifestVersion);
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
      bumpManifest();
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
      void requestFrontendRebuild("catalog-archive", manifestVersion);
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

      // Uploaded bytes go to the configured object store (S3 protocol or the
      // Supabase Storage SDK, bucket default "documents") when one is
      // configured. Either way they're served back through
      // /api/v1/media/:id — this backend fetches the bytes from the bucket
      // on demand, so the bucket can stay private and there's never a
      // public/presigned URL to expire. Without storage credentials (local
      // dev / tests) we fall back to storing the bytes inline in Postgres.
      let storagePath: string;
      let contentBase64: string | null = null;
      if (inline && deps.mediaStorage) {
        const buffer = Buffer.from(input.dataBase64 as string, "base64");
        const objectPath = mediaObjectPath(item.id, mediaId, input.mimeType ?? null);
        try {
          await deps.mediaStorage.upload({
            path: objectPath,
            buffer,
            mimeType: input.mimeType as string,
          });
        } catch (err) {
          throw Errors.unavailable(
            "MEDIA_STORAGE_ERROR",
            err instanceof Error ? err.message : "Could not upload the image to storage.",
          );
        }
        storagePath = `/api/v1/media/${mediaId}`;
      } else if (inline) {
        storagePath = `/api/v1/media/${mediaId}`;
        contentBase64 = input.dataBase64 as string;
      } else {
        storagePath = input.storagePath as string;
      }

      const created = await deps.db.media.create({
        id: mediaId,
        catalogItemId: item.id,
        storagePath,
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
        contentBase64,
        sizeBytes,
        createdBy: actor.id,
        approvedBy: actor.id,
        publishedAt: now,
        createdAt: now,
      });
      bumpManifest();
      if (item.status === "published") void requestFrontendRebuild("catalog-media-add", manifestVersion);
      return created;
    },

    async updateMedia(id: string, input: z.infer<typeof UpdateMediaSchema>, actor: AuthUser) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      const updated = await deps.db.media.update({
        ...item,
        altText: input.altText ?? item.altText,
        caption: input.caption ?? item.caption,
        sortOrder: input.sortOrder ?? item.sortOrder,
        status: input.status ?? item.status,
        approvedBy: input.status === "published" ? actor.id : item.approvedBy,
        publishedAt: input.status === "published" ? now : item.publishedAt,
      });
      bumpManifest();
      const parent = await deps.db.catalog.getById(item.catalogItemId);
      if (parent?.status === "published") void requestFrontendRebuild("catalog-media-update", manifestVersion);
      return updated;
    },

    async deleteMedia(id: string, actor: AuthUser, requestId: string) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      // Bucket-backed uploads (mimeType set but nothing inlined) also need the
      // object removed from storage so the "documents" bucket doesn't fill up
      // with orphaned files.
      if (deps.mediaStorage && item.mimeType && !item.contentBase64 && item.sourceType === "admin_upload") {
        const objectPath = mediaObjectPath(item.catalogItemId, item.id, item.mimeType);
        await deps.mediaStorage.remove(objectPath).catch(() => undefined);
      }
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
      bumpManifest();
      const parent = await deps.db.catalog.getById(item.catalogItemId);
      if (parent?.status === "published") void requestFrontendRebuild("catalog-media-delete", manifestVersion);
      return { deleted: true, id };
    },

    /** Raw media bytes for the public serve route — inline DB bytes, or a
     *  live fetch from the configured object store bucket.
     *  SEC-004: verifies that the media and its parent catalog item are published
     *  unless allowUnpublished is explicitly true (for authenticated staff preview).
     */
    async getMediaContent(id: string, options?: { allowUnpublished?: boolean }) {
      const item = await deps.db.media.getById(id);
      if (!item || !item.mimeType) return null;

      const parent = await deps.db.catalog.getById(item.catalogItemId);
      const isPublished = item.status === "published" && Boolean(parent && parent.status === "published");

      if (!options?.allowUnpublished && !isPublished) {
        return null;
      }

      if (item.contentBase64) {
        return {
          buffer: Buffer.from(item.contentBase64, "base64"),
          mimeType: item.mimeType,
          updatedAt: item.createdAt,
          isPublished,
        };
      }
      if (deps.mediaStorage && item.storagePath === `/api/v1/media/${item.id}`) {
        const objectPath = mediaObjectPath(item.catalogItemId, item.id, item.mimeType);
        try {
          const buffer = await deps.mediaStorage.download(objectPath);
          return { buffer, mimeType: item.mimeType, updatedAt: item.createdAt, isPublished };
        } catch {
          return null;
        }
      }
      return null;
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
