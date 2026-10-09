import type { CatalogStatus } from "./product-verticals.js";
import type { LocalPackageKey } from "./local-package-keys.js";

export interface LocalPackageExtraRates {
  per_km: number;
  per_hr: number;
}

export interface LocalPackageItem {
  id: string;
  packageCode: string | LocalPackageKey;
  name: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  extraRates?: Record<string, LocalPackageExtraRates> | null;
  nightChargeInr: number;
  status: CatalogStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocalPackageInput {
  packageCode: string;
  name: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm?: boolean;
  extraRates?: Record<string, LocalPackageExtraRates> | null;
  nightChargeInr?: number;
  status?: CatalogStatus;
  isActive?: boolean;
}

export type UpdateLocalPackageInput = Partial<CreateLocalPackageInput>;
