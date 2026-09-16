import type { FareRuleset } from "./types";

/**
 * Server-authoritative commercial fare rules (inspection view).
 * Mirrors the ACTIVE fare ruleset served by GET /api/v1/ops/admin/fare-rules.
 */
export const FARE_RULESET: FareRuleset = {
  version: "2026-09-13",
  effectiveFrom: "2026-09-13",
  nightWindow: "22:00 – 05:00 IST",
  rules: [
    {
      vehicleTier: "sedan",
      label: "Sedan (4-seater)",
      seats: 4,
      perKm: 10,
      minDailyKm: 300,
      nightChargePerHour: 50,
      driverAllowance: 300,
    },
    {
      vehicleTier: "ertiga",
      label: "Ertiga (6-seater)",
      seats: 6,
      perKm: 14,
      minDailyKm: 300,
      nightChargePerHour: 60,
      driverAllowance: 300,
    },
    {
      vehicleTier: "innova-crysta",
      label: "Innova Crysta (6-seater)",
      seats: 6,
      perKm: 18,
      minDailyKm: 300,
      nightChargePerHour: 70,
      driverAllowance: 300,
    },
    {
      vehicleTier: "tempo-traveller",
      label: "Tempo Traveller (12-seater)",
      seats: 12,
      perKm: 25,
      minDailyKm: 300,
      nightChargePerHour: 90,
      driverAllowance: 500,
    },
    {
      vehicleTier: "urbania",
      label: "Force Urbania (16-seater)",
      seats: 16,
      perKm: 34,
      minDailyKm: 300,
      nightChargePerHour: 100,
      driverAllowance: 500,
    },
  ],
  notes: [
    "Outstation trips bill the greater of actual km or the tier minimum daily km (300 km/day).",
    "Night allowance applies when travel occurs inside the 22:00–05:00 IST window.",
    "Driver daily allowance is fixed per commercial agreement (₹300 cab / ₹500 tempo).",
    "Tolls, parking and state check-gate fees are passed at actuals with receipts.",
    "Fares are calculated exclusively by the backend fare engine — admin cannot override.",
  ],
};
