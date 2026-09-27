import { AppError } from "../../shared/errors.js";
import { calendarDaysInclusiveIst, hourInIst } from "../../shared/clock.js";
import { advanceOf, roundRupees } from "../../shared/money.js";
import type { TripType, VehicleTier } from "../../types/domain.js";
import {
  AIRPORT_TRANSFERS,
  DEFAULT_PROMO,
  DIST_MAP,
  FARE_RULES_VERSION_DEFAULT,
  LOCAL_PACKAGES,
  OUTSTATION_RULES,
  PACKAGES,
  PACKAGE_UPGRADES,
  ROUTES,
  VEHICLES,
  isGroupExceptionVehicle,
  nightAllowanceFor,
  slugifyPlace,
  toInternalVehicleId,
  vehicleSpec,
  type FareByVehicle,
  type RouteFare,
} from "./fare.catalogue.js";
import { PricingEngineContext } from "./fare.strategy.js";
import type { FareEngineInput, FareEngineResult, PromoEvaluation } from "./fare.types.js";

export function isNightPickup(pickupDatetime: string): boolean {
  try {
    const hour = hourInIst(pickupDatetime);
    // Night window: 22:00-05:00 IST (spec)
    return hour >= OUTSTATION_RULES.nightStartHour || hour < OUTSTATION_RULES.nightEndHour;
  } catch {
    // If datetime invalid, don't apply night allowance but don't crash
    return false;
  }
}

export function applyPromo(
  code: string | undefined,
  total: number,
  lookup?: (code: string) => { discount: number; minTotal: number; desc: string; isActive?: boolean; validFrom?: string | null; validTo?: string | null; maxRedemptions?: number | null; redemptionCount?: number } | null,
): PromoEvaluation {
  if (!code) return { valid: false, discount: 0, code: null };
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) {
    return { valid: false, discount: 0, code: clean };
  }
  const fromDb = lookup?.(clean);
  if (fromDb) {
    // Validate active, expiry, redemption limits
    if (fromDb.isActive === false) return { valid: false, discount: 0, code: clean };
    const now = Date.now();
    if (fromDb.validFrom && new Date(fromDb.validFrom).getTime() > now) {
      return { valid: false, discount: 0, code: clean };
    }
    if (fromDb.validTo && new Date(fromDb.validTo).getTime() < now) {
      return { valid: false, discount: 0, code: clean };
    }
    if (fromDb.maxRedemptions !== null && fromDb.maxRedemptions !== undefined) {
      if ((fromDb.redemptionCount ?? 0) >= fromDb.maxRedemptions) {
        return { valid: false, discount: 0, code: clean };
      }
    }
    if (total < fromDb.minTotal) {
      return { valid: false, discount: 0, code: clean };
    }
    const discount = Math.min(fromDb.discount, total);
    return { valid: true, discount, code: clean, description: fromDb.desc };
  }

  const rule =
    clean === DEFAULT_PROMO.code
      ? { discount: DEFAULT_PROMO.discount, minTotal: DEFAULT_PROMO.minTotal, desc: DEFAULT_PROMO.desc }
      : null;
  if (rule && total >= rule.minTotal) {
    const discount = Math.min(rule.discount, total);
    return { valid: true, discount, code: clean, description: rule.desc };
  }
  return { valid: false, discount: 0, code: clean };
}

export function findRoute(originName: string, destinationName: string): RouteFare {
  const from = slugifyPlace(originName);
  const to = slugifyPlace(destinationName);
  if (!from || !to) {
    throw new AppError("FARE_CALCULATION_FAILED", "Origin and destination are required.", 422);
  }

  if (from === to) {
    const existing = ROUTES.find((route) => route.from === from && route.to === to && route.kind === "local");
    if (existing) return existing;
    return {
      id: `${from}-local`,
      from,
      to,
      kind: "local",
      localLabel: `${titleCase(originName)} Sightseeing & Local Tour`,
      duration: "8 hrs / 80 km",
      km: 80,
      fares: LOCAL_PACKAGES["8hr-80km"].fares,
    };
  }

  const direct = ROUTES.find((route) => route.from === from && route.to === to);
  if (direct) return direct;

  const reverse = ROUTES.find((route) => route.from === to && route.to === from);
  if (reverse) {
    return { ...reverse, id: `${from}-to-${to}`, from, to };
  }

  const estimatedKm = estimateDistanceKm(from, to);
  const hrs = Math.max(1, Math.round(estimatedKm / 55));
  return {
    id: `${from}-to-${to}`,
    from,
    to,
    kind: "one-way",
    duration: `${hrs}–${hrs + 1} hrs (${estimatedKm} km)`,
    km: estimatedKm,
    fares: perKmFares(estimatedKm),
  };
}

