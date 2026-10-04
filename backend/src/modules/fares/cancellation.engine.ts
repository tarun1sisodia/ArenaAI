// backend/src/modules/fares/cancellation.engine.ts
// Pure cancellation and refund calculation engine based on Dossier §6 & §8 slabs.

export type CancellationPolicyType = "cab" | "tour_package";

export type CancellationRefundResult = {
  policyType: CancellationPolicyType;
  noticeHours: number;
  noticePeriodText: string;
  feeRetainedPercent: number;
  refundPercent: number;
  refundAmountMinor: number;
  feeRetainedAmountMinor: number;
  ruleText: string;
  slabId?: string;
};

export type CancellationPolicySlab = {
  id?: string;
  policyType: "cab" | "tour_package";
  noticePeriodText: string;
  sortOrder: number;
  feeRetainedPercent: number;
  refundPercent: number;
  ruleText: string;
  refundTimelineNote?: string;
};

/**
 * Standard 9 baseline slabs per Confirmation Dossier §6 & §8
 */
export const DEFAULT_CANCELLATION_SLABS: readonly CancellationPolicySlab[] = [
  // Cab / Outstation Slabs (Dossier §6)
  {
    id: "cab-slab-1",
    policyType: "cab",
    noticePeriodText: "24+ hours before departure",
    sortOrder: 1,
    feeRetainedPercent: 0,
    refundPercent: 100,
    ruleText: "Full refund, no questions asked.",
  },
  {
    id: "cab-slab-2",
    policyType: "cab",
    noticePeriodText: "<24 hours before departure",
    sortOrder: 2,
    feeRetainedPercent: 100,
    refundPercent: 0,
    ruleText: "Advance retained to compensate driver and vehicle allocation.",
  },
  {
    id: "cab-slab-3",
    policyType: "cab",
    noticePeriodText: "No-show / Driver arrival dispatch",
    sortOrder: 3,
    feeRetainedPercent: 100,
    refundPercent: 0,
    ruleText: "Advance forfeited.",
  },
  // Tour Package Slabs (Dossier §8)
  {
    id: "tour-slab-1",
    policyType: "tour_package",
    noticePeriodText: "61+ days prior to departure",
    sortOrder: 10,
    feeRetainedPercent: 0,
    refundPercent: 100,
    ruleText: "Full refund minus payment gateway transaction fee.",
  },
  {
    id: "tour-slab-2",
    policyType: "tour_package",
    noticePeriodText: "46–60 days prior to departure",
    sortOrder: 11,
    feeRetainedPercent: 10,
    refundPercent: 90,
    ruleText: "10% cancellation charge.",
  },
  {
    id: "tour-slab-3",
    policyType: "tour_package",
    noticePeriodText: "31–45 days prior to departure",
    sortOrder: 12,
    feeRetainedPercent: 20,
    refundPercent: 80,
    ruleText: "20% cancellation charge.",
  },
  {
    id: "tour-slab-4",
    policyType: "tour_package",
    noticePeriodText: "16–30 days prior to departure",
    sortOrder: 13,
    feeRetainedPercent: 30,
    refundPercent: 70,
    ruleText: "30% cancellation charge.",
  },
  {
    id: "tour-slab-5",
    policyType: "tour_package",
    noticePeriodText: "6–15 days prior to departure",
    sortOrder: 14,
    feeRetainedPercent: 55,
    refundPercent: 45,
    ruleText: "55% cancellation charge.",
  },
  {
    id: "tour-slab-6",
    policyType: "tour_package",
    noticePeriodText: "0–5 days / No-show",
    sortOrder: 15,
    feeRetainedPercent: 100,
    refundPercent: 0,
    ruleText: "No refund applicable.",
  },
] as const;

/**
 * Evaluates cancellation policy slab and calculates refund & fee amounts.
 */
export function calculateCancellationRefund(params: {
  policyType: CancellationPolicyType;
  noticeHours: number;
  paidAmountMinor: number;
  customPolicies?: CancellationPolicySlab[];
}): CancellationRefundResult {
  const { policyType, noticeHours, paidAmountMinor, customPolicies } = params;
  const policies = customPolicies && customPolicies.length > 0 ? customPolicies : DEFAULT_CANCELLATION_SLABS;

  let matchedSlab: CancellationPolicySlab | undefined;

  if (policyType === "cab") {
    const cabSlabs = policies.filter((s) => s.policyType === "cab");
    if (noticeHours >= 24) {
      // Slab 1: >= 24 hours -> 100% refund
      matchedSlab = cabSlabs.find((s) => s.feeRetainedPercent === 0) ?? DEFAULT_CANCELLATION_SLABS[0];
    } else if (noticeHours > 0) {
      // Slab 2: < 24 hours -> 0% refund
      matchedSlab = cabSlabs.find((s) => s.sortOrder === 2 || s.feeRetainedPercent === 100) ?? DEFAULT_CANCELLATION_SLABS[1];
    } else {
      // Slab 3: No-show / at or past departure -> 0% refund
      matchedSlab = cabSlabs.find((s) => s.sortOrder === 3) ?? DEFAULT_CANCELLATION_SLABS[2];
    }
  } else {
    // Tour packages: tiered by days prior to departure (noticeHours / 24)
    const tourSlabs = policies.filter((s) => s.policyType === "tour_package");
    const noticeDays = noticeHours / 24;

    if (noticeDays > 60) {
      // 61+ days: 100% refund
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 0) ?? DEFAULT_CANCELLATION_SLABS[3];
    } else if (noticeDays > 45) {
      // 46–60 days: 90% refund (10% fee)
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 10) ?? DEFAULT_CANCELLATION_SLABS[4];
    } else if (noticeDays > 30) {
      // 31–45 days: 80% refund (20% fee)
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 20) ?? DEFAULT_CANCELLATION_SLABS[5];
    } else if (noticeDays > 15) {
      // 16–30 days: 70% refund (30% fee)
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 30) ?? DEFAULT_CANCELLATION_SLABS[6];
    } else if (noticeDays > 5) {
      // 6–15 days: 45% refund (55% fee)
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 55) ?? DEFAULT_CANCELLATION_SLABS[7];
    } else {
      // 0–5 days / No-show: 0% refund (100% fee)
      matchedSlab = tourSlabs.find((s) => s.feeRetainedPercent === 100) ?? DEFAULT_CANCELLATION_SLABS[8];
    }
  }

  const defaultFallback: CancellationPolicySlab = {
    policyType,
    noticePeriodText: policyType === "cab" ? "No-show / Driver arrival dispatch" : "0–5 days / No-show",
    sortOrder: 99,
    feeRetainedPercent: 100,
    refundPercent: 0,
    ruleText: policyType === "cab" ? "Advance forfeited." : "No refund applicable.",
  };
  const slab: CancellationPolicySlab = matchedSlab ?? defaultFallback;

  const feeRetainedPercent = slab.feeRetainedPercent;
  const refundPercent = slab.refundPercent;
  const safePaid = Math.max(0, Math.floor(paidAmountMinor));
  const refundAmountMinor = Math.round((safePaid * refundPercent) / 100);
  const feeRetainedAmountMinor = safePaid - refundAmountMinor;

  return {
    policyType,
    noticeHours,
    noticePeriodText: slab.noticePeriodText,
    feeRetainedPercent,
    refundPercent,
    refundAmountMinor,
    feeRetainedAmountMinor,
    ruleText: slab.ruleText,
    slabId: slab.id,
  };
}
