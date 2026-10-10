/**
 * @file local-package-keys.ts — Canonical Local Tour Rental Slabs contract.
 * @usage Contract C-ENUM-003: Replaces historical 'day120' and '8h/80km' formats.
 */

export const LOCAL_PACKAGE_KEYS = [
  "8hr-80km",
  "12hr-120km",
] as const;

export type LocalPackageKey = (typeof LOCAL_PACKAGE_KEYS)[number];

export interface LocalPackageMeta {
  key: LocalPackageKey;
  label: string;
  hours: number;
  kilometers: number;
  description: string;
}

export const LOCAL_PACKAGE_META: Record<LocalPackageKey, LocalPackageMeta> = {
  "8hr-80km": {
    key: "8hr-80km",
    label: "8 Hours / 80 Km",
    hours: 8,
    kilometers: 80,
    description: "Standard local city package (8 hours or 80 km coverage).",
  },
  "12hr-120km": {
    key: "12hr-120km",
    label: "12 Hours / 120 Km (Full Day)",
    hours: 12,
    kilometers: 120,
    description: "Extended full-day local package (12 hours or 120 km coverage).",
  },
};

/**
 * Normalizes historical package slugs ('day120', '8h80km', '8hr-80km') to canonical LocalPackageKey.
 */
export function toCanonicalLocalPackageKey(input: string): LocalPackageKey | undefined {
  const clean = (input || "").trim().toLowerCase();
  if ((LOCAL_PACKAGE_KEYS as readonly string[]).includes(clean)) {
    return clean as LocalPackageKey;
  }
  const stripped = clean.replace(/[^a-z0-9]/g, "");
  if (stripped === "8hr80km" || stripped === "8h80km" || stripped === "80km") {
    return "8hr-80km";
  }
  if (stripped === "12hr120km" || stripped === "12h120km" || stripped === "120km" || stripped === "day120") {
    return "12hr-120km";
  }
  return undefined;
}
