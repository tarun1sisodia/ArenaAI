import { advanceOf, roundRupees } from "../../../shared/money.js";

/**
 * Calculates advance deposit and remaining balance.
 *
 * BUSINESS RULES (LOCK-N03, LOCK-N05, Law 2):
 * - Advance amount is 28% of total, rounded to the nearest ₹100, minimum ₹500.
 * - Advance never exceeds total fare.
 * - Balance = totalFare - advanceAmount.
 */
export function calculateAdvanceAndBalance(totalFare: number): {
  advanceAmount: number;
  balanceAmount: number;
} {
  const roundedTotal = roundRupees(totalFare);
  const rawAdvance = advanceOf(roundedTotal);
  const advanceAmount = Math.min(
    roundedTotal,
    Math.max(rawAdvance, roundedTotal < 500 ? roundedTotal : 500),
  );
  const balanceAmount = Math.max(0, roundedTotal - advanceAmount);

  return {
    advanceAmount,
    balanceAmount,
  };
}

export { advanceOf };
