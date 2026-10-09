import type { Repositories } from "../../../db/types.js";
import type { PromoLookupFn } from "../rules/promo.rules.js";

export interface ResolvedPromoContext {
  lookup?: PromoLookupFn;
  allowGroupVehicles: boolean;
}

/**
 * Resolves active promo code data from the database.
 * Builds validation closure for activation windows, max redemptions, and minimum totals.
 */
export async function resolveDbPromo(
  promoCode?: string,
  db?: Repositories,
): Promise<ResolvedPromoContext> {
  if (!db || !promoCode) {
    return { allowGroupVehicles: false };
  }

  const clean = promoCode.trim().toUpperCase();
  const promo = await db.promos.getByCode(clean);

  if (!promo) {
    return { allowGroupVehicles: false };
  }

  const lookup: PromoLookupFn = () => ({
    discount: promo.discountAmount,
    minTotal: promo.minTotal,
    desc: promo.description,
    isActive: promo.isActive,
    validFrom: promo.validFrom,
    validTo: promo.validTo,
    maxRedemptions: promo.maxRedemptions,
    redemptionCount: promo.redemptionCount,
  });

  return {
    lookup,
    allowGroupVehicles: Boolean(promo.allowGroupVehicles),
  };
}
