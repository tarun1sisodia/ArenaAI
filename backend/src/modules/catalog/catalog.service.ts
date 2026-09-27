import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { AuthUser, CatalogItemRecord } from "../../types/domain.js";
import { CATALOG_RAW_DATA, VEHICLES } from "../fares/fare.catalogue.js";
import type { AttachMediaSchema, CreateCatalogSchema, UpdateCatalogSchema, UpdateMediaSchema } from "./catalog.schema.js";
import type { z } from "zod";

export function createCatalogService(deps: { db: Repositories; clock: Clock }) {
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
    // Query ONLY published items from catalog database (Requirement: Do not return unpublished or archived items)
    const allPublished = await deps.db.catalog.list({ status: "published" });

    // Incorporate any database published routes
    for (const item of allPublished) {
      if ((item.type as string) === "ride" || (item.type as string) === "route") {
        if (!routes[item.slug]) {
          const startingPrice = item.startingPriceInr || 2000;
          routes[item.slug] = {
            o: item.routeSummary?.split("·")[0]?.trim() || item.title,
            d: item.routeSummary?.split("·").slice(-1)[0]?.trim() || item.title,
            km: 200,
            m: 240,
            fh: Math.round(startingPrice * 0.85),
            fs: startingPrice,
            fe: Math.round(startingPrice * 1.35),
            fi: Math.round(startingPrice * 1.8),
            ft: Math.round(startingPrice * 2.75),
            fu: Math.round(startingPrice * 3.75),
            pm: "oneway",
            c: item.routeSummary || "Direct Highway Corridor",
            toll: 1,
          };
        }
      }
    }

    const packages = allPublished
      .filter((item) => item.status === "published" && (item.type === "package" || item.type === "tour"))
      .map((item) => ({
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
        image: "/assets/packages/taj-dawn.webp",
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
      }));

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
      const created = await deps.db.catalog.create({
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
      bumpManifest();
      return created;
    },

    async update(id: string, input: z.infer<typeof UpdateCatalogSchema>, actor: AuthUser) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        ...input,
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      bumpManifest();
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
