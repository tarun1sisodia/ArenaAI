import { z } from "zod";
import { CATALOG_TYPES, CONTENT_STATUSES } from "../../types/domain.js";

export const CatalogSlugParamSchema = z.object({
  slug: z.string().min(2).max(80),
});

export const CatalogIdParamSchema = z.object({
  id: z.string().min(1),
});

export const MediaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateCatalogSchema = z
  .object({
    type: z.enum(CATALOG_TYPES),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(3).max(160),
    shortDescription: z.string().min(3).max(280),
    description: z.string().min(3).max(8000),
    durationText: z.string().min(1).max(80),
    routeSummary: z.string().min(1).max(280),
    startingPriceInr: z.number().positive(),
  })
  .strict();

export const UpdateCatalogSchema = CreateCatalogSchema.partial().extend({
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const AttachMediaSchema = z
  .object({
    storagePath: z.string().min(3),
    mediaType: z.enum(["image", "video"]),
    altText: z.string().min(3).max(200),
    caption: z.string().max(280).optional(),
    sortOrder: z.number().int().nonnegative().default(0),
  })
  .strict();

export const UpdateMediaSchema = z
  .object({
    altText: z.string().min(3).max(200).optional(),
    caption: z.string().max(280).optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
  })
  .strict();

export const AdminCatalogQuerySchema = z.object({
  type: z.enum(CATALOG_TYPES).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  q: z.string().optional(),
});
