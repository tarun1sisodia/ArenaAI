import { z } from "zod";
import { CATALOG_TYPES, CONTENT_STATUSES } from "../../types/domain.js";

export const CatalogSlugParamSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
});

export const CatalogIdParamSchema = z.object({
  id: z.string().min(1).max(80),
});

export const MediaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const CreateCatalogSchema = z
  .object({
    type: z.enum(CATALOG_TYPES),
    slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
    title: z.string().trim().min(3).max(160).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    shortDescription: z.string().trim().min(3).max(280).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    description: z.string().trim().min(3).max(8000).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    durationText: z.string().trim().min(1).max(80),
    routeSummary: z.string().trim().min(1).max(280).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    startingPriceInr: z.number().positive().max(1000000).finite(),
  })
  .strict();

export const UpdateCatalogSchema = CreateCatalogSchema.partial().extend({
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const AttachMediaSchema = z
  .object({
    storagePath: z
      .string()
      .min(3)
      .max(500)
      .refine((v) => !v.includes("..") && !v.includes("//") && !v.startsWith("/"), "Invalid storage path"),
    mediaType: z.enum(["image", "video"]),
    altText: z.string().trim().min(3).max(200).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    caption: z.string().trim().max(280).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    sortOrder: z.number().int().nonnegative().max(1000).default(0),
  })
  .strict();

export const UpdateMediaSchema = z
  .object({
    altText: z.string().trim().min(3).max(200).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    caption: z.string().trim().max(280).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    sortOrder: z.number().int().nonnegative().max(1000).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
  })
  .strict();

export const AdminCatalogQuerySchema = z.object({
  type: z.enum(CATALOG_TYPES).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});
