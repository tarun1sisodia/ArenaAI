// backend/src/modules/tour-packages/tour-packages.service.ts
import type { Repositories } from "../../db/types.js";
import type { TourPackageRecord, PackageVehicleUpgradeRecord } from "../../db/dossier-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type {
  CreateTourPackageInput,
  TourPackageUpgradeInput,
  UpdateTourPackageInput,
} from "./tour-packages.schema.js";

function toRecord(input: CreateTourPackageInput, now: string, id = newId()): TourPackageRecord {
  return {
    id,
    packageCode: input.package_code,
    name: input.name,
    durationText: input.duration_text,
    days: input.days,
    nights: input.nights,
    baseTierCode: input.base_tier_code,
    startingPriceInr: input.starting_price_inr,
    fleetPrices: input.fleet_prices,
    usePerKm: input.use_per_km,
    nightChargeInr: input.night_charge_inr,
    flatChargeInr: input.flat_charge_inr,
    inclusionsHighlight: input.inclusions_highlight ?? null,
    inclusionsNote: input.inclusions_note ?? null,
    status: input.status ?? "draft",
    isActive: input.is_active,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTourPackagesService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list(query: { status?: string; q?: string; page?: number; limit?: number }) {
      return deps.db.tourPackages.list(query as any);
    },
    async get(id: string) {
      const item = await deps.db.tourPackages.getById(id);
      if (!item) throw Errors.notFound("TOUR_PACKAGE_NOT_FOUND", "Tour package not found.");
      return item;
    },
    async getByCode(code: string) {
      const item = await deps.db.tourPackages.getByCode(code);
      if (!item) throw Errors.notFound("TOUR_PACKAGE_NOT_FOUND", "Tour package not found.");
      return item;
    },
    async checkCode(code: string) {
      return { available: !(await deps.db.tourPackages.getByCode(code)) };
    },
    async create(input: CreateTourPackageInput) {
      const existing = await deps.db.tourPackages.getByCode(input.package_code);
      if (existing) throw Errors.conflict("PACKAGE_CODE_TAKEN", "Package code is already in use.");
      const now = toIso(deps.clock.now());
      const item = await deps.db.tourPackages.create(toRecord(input, now));
      if (item.status === "published") {
        await triggerFrontendRebuild("tour-package-published");
      }
      return item;
    },
    async update(id: string, input: UpdateTourPackageInput) {
      const current = await this.get(id);
      if (input.package_code && input.package_code !== current.packageCode) {
        throw Errors.unprocessable(
          "PACKAGE_CODE_IMMUTABLE",
          "Package code cannot change after creation — it forms the public URL."
        );
      }
      const now = toIso(deps.clock.now());
      const priceEdited =
        (input.starting_price_inr !== undefined && input.starting_price_inr !== current.startingPriceInr) ||
        (input.fleet_prices !== undefined && JSON.stringify(input.fleet_prices) !== JSON.stringify(current.fleetPrices));

      const merged: TourPackageRecord = {
        ...current,
        name: input.name ?? current.name,
        durationText: input.duration_text ?? current.durationText,
        days: input.days ?? current.days,
        nights: input.nights ?? current.nights,
        baseTierCode: input.base_tier_code ?? current.baseTierCode,
        startingPriceInr: input.starting_price_inr ?? current.startingPriceInr,
        fleetPrices: input.fleet_prices ?? current.fleetPrices,
        usePerKm: input.use_per_km !== undefined ? input.use_per_km : current.usePerKm,
        nightChargeInr: input.night_charge_inr !== undefined ? input.night_charge_inr : current.nightChargeInr,
        flatChargeInr: input.flat_charge_inr !== undefined ? input.flat_charge_inr : current.flatChargeInr,
        inclusionsHighlight:
          input.inclusions_highlight === undefined ? current.inclusionsHighlight : input.inclusions_highlight,
        inclusionsNote: input.inclusions_note === undefined ? current.inclusionsNote : input.inclusions_note,
        status: input.status ?? current.status,
        isActive: input.is_active !== undefined ? input.is_active : current.isActive,
        updatedAt: now,
      };

      const updated = await deps.db.tourPackages.update(merged);
      if (current.status === "published" && priceEdited) {
        await triggerFrontendRebuild("tour-package-price-edited");
      }
      return updated;
    },
    async publish(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.tourPackages.update({
        ...item,
        status: "published",
        updatedAt: toIso(deps.clock.now()),
      });
      await triggerFrontendRebuild("tour-package-publish");
      return updated;
    },
    async archive(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.tourPackages.update({
        ...item,
        status: "archived",
        updatedAt: toIso(deps.clock.now()),
      });
      await triggerFrontendRebuild("tour-package-archive");
      return updated;
    },
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status !== "draft") {
        throw Errors.unprocessable(
          "TOUR_ARCHIVE_INSTEAD",
          "Published tour packages cannot be deleted; archive instead."
        );
      }
      return deps.db.tourPackages.delete(id);
    },
    async listUpgrades(packageId?: string | null) {
      return deps.db.tourPackages.listUpgrades(packageId);
    },
    async saveUpgrade(input: TourPackageUpgradeInput) {
      const now = toIso(deps.clock.now());
      const record: PackageVehicleUpgradeRecord = {
        id: input.id ?? newId(),
        packageId: input.package_id ?? null,
        tierCode: input.tier_code,
        passengerNote: input.passenger_note ?? null,
        surchargeInr: input.surcharge_inr,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await deps.db.tourPackages.saveUpgrade(record);
      await triggerFrontendRebuild("upgrade-matrix-updated");
      return saved;
    },
    async deleteUpgrade(id: string) {
      await deps.db.tourPackages.deleteUpgrade(id);
      await triggerFrontendRebuild("upgrade-matrix-updated");
    },
  };
}
