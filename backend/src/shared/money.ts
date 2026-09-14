import type { Currency } from "../types/domain.js";

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) throw new Error("Invalid rupees");
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) throw new Error("Invalid paise");
  return paise / 100;
}

export function roundRupees(amount: number): number {
  if (!Number.isFinite(amount)) throw new Error("Invalid amount");
  return Math.round(amount);
}

/**
 * Advance deposit: 28% of total, rounded to the nearest ₹100, minimum ₹500,
 * never more than the total fare.
 * Edge cases:
 * - total < 500: advance = total (customer pays full)
 * - total * 0.28 < 500: advance = 500 unless total <500
 * - rounding to nearest 100
 */
export function advanceOf(totalFare: number): number {
  if (!Number.isFinite(totalFare) || totalFare <= 0) throw new Error("Invalid totalFare");
  const raw = Math.max(500, Math.round((totalFare * 0.28) / 100) * 100);
  return Math.min(totalFare, raw);
}

export type FxTable = {
  USD: number;
  EUR: number;
  GBP: number;
};

export function convertInrPaiseToMinor(
  inrPaise: number,
  currency: Currency,
  fx: FxTable,
): number {
  if (!Number.isFinite(inrPaise) || inrPaise <= 0) throw new Error("Invalid inrPaise");
  if (currency === "INR") return inrPaise;
  const rupees = paiseToRupees(inrPaise);
  const rate = currency === "USD" ? fx.USD : currency === "EUR" ? fx.EUR : fx.GBP;
  if (!rate || rate <= 0 || rate > 1) throw new Error(`Invalid FX rate for ${currency}`);
  const converted = rupees * rate * 100;
  if (!Number.isFinite(converted)) throw new Error("FX conversion resulted in non-finite");
  return Math.max(1, Math.round(converted));
}

export function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

export function assertAmountMatches(expected: number, actual: number, tolerance = 0): boolean {
  if (tolerance === 0) return expected === actual;
  return Math.abs(expected - actual) <= tolerance;
}
