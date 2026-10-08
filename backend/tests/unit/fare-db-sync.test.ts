import { describe, it, expect } from "vitest";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { createFareService } from "../../src/modules/fares/fare.service.js";
import { createBookingService } from "../../src/modules/bookings/booking.service.js";
import { systemClock } from "../../src/shared/clock.js";
import { AppError } from "../../src/shared/errors.js";
import { newId } from "../../src/shared/ids.js";

describe("Fare Engine Active DB Rules & Catalog Sync (Step 1.3)", () => {
  it("uses active DB vehicle perKm override instead of static catalogue rate", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    // Initial calculation without DB overrides (Agra to Delhi sedan)
    const initial = await fareService.calculate({
      originName: "Agra",
      destinationName: "Delhi",
      tripType: "one-way",
      vehicleTier: "sedan",
      pickupDatetime: "2026-10-01T10:00:00Z",
    });

    // Save active fare rules with sedan rate overridden from ₹11 to ₹25/km
    await db.fareRules.save({
      id: newId(),
      version: "custom-v2",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [
          { tier: "sedan", perKm: 25, active: true },
        ],
      },
    });

    const updated = await fareService.calculate({
      originName: "Agra",
      destinationName: "Delhi",
      tripType: "one-way",
      vehicleTier: "sedan",
      pickupDatetime: "2026-10-01T10:00:00Z",
    });

    expect(updated.fareVersion).toBe("custom-v2");
    expect(updated.baseFare).toBeGreaterThan(initial.baseFare);
    expect(updated.baseFare).toBe(updated.billedKm * 25);
  });

  it("prohibits booking deactivated vehicle tiers from active DB fare rules", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    await db.fareRules.save({
      id: newId(),
      version: "custom-v3",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [
          { tier: "urbania", active: false },
        ],
      },
    });

    await expect(
      fareService.calculate({
        originName: "Agra",
        destinationName: "Delhi",
        tripType: "round-trip",
        vehicleTier: "urbania",
        pickupDatetime: "2026-10-01T10:00:00Z",
        returnDatetime: "2026-10-02T18:00:00Z",
      }),
    ).rejects.toThrowError(AppError);
  });

  it("resolves dynamic package starting price from db.catalog published items", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    const packageId = newId();
    await db.catalog.create({
      id: packageId,
      slug: "taj-sunrise-vip",
      type: "package",
      title: "Taj Mahal Sunrise VIP Tour",
      shortDescription: "Exclusive morning tour of the Taj Mahal",
      description: "Exclusive morning tour of the Taj Mahal",
      durationText: "4 hours",
      routeSummary: "Agra local",
      startingPriceInr: 3500,
      distanceKm: 20,
      availability: "available",
      seatsLeft: null,
      stops: [],
      tripType: "local-tour",
      version: 1,
      createdBy: null,
      updatedBy: null,
      publishedAt: new Date().toISOString(),
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fare = await fareService.calculate({
      originName: "Agra",
      destinationName: "Agra",
      tripType: "local-tour",
      vehicleTier: "sedan",
      packageId,
      pickupDatetime: "2026-10-01T05:30:00Z",
    });

    expect(fare.label).toBe("Taj Mahal Sunrise VIP Tour");
    expect(fare.baseFare).toBe(3500); // 3500 starting price + 0 sedan upgrade
  });

  it("blocks booking draft for draft or archived package catalog items", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    const packageId = newId();
    await db.catalog.create({
      id: packageId,
      slug: "taj-secret-vault",
      type: "package",
      title: "Secret Vault Draft Tour",
      shortDescription: "Unpublished package",
      description: "Unpublished package",
      durationText: "4 hours",
      routeSummary: "Agra local",
      startingPriceInr: 5000,
      distanceKm: 20,
      availability: "available",
      seatsLeft: null,
      stops: [],
      tripType: "local-tour",
      version: 1,
      createdBy: null,
      updatedBy: null,
      publishedAt: null,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await expect(
      fareService.calculate({
        originName: "Agra",
        destinationName: "Agra",
        tripType: "local-tour",
        vehicleTier: "sedan",
        packageId,
        pickupDatetime: "2026-10-01T10:00:00Z",
      }),
    ).rejects.toThrow();
  });

  it("bookingService.createDraft delegates fare calculation to fareService using active DB rules", async () => {
    const db = createMemoryRepositories();
    const clock = systemClock;
    const fareService = createFareService("v1", db);
    const bookingService = createBookingService({ db, clock, fareVersion: "v1", fareService });

    await db.fareRules.save({
      id: newId(),
      version: "custom-v4",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [
          { tier: "ertiga", perKm: 30, active: true },
        ],
      },
    });

    const draft = await bookingService.createDraft({
      customerName: "Rohan Verma",
      customerPhone: "+919876543210",
      customerEmail: "rohan@example.com",
      originName: "Agra",
      destinationName: "Delhi",
      tripType: "one-way",
      vehicleTier: "ertiga",
      pickupDatetime: "2026-10-01T10:00:00Z",
      pickupAddress: "Hotel Clarks Shiraz, Agra",
    });

    expect(draft.booking.fareRulesVersion).toBe("custom-v4");
    expect(draft.booking.totalFare).toBe(draft.booking.fareSnapshot.billedKm * 30);
  });

  it("normalizes legacy tier keys in DB fare_rules and applies active rates across all fleets", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    await db.fareRules.save({
      id: newId(),
      version: "fleet-master-v1",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [
          { tier: "sedan", perKm: 12, active: true },
          { tier: "ertiga", perKm: 15, active: true },
          { tier: "innova", perKm: 20, active: true }, // legacy short id
          { tier: "tempo_traveller", perKm: 28, active: true }, // legacy snake id
          { tier: "urbania", perKm: 36, active: true },
        ],
      },
    });

    // Test innova-crysta matches legacy 'innova'
    const innovaFare = await fareService.calculate({
      originName: "Agra",
      destinationName: "Delhi",
      tripType: "one-way",
      vehicleTier: "innova-crysta",
      pickupDatetime: "2026-10-01T10:00:00Z",
      distanceKm: 230,
    });
    expect(innovaFare.baseFare).toBe(230 * 20);

    // Test tempo-traveller matches legacy 'tempo_traveller' with group commercial rule (<300km forced round-trip + 500 DA)
    const tempoFare = await fareService.calculate({
      originName: "Agra",
      destinationName: "Delhi",
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      pickupDatetime: "2026-10-01T10:00:00Z",
      distanceKm: 230,
    });
    expect(tempoFare.billedKm).toBe(460); // 230 * 2
    expect(tempoFare.baseFare).toBe(460 * 28);
    expect(tempoFare.driverAllowance).toBe(500);
  });

  it("published route_catalog outstation route derives per-km rate from active fare_rules and includes tolls", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("v1", db);

    await db.fareRules.save({
      id: newId(),
      version: "active-ruleset",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [
          { tier: "sedan", perKm: 14, active: true },
        ],
      },
    });

    const routeId = newId();
    await db.routeCatalog.create({
      id: routeId,
      slug: "agra-to-mathura-expressway-taxi",
      sourceCity: "Agra",
      sourceDetail: "Cantt",
      destinationCity: "Mathura",
      tripType: "one-way",
      distanceKm: 60,
      durationText: "1.5 hrs",
      availableFleets: ["sedan", "ertiga", "innova-crysta"],
      faresInr: { sedan: 1500, ertiga: 1900 }, // static fallback must NOT override active perKm when usePerKm=true
      driverChargeInr: 0,
      nightHaltInr: 0,
      tollIncluded: false,
      tollAmountInr: 150,
      interstateCharges: [],
      minKmPerDay: 250,
      stops: [],
      usePerKm: true,
      perKmRateOverride: null,
      highway: "NH 19",
      allInclusiveNote: null,
      status: "published",
      needsReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const routeFare = await fareService.calculate({
      originName: "Agra",
      destinationName: "Mathura",
      tripType: "one-way",
      vehicleTier: "sedan",
      packageId: routeId,
      pickupDatetime: "2026-10-01T10:00:00Z",
    });

    // 60 km * 14 rate = 840 baseFare + 150 toll = 990 subtotal
    expect(routeFare.baseFare).toBe(60 * 14);
    expect(routeFare.totalFare).toBe(60 * 14 + 150);
  });
});