export function estimateDistanceKm(fromSlug: string, toSlug: string): number {
  const d1 = DIST_MAP[fromSlug] ?? 100;
  const d2 = DIST_MAP[toSlug] ?? 250;
  return Math.max(60, Math.abs(d1 - d2) || d1 + d2 || 250);
}

function perKmFares(km: number): FareByVehicle {
  const getRate = (id: string) => VEHICLES.find((v) => v.id === id)?.perKm ?? 10;
  return {
    sedan: roundRupees(Math.max(2200, km * getRate("sedan"))),
    ertiga: roundRupees(Math.max(2800, km * getRate("ertiga"))),
    innova: roundRupees(Math.max(3800, km * getRate("innova"))),
    tempo: roundRupees(Math.max(5500, km * getRate("tempo"))),
    urbania: roundRupees(Math.max(7500, km * getRate("urbania"))),
  };
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function matchAirportTransfer(originName: string, destinationName: string): keyof typeof AIRPORT_TRANSFERS | null {
  const haystack = `${originName} ${destinationName}`.toLowerCase();
  if (haystack.includes("igi") || haystack.includes("delhi airport") || haystack.includes("indira gandhi")) {
    return "delhi-airport";
  }
  if (haystack.includes("kheria") || haystack.includes("agra airport")) {
    return "agra-airport";
  }
  if (haystack.includes("cantt") || haystack.includes("railway") || haystack.includes("agra fort station")) {
    return "agra-station";
  }
  return null;
}

function packageByIdOrSlug(id?: string): (typeof PACKAGES)[number] | undefined {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase();
  return PACKAGES.find((item) => item.id === clean || item.slug === clean);
}

/**
 * Pure fare engine. No I/O. Client totals are ignored because they never enter this function.
 * Edge cases handled:
 * - distance <=0 throws
 * - return before pickup throws
 * - NaN/Infinity distance throws
 * - Night allowance correctly applied for 22-5 IST
 * - 300km/day minimum for multi-day outstation
 * - Tempo/Urbania 300km minimum outside corridors
 * - Promo validation with expiry and redemption limits when lookup provided
 */
export function calculateFare(input: FareEngineInput): FareEngineResult {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm <= 0) {
    throw new AppError("VALIDATION_ERROR", "Distance must be a positive finite number.", 400);
  }
  if (input.distanceKm > 5000) {
    throw new AppError("VALIDATION_ERROR", "Distance exceeds maximum allowed (5000 km).", 400);
  }
  if (input.returnDatetime) {
    const start = Date.parse(input.pickupDatetime);
    const end = Date.parse(input.returnDatetime);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      throw new AppError("INVALID_TRIP_DATES", "Return datetime must be at or after pickup datetime.", 400);
    }
    const diffDays = (end - start) / (24 * 60 * 60 * 1000);
    if (diffDays > 30) {
      throw new AppError("INVALID_TRIP_DATES", "Return cannot be more than 30 days after pickup.", 400);
    }
  }

  // Force commercial vehicles cannot use promo codes
  if (input.promoCode?.trim() && isGroupExceptionVehicle(input.vehicleTier)) {
    throw new AppError("PROMO_NOT_ALLOWED", "Group commercial vehicles cannot use promo codes.", 400);
  }

  // Check vehicle availability from overrides
  const vehicleOverride = input.ruleOverrides?.vehicles?.find(
    (v) => v.tier === input.vehicleTier || (v as any).id === input.vehicleTier
  );
  if (vehicleOverride?.active === false) {
    throw new AppError("VEHICLE_UNAVAILABLE", `Vehicle tier "${input.vehicleTier}" is currently not available for booking.`, 400);
  }

  let spec = vehicleSpec(input.vehicleTier);
  let hasCustomRate = false;
  if (vehicleOverride && typeof vehicleOverride.perKm === "number" && vehicleOverride.perKm > 0 && vehicleOverride.perKm !== spec.perKm) {
    spec = { ...spec, perKm: vehicleOverride.perKm };
    hasCustomRate = true;
  }

  const fareVersion = input.fareVersion ?? FARE_RULES_VERSION_DEFAULT;
  const pack = packageByIdOrSlug(input.packageId);
  const packageBasePrice = input.ruleOverrides?.packageBasePrice ?? pack?.from;
  const packageName = input.ruleOverrides?.packageName ?? pack?.name;
  const packageDuration = input.ruleOverrides?.packageDuration ?? pack?.duration;

  if (pack || input.ruleOverrides?.packageBasePrice !== undefined) {
    if (isGroupExceptionVehicle(input.vehicleTier)) {
      const days = Math.max(1, calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime));
      const billedKm = input.tripType === "round-trip" ? input.distanceKm : input.distanceKm * 2;
      const baseFare = roundRupees(billedKm * spec.perKm);
      const driverAllowance = (input.ruleOverrides?.driverAllowance !== undefined ? input.ruleOverrides.driverAllowance : 500) * days;
      return finalize({
        tripType: "round-trip",
        vehicleTier: input.vehicleTier,
        pickupDatetime: input.pickupDatetime,
        promoCode: input.promoCode,
        allowPromo: false,
        fareVersion,
        baseFare,
        nightAllowance: 0,
        driverAllowance,
        distanceKm: input.distanceKm,
        billedKm,
        alwaysRoundTrip: true,
        label: packageName ?? "Tour Package",
        duration: packageDuration ?? "Tour Package",
        roundMultiplierApplied: false,
        applyNight: false,
        rules: ["package-tour-force-rule", "commercial-group-vehicle-exception", "forced-round-trip"],
        ruleOverrides: input.ruleOverrides,
      });
    }

    const basePrice = packageBasePrice ?? 0;
    return finalize({
      tripType: input.tripType,
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: true,
      fareVersion,
      baseFare: basePrice + PACKAGE_UPGRADES[toInternalVehicleId(input.vehicleTier)],
      nightAllowance: 0,
      driverAllowance: 0,
      distanceKm: input.distanceKm,
      billedKm: input.distanceKm,
      alwaysRoundTrip: false,
      label: packageName ?? "Tour Package",
      duration: packageDuration ?? "Tour Package",
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["package-fixed", "vehicle-upgrade"],
      ruleOverrides: input.ruleOverrides,
    });
  }

  if (input.tripType === "local-tour" || input.localPackageKey === "8hr-80km" || input.localPackageKey === "12hr-120km") {
    const key = input.localPackageKey === "12hr-120km" ? "12hr-120km" : "8hr-80km";
    const lp = LOCAL_PACKAGES[key];
    const vehicleId = toInternalVehicleId(input.vehicleTier);
    const isForce = isGroupExceptionVehicle(input.vehicleTier);
    return finalize({
      tripType: "local-tour",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce,
      fareVersion,
      baseFare: lp.fares[vehicleId],
      nightAllowance: 0,
      driverAllowance: isForce ? 500 : 0,
      distanceKm: lp.km,
      billedKm: lp.km,
      alwaysRoundTrip: isForce,
      label: lp.label,
      duration: lp.duration,
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["local-package", key],
      ruleOverrides: input.ruleOverrides,
    });
  }

  if (input.tripType === "airport-transfer" || input.localPackageKey === "airport-transfer") {
    const key = matchAirportTransfer(input.originName, input.destinationName) ?? "agra-airport";
    const transfer = AIRPORT_TRANSFERS[key] ?? {
      name: "Airport / Station Pickup & Drop",
      km: 20,
      fares: LOCAL_PACKAGES["airport-transfer"].fares,
    };
    const vehicleId = toInternalVehicleId(input.vehicleTier);
    const isForce = isGroupExceptionVehicle(input.vehicleTier);
    return finalize({
      tripType: "airport-transfer",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce,
      fareVersion,
      baseFare: transfer.fares[vehicleId],
      nightAllowance: 0,
      driverAllowance: 0,
      distanceKm: transfer.km,
      billedKm: transfer.km,
      alwaysRoundTrip: isForce,
      label: transfer.name,
      duration: "Point to Point",
      roundMultiplierApplied: false,
      applyNight: true,
      rules: ["airport-transfer", key],
      ruleOverrides: input.ruleOverrides,
    });
  }

  const route = findRoute(input.originName, input.destinationName);
  const vehicleId = toInternalVehicleId(input.vehicleTier);
  const catalogFare = route.fares[vehicleId];
  const rules: string[] = [`route:${route.id}`];

  if (route.kind === "local") {
    const isForce = isGroupExceptionVehicle(input.vehicleTier);
    return finalize({
      tripType: "local-tour",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce,
      fareVersion,
      baseFare: catalogFare,
      nightAllowance: 0,
      driverAllowance: isForce ? 500 : 0,
      distanceKm: route.km,
      billedKm: route.km,
      alwaysRoundTrip: isForce,
      label: route.localLabel ?? `${titleCase(input.originName)} Local Tour`,
      duration: route.duration,
      roundMultiplierApplied: false,
      applyNight: false,
      rules: [...rules, "local-route"],
      ruleOverrides: input.ruleOverrides,
    });
  }

  const pricingContext = PricingEngineContext.getInstance();
  const strategy = pricingContext.getStrategy(input.vehicleTier);
  const calculation = strategy.calculate(input, {
    route,
    vehicleId,
    spec,
    fareVersion,
    hasCustomRate,
    minKmPerDay: input.ruleOverrides?.minKmPerDay,
    sameDayRoundMultiplier: input.ruleOverrides?.sameDayRoundMultiplier,
    driverAllowance: input.ruleOverrides?.driverAllowance,
  });

  return finalize({
    tripType: calculation.effectiveTripType,
    vehicleTier: input.vehicleTier,
    pickupDatetime: input.pickupDatetime,
    promoCode: input.promoCode,
    allowPromo: calculation.allowPromo,
    fareVersion,
    baseFare: calculation.baseFare,
    nightAllowance: 0,
    driverAllowance: calculation.driverAllowance,
    distanceKm: calculation.distanceKm,
    billedKm: calculation.billedKm,
    alwaysRoundTrip: calculation.alwaysRoundTrip,
    label: `${titleCase(input.originName)} → ${titleCase(input.destinationName)}`,
    duration: route.duration,
    roundMultiplierApplied: calculation.roundMultiplierApplied,
    applyNight: true,
    rules: [...rules, ...calculation.rules],
    ruleOverrides: input.ruleOverrides,
  });
}

