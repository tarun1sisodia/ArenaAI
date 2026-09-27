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
}

export interface PricingCalculationResult {
  effectiveTripType: TripType;
  baseFare: number;
  driverAllowance: number;
  distanceKm: number;
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
    const rules: string[] = [];

    if (input.tripType === "round-trip") {
      const days = calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime);
      const minDayKmTotal = roundRupees(OUTSTATION_RULES.minKmPerDay * days * ctx.spec.perKm);
      const actualRound = roundRupees(Math.max(billedDistance, ctx.route.km) * (days > 1 ? 1 : 2) * ctx.spec.perKm);
      const standardRound = roundRupees(catalogFare * OUTSTATION_RULES.sameDayRoundMultiplier);

      if (days > 1) {
        rules.push("outstation-300km-per-day", `days:${days}`);
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(minDayKmTotal, actualRound),
          driverAllowance: 300 * days,
          distanceKm: billedDistance,
          roundMultiplierApplied: false,
          rules,
          allowPromo: true,
        };
      } else {
        rules.push("same-day-round-1.85x", "outstation-300km-per-day");
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(standardRound, minDayKmTotal),
          driverAllowance: 0,
          distanceKm: billedDistance,
          roundMultiplierApplied: true,
          rules,
          allowPromo: true,
        };
      }
    }

    // Default: Standard point-to-point / one-way
    return {
      effectiveTripType: input.tripType,
      baseFare: catalogFare,
      driverAllowance: 0,
      distanceKm: billedDistance,
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
 * 2. Minimum Distance Override: The minimum billable distance is strictly 300 kilometers per day (or 2x one-way distance).
 * 3. Pricing Structure: Locked fixed-rate pricing on both ends (base fare and per-km rate are fixed, zero dynamic surge or variable discounts).
 * 4. Driver Allowance: Daily driver allowance of ₹500/day.
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

    // Rule 2: Minimum Distance Override — 300 KM per day minimum, doubled for round-trip return deadhead
    const oneWayKm = Math.max(input.distanceKm, ctx.route.km);
    const roundTripKm = oneWayKm * 2;
    const minDayKmFloor = OUTSTATION_RULES.minKmPerDay * days; // 300 * days
    const billableDistance = Math.max(roundTripKm, minDayKmFloor);

    // Rule 3: Fixed-rate pricing structure (billable km * perKm rate)
    const baseFare = roundRupees(billableDistance * ctx.spec.perKm);

    // Rule 4: Driver Allowance — strictly ₹500/day
    const driverAllowance = 500 * days;

    const rules: string[] = [
      "commercial-group-vehicle-exception",
      "forced-round-trip",
      `days:${days}`,
      `billable-km:${billableDistance}`,
      `min-km-floor:${minDayKmFloor}`,
      `driver-allowance:${driverAllowance}`,
      "locked-fixed-rate-pricing",
    ];

    return {
      effectiveTripType,
      baseFare,
      driverAllowance,
      distanceKm: billableDistance,
      roundMultiplierApplied: false,
      rules,
      allowPromo: false, // Rule 3: Zero promo discounts permitted on commercial group vehicles
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
