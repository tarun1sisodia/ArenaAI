import type { Repositories } from "../../db/types.js";
import type { RouteCatalogRecord } from "../../db/route-catalog-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { OUTSTATION_RULES, VEHICLES } from "../fares/fare.catalogue.js";
import type { CreateRouteCatalogInput, UpdateRouteCatalogInput } from "./route-catalog.schema.js";

function slugify(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 74); }
export function makeRouteSlug(type: string, source: string, destination?: string): string {
  const s = slugify(source); const d = destination ? slugify(destination) : "sightseeing";
  return `${s}-to-${d}-${type === "round-trip" ? "round-trip-" : ""}taxi`.replace(/--+/g, "-");
}

import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";

function toRecord(input: CreateRouteCatalogInput, now: string, id = newId()): RouteCatalogRecord {
  return { id, tripType: input.trip_type, sourceCity: input.source_city, sourceDetail: input.source_detail ?? null, destinationCity: input.destination_city ?? null, slug: input.slug, distanceKm: input.distance_km ?? null, durationText: input.duration_text ?? null, availableFleets: input.available_fleets, faresInr: input.fares_inr, driverChargeInr: input.driver_charge_inr, nightHaltInr: input.night_halt_inr, tollIncluded: input.toll_included, tollAmountInr: input.toll_amount_inr ?? null, interstateCharges: input.interstate_charges, minKmPerDay: input.min_km_per_day, stops: input.stops, usePerKm: input.use_per_km, perKmRateOverride: input.per_km_rate_override ?? null, highway: input.highway ?? null, allInclusiveNote: input.all_inclusive_note ?? null, status: "draft", needsReview: input.needs_review, createdAt: now, updatedAt: now };
}

export function createRouteCatalogService(deps: { db: Repositories; clock: Clock; bumpManifest?: () => void }) {
  return {
    async list(query: { trip_type?: string; status?: string; q?: string; page?: number; limit?: number }) { return deps.db.routeCatalog.list({ tripType: query.trip_type as any, status: query.status as any, q: query.q, page: query.page, limit: query.limit }); },
    async get(id: string) { const item = await deps.db.routeCatalog.getById(id); if (!item) throw Errors.notFound("ROUTE_CATALOG_NOT_FOUND", "Route catalog item not found."); return item; },
    async checkSlug(slug: string) { return { available: !(await deps.db.routeCatalog.getBySlug(slug)) }; },
    async fleets() { return VEHICLES.map((v) => ({ id: v.id, name: v.name, seats: v.seats, bags: v.bags, perKm: v.perKm })); },
    async suggestFares(input: { trip_type: "one-way" | "round-trip" | "local-tour"; distance_km: number }) {
      const billedKm = input.trip_type === "round-trip" ? Math.max(input.distance_km * OUTSTATION_RULES.sameDayRoundMultiplier, OUTSTATION_RULES.minKmPerDay) : input.distance_km;
      return Object.fromEntries(VEHICLES.map((v) => [v.id, Math.round(billedKm * v.perKm)]));
    },
    async create(input: CreateRouteCatalogInput) {
      const now = toIso(deps.clock.now());
      const existing = await deps.db.routeCatalog.getBySlug(input.slug);
      if (existing) throw Errors.conflict("ROUTE_SLUG_TAKEN", "Slug is already in use.");
      const record = await deps.db.routeCatalog.create(toRecord(input, now));
      deps.bumpManifest?.();
      return record;
    },
    async update(id: string, input: UpdateRouteCatalogInput) {
      const current = await this.get(id);
      if (input.slug && input.slug !== current.slug) throw Errors.unprocessable("ROUTE_SLUG_IMMUTABLE", "Slug never changes after creation — it is the public URL.");
      const now = toIso(deps.clock.now());
      const merged = { ...current, updatedAt: now, tripType: input.trip_type ?? current.tripType, sourceCity: input.source_city ?? current.sourceCity, sourceDetail: input.source_detail === undefined ? current.sourceDetail : input.source_detail, destinationCity: input.destination_city === undefined ? current.destinationCity : input.destination_city, distanceKm: input.distance_km === undefined ? current.distanceKm : input.distance_km, durationText: input.duration_text === undefined ? current.durationText : input.duration_text, availableFleets: input.available_fleets ?? current.availableFleets, faresInr: input.fares_inr ?? current.faresInr, driverChargeInr: input.driver_charge_inr ?? current.driverChargeInr, nightHaltInr: input.night_halt_inr ?? current.nightHaltInr, tollIncluded: input.toll_included ?? current.tollIncluded, tollAmountInr: input.toll_amount_inr === undefined ? current.tollAmountInr : input.toll_amount_inr, interstateCharges: input.interstate_charges ?? current.interstateCharges, minKmPerDay: input.min_km_per_day ?? current.minKmPerDay, stops: input.stops ?? current.stops, usePerKm: input.use_per_km ?? current.usePerKm, perKmRateOverride: input.per_km_rate_override === undefined ? current.perKmRateOverride : input.per_km_rate_override, highway: input.highway === undefined ? current.highway : input.highway, allInclusiveNote: input.all_inclusive_note === undefined ? current.allInclusiveNote : input.all_inclusive_note, needsReview: input.needs_review ?? current.needsReview } as RouteCatalogRecord;
      const updated = await deps.db.routeCatalog.update(merged);
      deps.bumpManifest?.();
      return updated;
    },
    async publish(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.routeCatalog.update({ ...item, status: "published", updatedAt: toIso(deps.clock.now()) });
      deps.bumpManifest?.();
      await triggerFrontendRebuild();
      return updated;
    },
    async archive(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.routeCatalog.update({ ...item, status: "archived", updatedAt: toIso(deps.clock.now()) });
      deps.bumpManifest?.();
      await triggerFrontendRebuild();
      return updated;
    },
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status !== "draft") throw Errors.unprocessable("ROUTE_ARCHIVE_INSTEAD", "Published routes cannot be deleted; archive instead.");
      const deleted = await deps.db.routeCatalog.delete(id);
      deps.bumpManifest?.();
      return deleted;
    },
  };
}