function finalize(args: {
  tripType: TripType;
  vehicleTier: VehicleTier;
  pickupDatetime: string;
  promoCode?: string;
  allowPromo?: boolean;
  fareVersion: string;
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  label: string;
  duration: string;
  roundMultiplierApplied: boolean;
  applyNight: boolean;
  rules: string[];
  ruleOverrides?: import("./fare.types.js").FareRuleOverrides;
}): FareEngineResult {
  const standardNight = isGroupExceptionVehicle(args.vehicleTier)
    ? (args.ruleOverrides?.nightAllowanceTempo ?? nightAllowanceFor(args.vehicleTier))
    : (args.ruleOverrides?.nightAllowanceCab ?? nightAllowanceFor(args.vehicleTier));
  const nightAllowance =
    args.applyNight && isNightPickup(args.pickupDatetime) ? standardNight : args.nightAllowance;
  if (nightAllowance > 0) args.rules.push("night-allowance");

  const subtotal = args.baseFare + nightAllowance + args.driverAllowance;
  const promo =
    args.allowPromo !== false ? applyPromo(args.promoCode, subtotal) : { valid: false, discount: 0, code: null };
  const totalFare = Math.max(1, subtotal - promo.discount);
  const advanceAmount = advanceOf(totalFare);
  // Ensure advance never exceeds total and respects minimum
  const finalAdvance = Math.min(totalFare, Math.max(advanceAmount, totalFare < 500 ? totalFare : 500));
  return {
    baseFare: args.baseFare,
    nightAllowance,
    driverAllowance: args.driverAllowance,
    discountAmount: promo.discount,
    totalFare,
    advanceAmount: finalAdvance,
    balanceAmount: totalFare - finalAdvance,
    currency: "INR",
    fareVersion: args.fareVersion,
    label: args.label,
    duration: args.duration,
    distanceKm: args.distanceKm,
    billedKm: args.billedKm,
    alwaysRoundTrip: args.alwaysRoundTrip,
    tripType: args.tripType,
    vehicleTier: args.vehicleTier,
    promoCode: promo.valid ? promo.code : args.promoCode ? args.promoCode.trim().toUpperCase() : null,
    promoValid: promo.valid,
    roundMultiplierApplied: args.roundMultiplierApplied,
    rules: args.rules,
  };
}

export function ignoreClientMoney(body: Record<string, unknown>): void {
  delete body.totalFare;
  delete body.advanceAmount;
  delete body.balanceAmount;
  delete body.baseFare;
  delete body.amount;
  delete body.advance;
  delete body.amountMinor;
}
