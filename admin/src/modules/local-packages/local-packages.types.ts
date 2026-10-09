import type { CatalogStatus, LocalPackageItem } from "@/lib/types";

export type { CatalogStatus, LocalPackageItem };

export interface LocalExtraRate {
  per_km: number;
  per_hr: number;
}

export interface LocalPackageFormState {
  name: string;
  packageCode: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote: string;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  extraRates: Record<string, LocalExtraRate>;
  nightChargeInr: number;
  status: CatalogStatus;
  isActive: boolean;
}

export const EMPTY_LOCAL_PACKAGE: LocalPackageFormState = {
  name: "",
  packageCode: "",
  durationHours: 8,
  includedKm: 80,
  covers: "Taj Mahal, Agra Fort, Mehtab Bagh",
  parkingNote: "Monument entry fees & parking billed at actuals",
  fleetPrices: {
    sedan: 1900,
    ertiga: 2600,
    "innova-crysta": 2850,
    "tempo-traveller": 5500,
    urbania: 7500,
  },
  usePerKm: false,
  extraRates: {
    sedan: { per_km: 10, per_hr: 150 },
    ertiga: { per_km: 14, per_hr: 200 },
    "innova-crysta": { per_km: 18, per_hr: 250 },
    "tempo-traveller": { per_km: 25, per_hr: 400 },
    urbania: { per_km: 34, per_hr: 600 },
  },
  nightChargeInr: 0,
  status: "draft" as CatalogStatus,
  isActive: true,
};
