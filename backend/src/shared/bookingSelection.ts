import { z } from "zod";

const SelectionIdSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/, "Invalid selection identifier");
const SlugSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/, "Invalid catalogue slug");
const SelectionSourceSchema = z.enum(["catalog", "curated", "legacy"]);

/**
 * The single semantic trip choice carried from the customer UI to the API.
 * Route names, local pickup/service details and package identity deliberately
 * remain distinct so a display title can never be persisted as a route.
 */
export const BookingSelectionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("outstation"),
    id: SelectionIdSchema,
    tripType: z.enum(["one-way", "round-trip"]),
    originName: z.string().trim().min(2).max(120),
    destinationName: z.string().trim().min(2).max(120),
    name: z.string().trim().min(2).max(240).optional(),
  }).strict(),
  z.object({
    kind: z.literal("local"),
    id: SelectionIdSchema,
    source: SelectionSourceSchema,
    slug: SlugSchema.optional(),
    tripType: z.enum(["local-tour", "airport-transfer"]),
    localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
    pickupLocation: z.string().trim().min(2).max(240),
    transferTarget: z.string().trim().min(2).max(240).optional(),
    name: z.string().trim().min(2).max(240).optional(),
  }).strict(),
  z.object({
    kind: z.literal("package"),
    id: SelectionIdSchema,
    source: SelectionSourceSchema,
    slug: SlugSchema,
    name: z.string().trim().min(2).max(240).optional(),
  }).strict(),
]).superRefine((value, ctx) => {
  if (value.kind !== "local") return;
  if (value.source === "catalog" && !value.slug) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slug"], message: "Published local offerings require their catalogue slug." });
  }
  if (value.source === "curated" && !value.localPackageKey) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["localPackageKey"], message: "Curated local offerings require a supported local package key." });
  }
});

export type BookingSelection = z.infer<typeof BookingSelectionSchema>;
