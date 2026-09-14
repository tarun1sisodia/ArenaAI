import { calculateFare } from "./fare.engine.js";
import type { FareEngineInput, FareEngineResult } from "./fare.types.js";

export function createFareService(fareVersion: string) {
  return {
    calculate(input: FareEngineInput): FareEngineResult {
      return calculateFare({ ...input, fareVersion });
    },
  };
}
