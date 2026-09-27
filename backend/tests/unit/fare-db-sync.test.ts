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
});
