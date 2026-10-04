import { applyPromo, calculateFare, findRoute } from "./fare.engine.js";
import { isGroupExceptionVehicle, PACKAGE_UPGRADES, slugifyPlace, VEHICLES } from "./fare.catalogue.js";
import type {
  CalculateFareInput,
  FareEngineInput,
  FareEngineResult,
  FareRuleOverrides,
  FareVehicleOverride,
} from "./fare.types.js";
import type { Repositories } from "../../db/types.js";
import type { RouteCatalogRecord } from "../../db/route-catalog-types.js";
import { Errors } from "../../shared/errors.js";

export type PublicFleetVehicle = {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
};

export function createFareService(fareVersion: string, db?: Repositories) {
  return {
    /**
     * PUBLIC — the live fleet read from the active fare rules. The customer
     * site merges this over its static fleet so desk-side vehicle edits
     * (name / seats / per-km rate / availability) appear without a deploy.
     */
    async getFleet(): Promise<{ version: string; vehicles: PublicFleetVehicle[] }> {
      const base: PublicFleetVehicle[] = VEHICLES.map((v) => ({
        id: v.id,
        tier: v.tier,
        name: v.name,
        seats: v.seats,
        bags: v.bags,
        perKm: v.perKm,
        active: true,
      }));
      if (!db) return { version: fareVersion, vehicles: base };
      const rule = await db.fareRules.getActive();
      const cfgVehicles = rule && Array.isArray((rule.config as Record<string, unknown>).vehicles)
        ? ((rule.config as Record<string, unknown>).vehicles as Array<Record<string, unknown>>)
        : [];
      const vehicles = base.map((v) => {
        const override = cfgVehicles.find((ov) => ov.tier === v.tier || ov.id === v.tier);
        if (!override) return v;
        return {
          ...v,
          name: typeof override.name === "string" && override.name.trim() ? override.name.trim() : v.name,
          seats: typeof override.seats === "number" && override.seats > 0 ? Math.floor(override.seats) : v.seats,
          bags: typeof override.bags === "number" && override.bags >= 0 ? Math.floor(override.bags) : v.bags,
          perKm: typeof override.perKm === "number" && override.perKm > 0 ? override.perKm : v.perKm,
          active: typeof override.active === "boolean" ? override.active : v.active,
        };
      });
      return { version: rule?.version ?? fareVersion, vehicles };
    },

    async calculate(input: CalculateFareInput): Promise<FareEngineResult> {
      // Resolve a published catalog item once. This keeps catalog-backed local
      // tours/transfers on the server-authoritative path without trusting
      // client-supplied distance or price values.
      const catalogItem = db && input.packageId
        ? (await db.catalog.getById(input.packageId)) ?? (await db.catalog.getBySlug(input.packageId))
        : null;

      // Check for published dossier entities (tour_packages, transfer_routes, local_packages, route_catalog)
      let dossierFleetPrices: Record<string, number> | undefined;
      let dossierUsePerKm: boolean | undefined;
      let dossierPerKmRateOverride: number | null | undefined;
      let dossierNightChargeInr: number | undefined;
      let dossierNights: number | undefined;
      let dossierUpgradeSurcharges: Record<string, number> | undefined;
      let dossierNightHaltInr: number | undefined;
      let dossierPackageName: string | undefined;
      let dossierPackageDuration: string | undefined;
      let dossierCatalogItemType: "package" | "tour" | "ride" | undefined;
      let dossierDistanceKm: number | undefined;
      let dossierPackageBasePrice: number | undefined;

      if (db) {
        // 1. Tour packages
        if (input.packageId) {
          const tourPkg =
            (await db.tourPackages.getById(input.packageId)) ??
            (await db.tourPackages.getByCode(input.packageId));
          if (tourPkg && tourPkg.status === "published") {
            dossierFleetPrices = tourPkg.fleetPrices;
            dossierNightChargeInr = tourPkg.nightChargeInr;
            dossierNights = tourPkg.nights;
            dossierPackageName = tourPkg.name;
            dossierPackageDuration = tourPkg.durationText;
            dossierPackageBasePrice = tourPkg.startingPriceInr;
            dossierCatalogItemType = "tour";
            dossierDistanceKm = tourPkg.days ? tourPkg.days * 300 : undefined;

            const [globalUpgrades, pkgUpgrades] = await Promise.all([
              db.tourPackages.listUpgrades(null),
              db.tourPackages.listUpgrades(tourPkg.id),
            ]);
            const upgradesMap: Record<string, number> = { ...PACKAGE_UPGRADES };
            for (const u of globalUpgrades) {
              upgradesMap[u.tierCode] = u.surchargeInr;
            }
            for (const u of pkgUpgrades) {
              upgradesMap[u.tierCode] = u.surchargeInr;
            }
            dossierUpgradeSurcharges = upgradesMap;
          }
        }

        // 2. Transfer routes
        if (
          !dossierFleetPrices &&
          (input.packageId ||
            input.localPackageKey === "airport-transfer" ||
            input.tripType === "airport-transfer")
        ) {
          const lookupCode =
            input.packageId ??
            (input.localPackageKey === "airport-transfer" ? "kheria-airport" : undefined);
          const xfer = lookupCode
            ? (await db.transferRoutes.getById(lookupCode)) ??
              (await db.transferRoutes.getByCode(lookupCode))
            : null;
          if (xfer && xfer.status === "published") {
            dossierFleetPrices = xfer.fleetPrices;
            dossierUsePerKm = xfer.usePerKm;
            dossierNightChargeInr = xfer.nightChargeInr;
            dossierPackageName = xfer.name;
            dossierPackageDuration = xfer.distanceText ?? undefined;
            dossierCatalogItemType = "ride";
            dossierDistanceKm =
              xfer.distanceText && /\d+/.test(xfer.distanceText)
                ? parseInt(xfer.distanceText.match(/\d+/)![0], 10)
                : undefined;
          }
        }

        // 3. Local packages
        if (!dossierFleetPrices) {
          let localCode = input.packageId;
          if (!localCode) {
            if (input.localPackageKey === "8hr-80km") localCode = "agra-standard-sightseeing";
            else if (input.localPackageKey === "12hr-120km") localCode = "agra-extended-city-tour";
          }
          if (localCode) {
            const localPkg =
              (await db.localPackages.getById(localCode)) ??
              (await db.localPackages.getByCode(localCode));
            if (localPkg && localPkg.status === "published") {
              dossierFleetPrices = localPkg.fleetPrices;
              dossierUsePerKm = localPkg.usePerKm;
              dossierPerKmRateOverride =
                localPkg.extraRates?.[input.vehicleTier]?.per_km ?? undefined;
              dossierNightChargeInr = localPkg.nightChargeInr;
              dossierPackageName = localPkg.name;
              dossierPackageDuration = `${localPkg.durationHours} hrs / ${localPkg.includedKm} km`;
              dossierCatalogItemType = "package";
              dossierDistanceKm = localPkg.includedKm;
            }
          }
        }

        // 4. Route catalog
        if (!dossierFleetPrices) {
          let routeRow: RouteCatalogRecord | null = null;
          if (input.packageId) {
            routeRow =
              (await db.routeCatalog.getById(input.packageId)) ??
              (await db.routeCatalog.getBySlug(input.packageId));
          }
          if (!routeRow && input.originName && input.destinationName) {
            const routeSlug = `${slugifyPlace(input.originName)}-to-${slugifyPlace(input.destinationName)}`;
            routeRow = await db.routeCatalog.getBySlug(routeSlug);
          }
          if (routeRow && routeRow.status === "published") {
            dossierFleetPrices = routeRow.faresInr;
            dossierUsePerKm = false;
            dossierNightHaltInr = routeRow.nightHaltInr;
            dossierDistanceKm = routeRow.distanceKm ?? undefined;
            dossierPackageName = `${routeRow.sourceCity} to ${routeRow.destinationCity ?? ""}`;
            dossierPackageDuration = routeRow.durationText ?? undefined;
          }
        }
      }

      // Derive distanceKm from catalogue if omitted by client
      let distanceKm = input.distanceKm;
      if (!distanceKm || !Number.isFinite(distanceKm) || distanceKm <= 0) {
        if (dossierDistanceKm && dossierDistanceKm > 0) {
          distanceKm = dossierDistanceKm;
        } else if (catalogItem?.distanceKm && catalogItem.distanceKm > 0) {
          distanceKm = catalogItem.distanceKm;
        } else if (input.packageId) {
          distanceKm = 100;
        } else if (input.localPackageKey === "8hr-80km") {
          distanceKm = 80;
        } else if (input.localPackageKey === "12hr-120km") {
          distanceKm = 120;
        } else if (input.localPackageKey === "airport-transfer" || input.tripType === "airport-transfer") {
          distanceKm = 20;
        } else {
          const route = findRoute(input.originName, input.destinationName);
          distanceKm = route.km;
        }
      }

      // Load active fare rules if DB is available
      const activeRule = db ? await db.fareRules.getActive() : null;
      const effectiveVersion = activeRule?.version ?? fareVersion;
      const cfg = (activeRule?.config as Record<string, unknown>) || {};
      const outstationCfg =
        typeof cfg.outstation === "object" && cfg.outstation !== null
          ? (cfg.outstation as Record<string, unknown>)
          : {};

      const nightStartHour =
        typeof outstationCfg.nightStartHour === "number" ? outstationCfg.nightStartHour : undefined;
      const nightEndHour =
        typeof outstationCfg.nightEndHour === "number" ? outstationCfg.nightEndHour : undefined;

      // Check package in db.catalog if packageId provided
      let packageBasePrice: number | undefined;
      let packageName: string | undefined;
      let packageDuration: string | undefined;
      if (db && input.packageId) {
        if (catalogItem) {
          if (catalogItem.status !== "published") {
            throw Errors.notFound("CATALOG_ITEM_NOT_FOUND", "Package is not available for booking.");
          }
          if (typeof catalogItem.startingPriceInr === "number" && catalogItem.startingPriceInr > 0) {
            packageBasePrice = catalogItem.startingPriceInr;
          }
          packageName = catalogItem.title;
          packageDuration = catalogItem.durationText;
        }
      }

      const ruleOverrides: FareRuleOverrides = {
        vehicles: Array.isArray(cfg.vehicles) ? (cfg.vehicles as FareVehicleOverride[]) : undefined,
        minKmPerDay: typeof outstationCfg.minKmPerDay === "number" ? outstationCfg.minKmPerDay : undefined,
        sameDayRoundMultiplier:
          typeof outstationCfg.sameDayRoundMultiplier === "number"
            ? outstationCfg.sameDayRoundMultiplier
            : undefined,
        nightAllowanceCab:
          typeof outstationCfg.nightAllowanceCab === "number" ? outstationCfg.nightAllowanceCab : undefined,
        nightAllowanceTempo:
          typeof outstationCfg.nightAllowanceTempo === "number" ? outstationCfg.nightAllowanceTempo : undefined,
        driverAllowance:
          typeof outstationCfg.driverAllowance === "number" ? outstationCfg.driverAllowance : undefined,
        packageBasePrice: dossierPackageBasePrice ?? packageBasePrice,
        packageName: dossierPackageName ?? packageName,
        packageDuration: dossierPackageDuration ?? packageDuration,
        catalogItemType:
          dossierCatalogItemType ??
          (catalogItem?.type === "package" || catalogItem?.type === "tour" || catalogItem?.type === "ride"
            ? catalogItem.type
            : undefined),
        catalogDistanceKm: dossierDistanceKm ?? catalogItem?.distanceKm ?? undefined,

        fleetPrices: dossierFleetPrices,
        usePerKm: dossierUsePerKm,
        perKmRateOverride: dossierPerKmRateOverride,
        nightChargeInr: dossierNightChargeInr,
        nights: dossierNights,
        upgradeSurcharges: dossierUpgradeSurcharges,
        nightHaltInr: dossierNightHaltInr,

        nightStartHour,
        nightEndHour,

        ...input.ruleOverrides,
      };

      const engineInput: FareEngineInput = {
        ...input,
        distanceKm,
        fareVersion: effectiveVersion,
        ruleOverrides,
      };

      // If DB available and promo code provided, validate against DB for expiry, active, redemption limits
      let lookup:
        | ((code: string) => {
            discount: number;
            minTotal: number;
            desc: string;
            isActive?: boolean;
            validFrom?: string | null;
            validTo?: string | null;
            maxRedemptions?: number | null;
            redemptionCount?: number;
            allowGroupVehicles?: boolean;
          } | null)
        | undefined;
      let lookupAllowGroupVehicles = false;
      if (db && input.promoCode) {
        const promo = await db.promos.getByCode(input.promoCode);
        if (promo) {
          lookupAllowGroupVehicles = promo.allowGroupVehicles;
          lookup = () => ({
            discount: promo.discountAmount,
            minTotal: promo.minTotal,
            desc: promo.description,
            isActive: promo.isActive,
            validFrom: promo.validFrom,
            validTo: promo.validTo,
            maxRedemptions: promo.maxRedemptions,
            redemptionCount: promo.redemptionCount,
            allowGroupVehicles: promo.allowGroupVehicles,
          });
        }
      }

      const resultWithoutPromoLookup = calculateFare({
        ...engineInput,
        promoCode: undefined,
        promoAllowGroupVehicles: lookupAllowGroupVehicles,
      });
      if (!input.promoCode || (isGroupExceptionVehicle(input.vehicleTier) && !lookupAllowGroupVehicles)) return resultWithoutPromoLookup;

      // Re-apply promo with DB validation
      const promoEval = applyPromo(
        input.promoCode,
        resultWithoutPromoLookup.baseFare +
          resultWithoutPromoLookup.nightAllowance +
          resultWithoutPromoLookup.driverAllowance,
        lookup,
      );
      const subtotal =
        resultWithoutPromoLookup.baseFare +
        resultWithoutPromoLookup.nightAllowance +
        resultWithoutPromoLookup.driverAllowance;
      const totalFare = Math.max(1, subtotal - promoEval.discount);
      const { advanceOf } = await import("../../shared/money.js");
      const advanceAmount = advanceOf(totalFare);
      const finalAdvance = Math.min(totalFare, Math.max(advanceAmount, totalFare < 500 ? totalFare : 500));
      return {
        ...resultWithoutPromoLookup,
        discountAmount: promoEval.discount,
        totalFare,
        advanceAmount: finalAdvance,
        balanceAmount: totalFare - finalAdvance,
        promoCode: promoEval.valid ? promoEval.code : input.promoCode.trim().toUpperCase(),
        promoValid: promoEval.valid,
      };
    },
    calculateSync(input: CalculateFareInput): FareEngineResult {
      let distanceKm = input.distanceKm;
      if (!distanceKm || !Number.isFinite(distanceKm) || distanceKm <= 0) {
        if (input.ruleOverrides?.catalogDistanceKm && input.ruleOverrides.catalogDistanceKm > 0) {
          distanceKm = input.ruleOverrides.catalogDistanceKm;
        } else if (input.packageId) {
          distanceKm = 100;
        } else if (input.localPackageKey === "8hr-80km") {
          distanceKm = 80;
        } else if (input.localPackageKey === "12hr-120km") {
          distanceKm = 120;
        } else if (input.localPackageKey === "airport-transfer" || input.tripType === "airport-transfer") {
          distanceKm = 20;
        } else {
          const route = findRoute(input.originName, input.destinationName);
          distanceKm = route.km;
        }
      }
      return calculateFare({ ...input, distanceKm, fareVersion: input.fareVersion ?? fareVersion });
    },
  };
}
