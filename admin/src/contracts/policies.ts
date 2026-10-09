/**
 * GENERATED — do not edit by hand.
 * Source: contracts/policies.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
export interface CancellationPolicyItem {
  id: string;
  policyType: "cab" | "tour_package";
  noticePeriodText: string;
  sortOrder: number;
  feeRetainedPercent: number;
  refundPercent: number;
  ruleText: string;
  refundTimelineNote: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PetPolicyItem {
  id: string;
  isOffered: boolean;
  seatProtectionNote: string;
  breedRestrictionNote: string;
  comfortStopNote: string;
  bookingInstruction: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyProfileItem {
  id: string;
  brandName: string;
  officeAddress: string;
  primaryPhone: string;
  whatsappNumber: string;
  email: string;
  gstin: string;
  operatingHours: string;
  mapsLocation: string;
  dossierVersion: string;
  dossierStatus: "pending_review" | "signed_off" | "modifications_needed";
  createdAt?: string;
  updatedAt?: string;
}

export interface DossierSignoffItem {
  id: string;
  sectionKey: string;
  sectionTitle: string;
  status: "pending" | "approved" | "modification_requested";
  clientNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}
