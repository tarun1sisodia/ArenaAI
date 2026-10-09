import { isGroupExceptionVehicle } from "../fare.catalogue.js";
import type { PromoEvaluation } from "../fare.types.js";
import { AppError } from "../../../shared/errors.js";

export type PromoLookupFn = (code: string) => {
  discount: number;
  minTotal: number;
  desc: string;
  isActive?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  maxRedemptions?: number | null;
  redemptionCount?: number;
} | null;

/**
 * Validates promo code usage and applies discounts.
 * Checks code pattern, database promo rules, activation state, date windows, redemption counts,
 * and minimum cart totals.
 */
export function applyPromo(
  code: string | undefined,
  total: number,
  lookup?: PromoLookupFn,
): PromoEvaluation {
  if (!code) return { valid: false, discount: 0, code: null };
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) {
    return { valid: false, discount: 0, code: clean };
  }

  const fromDb = lookup?.(clean);
  if (fromDb) {
    // Validate active, expiry, redemption limits
    if (fromDb.isActive === false) return { valid: false, discount: 0, code: clean };
    const now = Date.now();
    if (fromDb.validFrom && new Date(fromDb.validFrom).getTime() > now) {
      return { valid: false, discount: 0, code: clean };
    }
    if (fromDb.validTo && new Date(fromDb.validTo).getTime() < now) {
      return { valid: false, discount: 0, code: clean };
    }
    if (fromDb.maxRedemptions !== null && fromDb.maxRedemptions !== undefined) {
      if ((fromDb.redemptionCount ?? 0) >= fromDb.maxRedemptions) {
        return { valid: false, discount: 0, code: clean };
      }
    }
    if (total < fromDb.minTotal) {
      return { valid: false, discount: 0, code: clean };
    }
    const discount = Math.min(fromDb.discount, total);
    return { valid: true, discount, code: clean, description: fromDb.desc };
  }

  return { valid: false, discount: 0, code: clean };
}

/**
 * Enforces business rule: Group commercial vehicles (Tempo / Urbania) are barred
 * from promo code discounts unless explicitly allowed.
 */
export function assertPromoEligibleForVehicle(
  vehicleTier: string,
  promoCode?: string,
  promoAllowGroupVehicles?: boolean,
): void {
  if (promoCode?.trim() && isGroupExceptionVehicle(vehicleTier) && !promoAllowGroupVehicles) {
    throw new AppError("PROMO_NOT_ALLOWED", "Group commercial vehicles cannot use promo codes.", 400);
  }
}
