import { z } from "zod";
import { VEHICLES } from "../fares/fare.catalogue.js";

export const ROUTE_TRIP_TYPES = ["one-way", "round-trip", "local-tour"] as const;
export const ROUTE_FLEET_IDS = VEHICLES.map((vehicle) => vehicle.id) as [string, ...string[]];

const cleanText = (min: number, max: number) => z.string().trim().min(min).max(max).transform((value) => value.replace(/<[^>]*>/g, "").trim());
const cleanOptional = (max: number) => z.string().trim().max(max).transform((value) => value.replace(/<[^>]*>/g, "").trim()).optional();

const base = z.object({
  trip_type: z.enum(ROUTE_TRIP_TYPES),
  source_city: cleanText(2, 80),
  source_detail: cleanOptional(80),
  destination_city: cleanOptional(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/).refine((value) => !/^\d+-btn-/.test(value) && !/command/i.test(value) && !/--/.test(value), "Slug contains a reserved or junk pattern."),
  distance_km: z.number().positive().max(10000).finite().optional(),
  duration_text: cleanOptional(80),
  available_fleets: z.array(z.enum(ROUTE_FLEET_IDS as [typeof ROUTE_FLEET_IDS[number], ...typeof ROUTE_FLEET_IDS[number][]])).min(1),
  fares_inr: z.record(z.number().positive().max(1_000_000).finite()),
  driver_charge_inr: z.number().nonnegative().max(1_000_000).default(0),
  night_halt_inr: z.number().nonnegative().max(1_000_000).default(0),
  toll_included: z.boolean().default(true),
  toll_amount_inr: z.number().nonnegative().max(1_000_000).optional(),
  interstate_charges: z.array(z.object({ state: cleanText(2, 60), amount_inr: z.number().positive().max(1_000_000), note: cleanOptional(200) }).strict()).max(20).default([]),
  min_km_per_day: z.number().int().min(50).max(1000).default(300),
  stops: z.array(z.object({ name: cleanText(2, 80), halt_mins: z.number().int().min(0).max(1440).optional() }).strict()).max(24).default([]),
  use_per_km: z.boolean().default(true),
  per_km_rate_override: z.number().positive().max(100_000).finite().nullable().optional(),
  highway: cleanOptional(160),
  all_inclusive_note: cleanOptional(500),
  status: z.enum(["draft", "published", "archived"]).optional(),
  needs_review: z.boolean().default(false),
}).strict();

export const CreateRouteCatalogSchema = base.superRefine((value, context) => {
  if (value.trip_type === "local-tour" && value.destination_city) context.addIssue({ code: "custom", path: ["destination_city"], message: "Local tours must not include a destination city." });
  if (value.trip_type !== "local-tour" && !value.destination_city) context.addIssue({ code: "custom", path: ["destination_city"], message: "Destination city is required for one-way and round-trip routes." });
  if (value.trip_type !== "local-tour" && value.stops.length) context.addIssue({ code: "custom", path: ["stops"], message: "Stops are only valid for local tours." });
  for (const fleet of value.available_fleets) if (!(fleet in value.fares_inr)) context.addIssue({ code: "custom", path: ["fares_inr"], message: `Missing fare for ${fleet}.` });
  for (const fleet of Object.keys(value.fares_inr)) if (!value.available_fleets.includes(fleet as typeof value.available_fleets[number])) context.addIssue({ code: "custom", path: ["fares_inr"], message: `Fare provided for unavailable fleet ${fleet}.` });
  if (value.trip_type === "local-tour" && value.stops.length < 2) context.addIssue({ code: "custom", path: ["stops"], message: "Local tours require at least two stops." });
});

export const UpdateRouteCatalogSchema = base.partial().omit({ status: true }).extend({ status: z.enum(["draft", "published", "archived"]).optional() });
export const RouteCatalogIdSchema = z.object({ id: z.string().uuid() });
export const RouteCatalogQuerySchema = z.object({ trip_type: z.enum(ROUTE_TRIP_TYPES).optional(), status: z.enum(["draft", "published", "archived"]).optional(), q: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(50) });
export const SlugCheckSchema = z.object({ slug: z.string().trim().min(2).max(80) });
export const SuggestFaresSchema = z.object({ trip_type: z.enum(ROUTE_TRIP_TYPES), distance_km: z.number().positive().max(10000).finite() });
export type CreateRouteCatalogInput = z.infer<typeof CreateRouteCatalogSchema>;
export type UpdateRouteCatalogInput = z.infer<typeof UpdateRouteCatalogSchema>;
