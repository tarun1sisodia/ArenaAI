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
import type { FareEngineInput, FareEngineResult, PromoEvaluation, FareRuleOverrides } from "./fare.types.js";
export {
  calculateCancellationRefund,
  DEFAULT_CANCELLATION_SLABS,
  type CancellationPolicyType,
  type CancellationRefundResult,
  type CancellationPolicySlab,
} from "./cancellation.engine.js";

export function isNightPickup(
  pickupDatetime: string,
  overrides?: { nightStartHour?: number; nightEndHour?: number } | FareRuleOverrides,
): boolean {
  try {
    const hour = hourInIst(pickupDatetime);
    // Default night window: 20:00-06:00 IST (Dossier §5)
    // Supports override from fare_rules.config.outstation
    const startHour = typeof overrides?.nightStartHour === "number" ? overrides.nightStartHour : 20;
    const endHour = typeof overrides?.nightEndHour === "number" ? overrides.nightEndHour : 6;
    return hour >= startHour || hour < endHour;
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
  if (haystack.includes("cantt") || haystack.includes("agra cantt") || haystack.includes("agra fort station")) {
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
 * Evaluates the dossier fare path with strict precedence per tier:
 * 1. Admin fleetPrices[tier] for dossier tour packages and fixed local/transfer prices
 * 2. startingPrice + upgrade surcharge when no fleet-specific price exists
 * 3. per-km only for routes and local-package extra-distance rules
 */
export function evaluateDossierTierBaseFare(input: {
  vehicleTier: VehicleTier;
  distanceKm: number;
  spec: { perKm: number };
  ruleOverrides?: FareRuleOverrides;
}): { baseFare: number; rule: string } | null {
  const overrides = input.ruleOverrides;
  if (!overrides) return null;
  const tierKey = toInternalVehicleId(input.vehicleTier);
  const tierPublic = input.vehicleTier;

  const hasDossierFields =
    overrides.fleetPrices !== undefined ||
    overrides.usePerKm !== undefined ||
    overrides.perKmRateOverride !== undefined ||
    overrides.upgradeSurcharges !== undefined ||
    overrides.packageBasePrice !== undefined;

  if (!hasDossierFields) return null;

  // Tour packages are always fixed-price by vehicle tier. Never fall through
  // to a per-km calculation for a tour package.
  if ((overrides.catalogItemType === "tour" || overrides.usePerKm === false) && overrides.fleetPrices) {
    const rawPrice = overrides.fleetPrices[tierKey] ?? overrides.fleetPrices[tierPublic];
    if (typeof rawPrice === "number" && rawPrice > 0) {
      return { baseFare: rawPrice, rule: "dossier-admin-fleet-price" };
    }
  }

  // Fixed package fallback when a tier-specific fleet price is unavailable.
  if (
    (overrides.catalogItemType !== "ride" || overrides.usePerKm === false) &&
    typeof overrides.packageBasePrice === "number" &&
    overrides.packageBasePrice > 0
  ) {
    const upgradeSurcharge =
      overrides.upgradeSurcharges?.[tierKey] ??
      overrides.upgradeSurcharges?.[tierPublic] ??
      PACKAGE_UPGRADES[tierKey] ??
      0;
    return {
      baseFare: overrides.packageBasePrice + upgradeSurcharge,
      rule: "dossier-starting-price-upgrade",
    };
  }

  // Precedence 3: per-km (perKmRateOverride ?? tier base rate) × km
  const rate =
    typeof overrides.perKmRateOverride === "number" && overrides.perKmRateOverride > 0
      ? overrides.perKmRateOverride
      : input.spec.perKm;
  return {
    baseFare: roundRupees(rate * input.distanceKm),
    rule: "dossier-per-km-rate",
  };
}

/**
 * Pure fare engine. No I/O. Client totals are ignored because they never enter this function.
 * Edge cases handled:
 * - distance <=0 throws
 * - return before pickup throws
 * - NaN/Infinity distance throws
 * - Night allowance correctly applied for 20-6 IST (or configurable window)
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

  // Dossier Authoritative Path: check dossier strict precedence per tier
  const dossierFare = evaluateDossierTierBaseFare({
    vehicleTier: input.vehicleTier,
    distanceKm: input.distanceKm,
    spec,
    ruleOverrides: input.ruleOverrides,
  });

  if (dossierFare) {
    const isAirport =
      input.ruleOverrides?.catalogItemType === "ride" ||
      input.tripType === "airport-transfer" ||
      input.localPackageKey === "airport-transfer";
    const isLocal =
      input.tripType === "local-tour" ||
      input.localPackageKey === "8hr-80km" ||
      input.localPackageKey === "12hr-120km";
    const isForce = isGroupExceptionVehicle(input.vehicleTier);

    let effectiveTripType = input.tripType;
    if (isAirport) effectiveTripType = "airport-transfer";
    else if (isLocal) effectiveTripType = "local-tour";

    const label =
      input.ruleOverrides?.packageName ??
      (isAirport ? "Airport / Station Transfer" : isLocal ? "Local Sightseeing Tour" : "Tour Package");
    const duration =
      input.ruleOverrides?.packageDuration ??
      (isAirport ? "Point to Point" : isLocal ? "Sightseeing Tour" : "Tour Package");

    return finalize({
      tripType: effectiveTripType,
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce,
      fareVersion,
      baseFare: dossierFare.baseFare,
      nightAllowance: 0,
      driverAllowance:
        isForce && (input.ruleOverrides?.catalogItemType === "tour" || input.ruleOverrides?.catalogItemType === "package")
          ? (input.ruleOverrides?.driverAllowance ?? 500)
          : 0,
      distanceKm: input.ruleOverrides?.catalogDistanceKm ?? input.distanceKm,
      billedKm: input.ruleOverrides?.catalogDistanceKm ?? input.distanceKm,
      alwaysRoundTrip: isForce,
      label,
      duration,
      roundMultiplierApplied: false,
      applyNight: true,
      rules: ["dossier-authoritative", dossierFare.rule],
      ruleOverrides: input.ruleOverrides,
    });
  }

  const pack = packageByIdOrSlug(input.packageId);
  const packageBasePrice = input.ruleOverrides?.packageBasePrice ?? pack?.from;
  const packageName = input.ruleOverrides?.packageName ?? pack?.name;
  const packageDuration = input.ruleOverrides?.packageDuration ?? pack?.duration;

  if ((pack || input.ruleOverrides?.packageBasePrice !== undefined) && input.ruleOverrides?.catalogItemType !== "tour" && input.ruleOverrides?.catalogItemType !== "ride") {
    if (isGroupExceptionVehicle(input.vehicleTier)) {
      const days = Math.max(1, calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime));
      const billedKm = input.distanceKm < 300 ? input.distanceKm * 2 : input.distanceKm;
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

  // Published local tours and transfers are catalog offerings, not heritage
  // packages. Use their server-side desk price and distance, then apply the
  // normal vehicle upgrade without exposing client-controlled pricing.
  if ((input.ruleOverrides?.catalogItemType === "tour" || input.ruleOverrides?.catalogItemType === "ride") && input.ruleOverrides.packageBasePrice !== undefined) {
    const isAirport = input.ruleOverrides.catalogItemType === "ride" || input.tripType === "airport-transfer";
    const vehicleId = toInternalVehicleId(input.vehicleTier);
    const isForce = isGroupExceptionVehicle(input.vehicleTier);
    return finalize({
      tripType: isAirport ? "airport-transfer" : "local-tour",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce,
      fareVersion,
      baseFare: isForce
        ? roundRupees((input.ruleOverrides.catalogDistanceKm ?? input.distanceKm) < 300
            ? (input.ruleOverrides.catalogDistanceKm ?? input.distanceKm) * 2 * spec.perKm
            : (input.ruleOverrides.catalogDistanceKm ?? input.distanceKm) * spec.perKm)
        : input.ruleOverrides.packageBasePrice + PACKAGE_UPGRADES[vehicleId],
      nightAllowance: 0,
      driverAllowance: isForce ? 500 : 0,
      distanceKm: input.ruleOverrides.catalogDistanceKm ?? input.distanceKm,
      billedKm: isForce
        ? ((input.ruleOverrides.catalogDistanceKm ?? input.distanceKm) < 300
            ? (input.ruleOverrides.catalogDistanceKm ?? input.distanceKm) * 2
            : input.ruleOverrides.catalogDistanceKm ?? input.distanceKm)
        : input.ruleOverrides.catalogDistanceKm ?? input.distanceKm,
      alwaysRoundTrip: isForce,
      label: input.ruleOverrides.packageName ?? (isAirport ? "Airport / Station Transfer" : "Local Tour"),
      duration: input.ruleOverrides.packageDuration ?? (isAirport ? "Point to Point" : "Full Day"),
      roundMultiplierApplied: false,
      applyNight: false,
      rules: [isAirport ? "catalog-transfer" : "catalog-local-tour", "catalog-fixed", "vehicle-upgrade"],
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
  const overrides = args.ruleOverrides;
  const isNight = isNightPickup(args.pickupDatetime, overrides);

  const standardNight = isGroupExceptionVehicle(args.vehicleTier)
    ? (overrides?.nightAllowanceTempo ?? nightAllowanceFor(args.vehicleTier))
    : (overrides?.nightAllowanceCab ?? nightAllowanceFor(args.vehicleTier));

  let nightRate = standardNight;
  if (typeof overrides?.nightChargeInr === "number" && overrides.nightChargeInr > 0) {
    nightRate = overrides.nightChargeInr;
  } else if (typeof overrides?.nightHaltInr === "number" && overrides.nightHaltInr > 0) {
    nightRate = overrides.nightHaltInr;
  }

  // Multi-day packages multiply per-night charge by nights (default 1 night on night pickup)
  const effectiveNights = overrides?.nights && overrides.nights > 0 ? overrides.nights : 1;

  let nightAllowance = 0;
  if (isNight) {
    if (args.applyNight || typeof overrides?.nightChargeInr === "number" || typeof overrides?.nightHaltInr === "number") {
      nightAllowance = nightRate * effectiveNights;
    }
  } else if (args.nightAllowance > 0) {
    nightAllowance = args.nightAllowance;
  }

  if (nightAllowance > 0 && !args.rules.includes("night-allowance")) {
    args.rules.push("night-allowance");
  }

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
