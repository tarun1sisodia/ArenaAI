import { applyPromo, calculateFare } from "./fare.engine.js";
import { isGroupExceptionVehicle } from "./fare.catalogue.js";
import type { FareEngineInput, FareEngineResult } from "./fare.types.js";
import type { Repositories } from "../../db/types.js";

export function createFareService(fareVersion: string, db?: Repositories) {
  return {
    async calculate(input: FareEngineInput): Promise<FareEngineResult> {
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
      const resultWithoutPromoLookup = calculateFare({ ...input, fareVersion, promoCode: undefined });
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
    calculateSync(input: FareEngineInput): FareEngineResult {
      return calculateFare({ ...input, fareVersion });
    },
  };
}
