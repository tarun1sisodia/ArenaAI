import type { Currency } from "../types/domain.js";

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function roundRupees(amount: number): number {
  return Math.round(amount);
}

/**
 * Advance deposit: 28% of total, rounded to the nearest ₹100, minimum ₹500,
 * never more than the total fare.
 */
export function advanceOf(totalFare: number): number {
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
  if (currency === "INR") return inrPaise;
  const rupees = paiseToRupees(inrPaise);
  const rate = currency === "USD" ? fx.USD : currency === "EUR" ? fx.EUR : fx.GBP;
  return Math.max(1, Math.round(rupees * rate * 100));
}

export function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}
