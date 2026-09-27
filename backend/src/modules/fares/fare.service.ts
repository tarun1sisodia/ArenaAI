import { applyPromo, calculateFare, findRoute } from "./fare.engine.js";
import { isGroupExceptionVehicle, VEHICLES } from "./fare.catalogue.js";
import type {
  CalculateFareInput,
  FareEngineInput,
  FareEngineResult,
  FareRuleOverrides,
  FareVehicleOverride,
} from "./fare.types.js";
import type { Repositories } from "../../db/types.js";
import { Errors } from "../../shared/errors.js";

export type PublicFleetVehicle = {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
};

export function createFareService(fareVersion: string, db?: Repositories) {
  return {
    /**
     * PUBLIC — the live fleet read from the active fare rules. The customer
     * site merges this over its static fleet so desk-side vehicle edits
     * (name / seats / per-km rate / availability) appear without a deploy.
     */
    async getFleet(): Promise<{ version: string; vehicles: PublicFleetVehicle[] }> {
      const base: PublicFleetVehicle[] = VEHICLES.map((v) => ({
        id: v.id,
        tier: v.tier,
        name: v.name,
        seats: v.seats,
        bags: v.bags,
        perKm: v.perKm,
        active: true,
      }));
      if (!db) return { version: fareVersion, vehicles: base };
      const rule = await db.fareRules.getActive();
      const cfgVehicles = rule && Array.isArray((rule.config as Record<string, unknown>).vehicles)
        ? ((rule.config as Record<string, unknown>).vehicles as Array<Record<string, unknown>>)
        : [];
      const vehicles = base.map((v) => {
        const override = cfgVehicles.find((ov) => ov.tier === v.tier || ov.id === v.tier);
        if (!override) return v;
        return {
          ...v,
          name: typeof override.name === "string" && override.name.trim() ? override.name.trim() : v.name,
          seats: typeof override.seats === "number" && override.seats > 0 ? Math.floor(override.seats) : v.seats,
          bags: typeof override.bags === "number" && override.bags >= 0 ? Math.floor(override.bags) : v.bags,
          perKm: typeof override.perKm === "number" && override.perKm > 0 ? override.perKm : v.perKm,
          active: typeof override.active === "boolean" ? override.active : v.active,
        };
      });
      return { version: rule?.version ?? fareVersion, vehicles };
    },

    async calculate(input: CalculateFareInput): Promise<FareEngineResult> {
      // Derive distanceKm from catalogue if omitted by client
      let distanceKm = input.distanceKm;
      if (!distanceKm || !Number.isFinite(distanceKm) || distanceKm <= 0) {
        if (input.packageId) {
          distanceKm = 100;
        } else if (input.localPackageKey === "8hr-80km") {
          distanceKm = 80;
        } else if (input.localPackageKey === "12hr-120km") {
          distanceKm = 120;
        } else if (input.localPackageKey === "airport-transfer" || input.tripType === "airport-transfer") {
          distanceKm = 20;
        } else {
          const route = findRoute(input.originName, input.destinationName);
          distanceKm = route.km;
        }
      }

      // Load active fare rules if DB is available
      const activeRule = db ? await db.fareRules.getActive() : null;
      const effectiveVersion = activeRule?.version ?? fareVersion;
      const cfg = (activeRule?.config as Record<string, unknown>) || {};
      const outstationCfg =
        typeof cfg.outstation === "object" && cfg.outstation !== null
          ? (cfg.outstation as Record<string, unknown>)
          : {};

      // Check package in db.catalog if packageId provided
      let packageBasePrice: number | undefined;
      let packageName: string | undefined;
      let packageDuration: string | undefined;
      if (db && input.packageId) {
        const catalogItem =
          (await db.catalog.getById(input.packageId)) ??
          (await db.catalog.getBySlug(input.packageId));
        if (catalogItem) {
          if (catalogItem.status !== "published") {
            throw Errors.notFound("CATALOG_ITEM_NOT_FOUND", "Package is not available for booking.");
          }
          if (typeof catalogItem.startingPriceInr === "number" && catalogItem.startingPriceInr > 0) {
            packageBasePrice = catalogItem.startingPriceInr;
          }
          packageName = catalogItem.title;
          packageDuration = catalogItem.durationText;
        }
      }

      const ruleOverrides: FareRuleOverrides = {
        vehicles: Array.isArray(cfg.vehicles) ? (cfg.vehicles as FareVehicleOverride[]) : undefined,
        minKmPerDay: typeof outstationCfg.minKmPerDay === "number" ? outstationCfg.minKmPerDay : undefined,
        sameDayRoundMultiplier:
          typeof outstationCfg.sameDayRoundMultiplier === "number"
            ? outstationCfg.sameDayRoundMultiplier
            : undefined,
        nightAllowanceCab:
          typeof outstationCfg.nightAllowanceCab === "number" ? outstationCfg.nightAllowanceCab : undefined,
        nightAllowanceTempo:
          typeof outstationCfg.nightAllowanceTempo === "number" ? outstationCfg.nightAllowanceTempo : undefined,
        driverAllowance:
          typeof outstationCfg.driverAllowance === "number" ? outstationCfg.driverAllowance : undefined,
        packageBasePrice,
        packageName,
        packageDuration,
      };

      const engineInput: FareEngineInput = {
        ...input,
        distanceKm,
        fareVersion: effectiveVersion,
        ruleOverrides,
      };

      // If DB available and promo code provided, validate against DB for expiry, active, redemption limits
      let lookup:
        | ((code: string) => {
            discount: number;
            minTotal: number;
            desc: string;
            isActive?: boolean;
            validFrom?: string | null;
            validTo?: string | null;
            maxRedemptions?: number | null;
            redemptionCount?: number;
          } | null)
        | undefined;
      if (db && input.promoCode) {
        const promo = await db.promos.getByCode(input.promoCode);
        if (promo) {
          lookup = () => ({
            discount: promo.discountAmount,
            minTotal: promo.minTotal,
            desc: promo.description,
            isActive: promo.isActive,
            validFrom: promo.validFrom,
            validTo: promo.validTo,
            maxRedemptions: promo.maxRedemptions,
            redemptionCount: promo.redemptionCount,
          });
        }
      }

      const resultWithoutPromoLookup = calculateFare({ ...engineInput, promoCode: undefined });
      if (!input.promoCode || isGroupExceptionVehicle(input.vehicleTier)) return resultWithoutPromoLookup;

      // Re-apply promo with DB validation
      const promoEval = applyPromo(
        input.promoCode,
        resultWithoutPromoLookup.baseFare +
          resultWithoutPromoLookup.nightAllowance +
          resultWithoutPromoLookup.driverAllowance,
        lookup,
      );
      const subtotal =
        resultWithoutPromoLookup.baseFare +
        resultWithoutPromoLookup.nightAllowance +
        resultWithoutPromoLookup.driverAllowance;
      const totalFare = Math.max(1, subtotal - promoEval.discount);
      const { advanceOf } = await import("../../shared/money.js");
      const advanceAmount = advanceOf(totalFare);
      const finalAdvance = Math.min(totalFare, Math.max(advanceAmount, totalFare < 500 ? totalFare : 500));
      return {
        ...resultWithoutPromoLookup,
        discountAmount: promoEval.discount,
        totalFare,
        advanceAmount: finalAdvance,
        balanceAmount: totalFare - finalAdvance,
        promoCode: promoEval.valid ? promoEval.code : input.promoCode.trim().toUpperCase(),
        promoValid: promoEval.valid,
      };
    },
    calculateSync(input: CalculateFareInput): FareEngineResult {
      let distanceKm = input.distanceKm;
      if (!distanceKm || !Number.isFinite(distanceKm) || distanceKm <= 0) {
        if (input.packageId) {
          distanceKm = 100;
        } else if (input.localPackageKey === "8hr-80km") {
          distanceKm = 80;
        } else if (input.localPackageKey === "12hr-120km") {
          distanceKm = 120;
        } else if (input.localPackageKey === "airport-transfer" || input.tripType === "airport-transfer") {
          distanceKm = 20;
        } else {
          const route = findRoute(input.originName, input.destinationName);
          distanceKm = route.km;
        }
      }
      return calculateFare({ ...input, distanceKm, fareVersion });
    },
  };
}
