import { applyPromo, calculateFare, findRoute } from "./fare.engine.js";
import { isGroupExceptionVehicle, VEHICLES } from "./fare.catalogue.js";
import type { CalculateFareInput, FareEngineInput, FareEngineResult } from "./fare.types.js";
import type { Repositories } from "../../db/types.js";

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
      const engineInput: FareEngineInput = {
        ...input,
        distanceKm,
        fareVersion,
      };

      // If DB available and promo code provided, validate against DB for expiry, active, redemption limits
      let lookup: ((code: string) => { discount: number; minTotal: number; desc: string; isActive?: boolean; validFrom?: string | null; validTo?: string | null; maxRedemptions?: number | null; redemptionCount?: number } | null) | undefined;
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
      // Temporarily set global lookup via closure in finalize - we need to pass lookup to engine
      // Since calculateFare calls applyPromo internally, we monkey-patch by calling applyPromo separately if lookup exists
      // Instead, we calculate base fare without promo, then apply promo with DB lookup
      const resultWithoutPromoLookup = calculateFare({ ...engineInput, promoCode: undefined });
      if (!input.promoCode || isGroupExceptionVehicle(input.vehicleTier)) return resultWithoutPromoLookup;

      // Re-apply promo with DB validation
      const promoEval = applyPromo(input.promoCode, resultWithoutPromoLookup.baseFare + resultWithoutPromoLookup.nightAllowance + resultWithoutPromoLookup.driverAllowance, lookup);
      const subtotal = resultWithoutPromoLookup.baseFare + resultWithoutPromoLookup.nightAllowance + resultWithoutPromoLookup.driverAllowance;
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
