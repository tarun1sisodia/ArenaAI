import type { FareRuleset } from "./types";

/**
 * Server-authoritative commercial fare rules (inspection view).
 * Mirrors the ACTIVE fare ruleset served by GET /api/v1/ops/admin/fare-rules.
 */
export const FARE_RULESET: FareRuleset = {
  version: "2026-09-13",
  effectiveFrom: "2026-09-13",
  nightWindow: "22:00 – 06:00 IST",
  rules: [
    {
      vehicleTier: "sedan",
      label: "Sedan (4-seater)",
      seats: 4,
      perKm: 14,
      minDailyKm: 250,
      nightChargePerHour: 50,
      driverAllowance: 300,
    },
    {
      vehicleTier: "ertiga",
      label: "Ertiga (6-seater)",
      seats: 6,
      perKm: 18,
      minDailyKm: 250,
      nightChargePerHour: 60,
      driverAllowance: 300,
    },
    {
      vehicleTier: "innova-crysta",
      label: "Innova Crysta (7-seater)",
      seats: 7,
      perKm: 22,
      minDailyKm: 250,
      nightChargePerHour: 70,
      driverAllowance: 300,
    },
    {
      vehicleTier: "tempo-traveller-12",
      label: "Tempo Traveller (12-seater)",
      seats: 12,
      perKm: 30,
      minDailyKm: 300,
      nightChargePerHour: 90,
      driverAllowance: 450,
    },
    {
      vehicleTier: "tempo-traveller-17",
      label: "Tempo Traveller (17-seater)",
      seats: 17,
      perKm: 34,
      minDailyKm: 300,
      nightChargePerHour: 100,
      driverAllowance: 450,
    },
    {
      vehicleTier: "coastal-coach-25",
      label: "Coastal Coach (25-seater)",
      seats: 25,
      perKm: 55,
      minDailyKm: 400,
      nightChargePerHour: 150,
      driverAllowance: 900,
    },
  ],
  notes: [
    "Outstation trips bill the greater of actual km or the tier minimum daily km (250 km/day sedan–Innova).",
    "Night allowance accrues per hour inside the 22:00–06:00 IST window at the tier rate.",
    "Driver daily allowance is fixed per commercial agreement and is non-negotiable.",
    "Tolls, parking and state check-gate fees are passed at actuals with receipts.",
    "Fares are calculated exclusively by the backend fare engine — admin cannot override.",
  ],
};
