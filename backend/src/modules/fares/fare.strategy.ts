import { calendarDaysInclusiveIst } from "../../shared/clock.js";
import { roundRupees } from "../../shared/money.js";
import type { InternalVehicleId, TripType } from "../../types/domain.js";
import {
  OUTSTATION_RULES,
  isGroupExceptionVehicle,
  type RouteFare,
  type VehicleSpec,
} from "./fare.catalogue.js";
import type { FareEngineInput } from "./fare.types.js";

export interface PricingStrategyContext {
  route: RouteFare;
  vehicleId: InternalVehicleId;
  spec: VehicleSpec;
  fareVersion: string;
  hasCustomRate?: boolean;
  minKmPerDay?: number;
  sameDayRoundMultiplier?: number;
  driverAllowance?: number;
}

export interface PricingCalculationResult {
  effectiveTripType: TripType;
  baseFare: number;
  driverAllowance: number;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  roundMultiplierApplied: boolean;
  rules: string[];
  allowPromo: boolean;
}

export interface PricingStrategy {
  readonly name: string;
  isApplicable(vehicleTier: string): boolean;
  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult;
}

/**
 * Standard Pricing Strategy for Standard Passenger Fleet (Sedans, Ertigas, Innova Crystas).
 * Follows standard one-way catalogue rates, same-day round-trip multipliers, and multi-day 300km/day floors.
 */
export class StandardVehiclePricingStrategy implements PricingStrategy {
  readonly name = "StandardVehiclePricingStrategy";

  isApplicable(vehicleTier: string): boolean {
    return !isGroupExceptionVehicle(vehicleTier);
  }

  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult {
    const catalogFare = ctx.route.fares[ctx.vehicleId];
    const billedDistance = Math.max(input.distanceKm, ctx.route.km);
    const baseOneWayFare = ctx.hasCustomRate ? roundRupees(billedDistance * ctx.spec.perKm) : catalogFare;
    const rules: string[] = [];

    const minKmPerDay = ctx.minKmPerDay ?? OUTSTATION_RULES.minKmPerDay;
    const sameDayRoundMultiplier = ctx.sameDayRoundMultiplier ?? OUTSTATION_RULES.sameDayRoundMultiplier;

    if (input.tripType === "round-trip") {
      const days = calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime);
      const minDayKmTotal = roundRupees(minKmPerDay * days * ctx.spec.perKm);
      const actualRound = roundRupees(Math.max(billedDistance, ctx.route.km) * (days > 1 ? 1 : 2) * ctx.spec.perKm);
      const standardRound = roundRupees(baseOneWayFare * sameDayRoundMultiplier);
      const dailyDriverAllowance = ctx.driverAllowance !== undefined ? ctx.driverAllowance * days : 300 * days;

      if (days > 1) {
        rules.push(`outstation-${minKmPerDay}km-per-day`, `days:${days}`);
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(minDayKmTotal, actualRound),
          driverAllowance: dailyDriverAllowance,
          distanceKm: billedDistance,
          billedKm: billedDistance,
          alwaysRoundTrip: false,
          roundMultiplierApplied: false,
          rules,
          allowPromo: true,
        };
      } else {
        rules.push(`same-day-round-${sameDayRoundMultiplier}x`, `outstation-${minKmPerDay}km-per-day`);
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(standardRound, minDayKmTotal),
          driverAllowance: 0,
          distanceKm: billedDistance,
          billedKm: billedDistance,
          alwaysRoundTrip: false,
          roundMultiplierApplied: true,
          rules,
          allowPromo: true,
        };
      }
    }

    // Default: Standard point-to-point / one-way
    return {
      effectiveTripType: input.tripType,
      baseFare: baseOneWayFare,
      driverAllowance: 0,
      distanceKm: billedDistance,
      billedKm: billedDistance,
      alwaysRoundTrip: false,
      roundMultiplierApplied: false,
      rules,
      allowPromo: true,
    };
  }
}

/**
 * Exception Pricing Strategy for Group Commercial Vehicles (Tempo Traveller, Force Urbania, and Force variants).
 * 
 * BUSINESS RULES ENFORCED:
 * 1. Trip Type Override: Must ALWAYS be calculated and charged as a Round Trip, regardless of the user's booking selection.
 * 2. Distance Rule: destinations under 300 km are billed as a round trip;
 *    destinations at or above 300 km use the vehicle's own per-km rate once.
 * 3. Pricing Structure: Locked fixed-rate pricing (billedKm * perKm rate).
 * 4. Driver Allowance: Daily driver allowance of strictly ₹500/day.
 * 5. Promo Codes: Zero promo discounts permitted on commercial group vehicles.
 */
export class GroupCommercialVehicleStrategy implements PricingStrategy {
  readonly name = "GroupCommercialVehicleStrategy";

  isApplicable(vehicleTier: string): boolean {
    return isGroupExceptionVehicle(vehicleTier);
  }

  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult {
    // Rule 1: Trip Type Override — Always charge as Round Trip
    const effectiveTripType: TripType = "round-trip";

    // Calendar Days (minimum 1 day)
    const days = Math.max(1, calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime));

    // Rule 2: Under 300 km is billed round trip; 300 km and above is billed
    // once at the selected Tempo Traveller / Urbania per-km rate.
    const billedKm = input.distanceKm < 300 ? input.distanceKm * 2 : input.distanceKm;

    // Rule 3: Fixed-rate pricing structure (billed km * perKm rate)
    const baseFare = roundRupees(billedKm * ctx.spec.perKm);

    // Rule 4: Driver Allowance — strictly ₹500/day unless configured
    const driverAllowance = (ctx.driverAllowance !== undefined ? ctx.driverAllowance : 500) * days;

    const rules: string[] = [
      "commercial-group-vehicle-exception",
      "forced-round-trip",
      "forced-round-trip-under-300km",
      `distance-rule:${input.distanceKm < 300 ? "round-trip" : "per-km"}`,
      `days:${days}`,
      `billable-km:${billedKm}`,
      `driver-allowance:${driverAllowance}`,
      "locked-fixed-rate-pricing",
    ];

    return {
      effectiveTripType,
      baseFare,
      driverAllowance,
      distanceKm: input.distanceKm,
      billedKm,
      alwaysRoundTrip: true,
      roundMultiplierApplied: false,
      rules,
      allowPromo: false, // Rule 5: Zero promo discounts permitted on commercial group vehicles
    };
  }
}

/**
 * Strategy Registry & Dispatcher
 */
export class PricingEngineContext {
  private static instance: PricingEngineContext;
  private strategies: PricingStrategy[];

  constructor() {
    this.strategies = [
      new GroupCommercialVehicleStrategy(),
      new StandardVehiclePricingStrategy(),
    ];
  }

  public static getInstance(): PricingEngineContext {
    if (!PricingEngineContext.instance) {
      PricingEngineContext.instance = new PricingEngineContext();
    }
    return PricingEngineContext.instance;
  }

  public getStrategy(vehicleTier: string): PricingStrategy {
    const found = this.strategies.find((strategy) => strategy.isApplicable(vehicleTier));
    if (!found) {
      return new StandardVehiclePricingStrategy();
    }
    return found;
  }
}
