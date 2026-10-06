import { describe, expect, it } from "vitest";
import { calculateFare } from "../../src/modules/fares/fare.engine.js";
import { createFareService } from "../../src/modules/fares/fare.service.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { createPromosService } from "../../src/modules/promos/promos.service.js";


const pickupDay = "2026-10-15T09:00:00.000Z";

describe("Universal Coupon Codes & Group Commercial Vehicles Opt-In", () => {
  it("group commercial vehicle with allow_group_vehicles=false throws PROMO_NOT_ALLOWED (unchanged behavior)", () => {
    expect(() =>
      calculateFare({
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: 230,
        promoCode: "ASTTCAR500OFF",
        promoAllowGroupVehicles: false,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "PROMO_NOT_ALLOWED",
        statusCode: 400,
      }),
    );
  });

  it("group commercial vehicle with allow_group_vehicles=true applies discount without throwing", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      distanceKm: 230,
      promoCode: "ASTTCAR500OFF",
      promoAllowGroupVehicles: true,
    });

    expect(result.promoValid).toBe(true);
    expect(result.discountAmount).toBe(500);
    expect(result.totalFare).toBe(result.baseFare + result.driverAllowance + result.nightAllowance - 500);
  });

  it("fareService honors promo allowGroupVehicles flag from database", async () => {
    const db = createMemoryRepositories();
    const fareService = createFareService("2026-09-13", db);

    // Seed a standard code (cars only)
    await db.promos.create({
      id: "test-promo-cars-only",
      code: "CARSONLY500",
      discountAmount: 500,
      minTotal: 1000,
      description: "Cars only",
      isActive: true,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: false,
      isBroadcast: false,
    });

    // Seed a group-allowed code
    await db.promos.create({
      id: "test-promo-group-ok",
      code: "GROUPOK500",
      discountAmount: 500,
      minTotal: 1000,
      description: "Group allowed",
      isActive: true,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: true,
      isBroadcast: false,
    });

    // 1. Tempo + CARSONLY500 -> promo not applied (discountAmount = 0)
    const fareNoGroup = await fareService.calculate({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      promoCode: "CARSONLY500",
    });
    expect(fareNoGroup.discountAmount).toBe(0);

    // 2. Tempo + GROUPOK500 -> discount applied
    const fareGroupOk = await fareService.calculate({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      promoCode: "GROUPOK500",
    });
    expect(fareGroupOk.discountAmount).toBe(500);
    expect(fareGroupOk.promoValid).toBe(true);
  });
});

describe("Website Broadcast Promo Code & Featured Endpoint", () => {
  it("enabling broadcast on two codes rejects the second with the friendly message", async () => {
    const db = createMemoryRepositories();
    const promosService = createPromosService({ db });

    // Create first broadcast code
    await promosService.create({
      code: "LIVEBROADCAST1",
      discountAmount: 300,
      description: "First live broadcast",
      isBroadcast: true,
    });

    // Attempt to create second broadcast code -> rejected with friendly message
    await expect(
      promosService.create({
        code: "LIVEBROADCAST2",
        discountAmount: 400,
        description: "Second live broadcast",
        isBroadcast: true,
      }),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: "BROADCAST_CONFLICT",
        message: "Another code is already broadcast. Turn it off first.",
        statusCode: 409,
      }),
    );

    // Create code with isBroadcast=false, then try to update to true -> rejected
    const nonBroadcast = await promosService.create({
      code: "OFFLINECODE",
      discountAmount: 200,
      description: "Offline code",
      isBroadcast: false,
    });

    await expect(
      promosService.update(nonBroadcast.id, {
        isBroadcast: true,
      }),
    ).rejects.toThrowError(
      expect.objectContaining({
        code: "BROADCAST_CONFLICT",
        message: "Another code is already broadcast. Turn it off first.",
        statusCode: 409,
      }),
    );
  });

  it("featured endpoint returns null when none live, or returns code when live", async () => {
    const db = createMemoryRepositories();
    const promosService = createPromosService({ db });

    // Initially no codes are broadcast
    const initial = await promosService.getFeatured();
    expect(initial).toBeNull();

    // Create a live broadcast code
    await promosService.create({
      code: "BROADCAST100",
      discountAmount: 100,
      minTotal: 1500,
      description: "100 off on all rides",
      isBroadcast: true,
      isActive: true,
      allowGroupVehicles: true,
    });

    const live = await promosService.getFeatured();
    expect(live).not.toBeNull();
    expect(live?.code).toBe("BROADCAST100");
    expect(live?.discountAmount).toBe(100);
    expect(live?.minTotal).toBe(1500);
    expect(live?.allowGroupVehicles).toBe(true);
  });

  it("expired, inactive, or redemption-exhausted codes are never broadcast", async () => {
    const db = createMemoryRepositories();
    const promosService = createPromosService({ db });

    // 1. Inactive code with isBroadcast=true
    const inactive = await db.promos.create({
      id: "inactive-code",
      code: "INACTIVE100",
      discountAmount: 100,
      minTotal: 0,
      description: "Inactive code",
      isActive: false,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: false,
      isBroadcast: true,
    });

    expect(await promosService.getFeatured()).toBeNull();
    await db.promos.delete(inactive.id);

    // 2. Expired code with isBroadcast=true
    const expired = await db.promos.create({
      id: "expired-code",
      code: "EXPIRED100",
      discountAmount: 100,
      minTotal: 0,
      description: "Expired code",
      isActive: true,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: "2020-01-01T00:00:00.000Z",
      validTo: "2020-12-31T23:59:59.000Z",
      allowGroupVehicles: false,
      isBroadcast: true,
    });

    expect(await promosService.getFeatured()).toBeNull();
    await db.promos.delete(expired.id);

    // 3. Redemption-exhausted code with isBroadcast=true
    await db.promos.create({
      id: "exhausted-code",
      code: "EXHAUSTED100",
      discountAmount: 100,
      minTotal: 0,
      description: "Exhausted code",
      isActive: true,
      maxRedemptions: 10,
      redemptionCount: 10,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: false,
      isBroadcast: true,
    });

    expect(await promosService.getFeatured()).toBeNull();
  });
});

describe("Promos HTTP Endpoints (Public Featured & Admin CRUD)", () => {
  const AUTH = { authorization: "Bearer test-super_admin" } as const;

  it("public GET /api/v1/promos/featured returns null when none live, or returns code shape when live", async () => {
    const { createTestApp } = await import("../helpers.js");
    const { app, db } = await createTestApp();

    // 1. When no promo is broadcast
    const resEmpty = await app.inject({
      method: "GET",
      url: "/api/v1/promos/featured",
    });
    expect(resEmpty.statusCode).toBe(200);
    expect(resEmpty.json().data).toBeNull();

    // 2. When a promo is broadcast
    await db.promos.create({
      id: "featured-uuid",
      code: "LIVEFEATURED",
      discountAmount: 250,
      minTotal: 1200,
      description: "Featured promo test",
      isActive: true,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: true,
      isBroadcast: true,
    });

    const resLive = await app.inject({
      method: "GET",
      url: "/api/v1/promos/featured",
    });
    expect(resLive.statusCode).toBe(200);
    expect(resLive.json().data).toEqual({
      code: "LIVEFEATURED",
      discountAmount: 250,
      minTotal: 1200,
      description: "Featured promo test",
      allowGroupVehicles: true,
    });
  });

  it("admin CRUD endpoints enforce auth and broadcast collision message", async () => {
    const { createTestApp } = await import("../helpers.js");
    const { app } = await createTestApp();

    // 1. Unauthorized request without token fails
    const resUnauth = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/promos",
    });
    expect(resUnauth.statusCode).toBe(401);

    // 2. Admin creates first broadcast promo
    const resCreate1 = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/promos",
      headers: AUTH,
      payload: {
        code: "BROADCASTONE",
        discountAmount: 400,
        minTotal: 2000,
        description: "First broadcast code",
        allowGroupVehicles: false,
        isBroadcast: true,
      },
    });
    expect(resCreate1.statusCode).toBe(201);
    const promo1 = resCreate1.json().data;
    expect(promo1.code).toBe("BROADCASTONE");

    // 3. Admin attempts to create second broadcast promo -> rejected 409
    const resCreate2 = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/promos",
      headers: AUTH,
      payload: {
        code: "BROADCASTTWO",
        discountAmount: 600,
        description: "Second broadcast code",
        isBroadcast: true,
      },
    });
    expect(resCreate2.statusCode).toBe(409);
    expect(resCreate2.json().error.message).toBe("Another code is already broadcast. Turn it off first.");

    // 4. Admin creates offline promo, then tries to update isBroadcast=true -> rejected 409
    const resCreate3 = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/promos",
      headers: AUTH,
      payload: {
        code: "OFFLINEPROMO",
        discountAmount: 150,
        description: "Offline code",
        isBroadcast: false,
      },
    });
    expect(resCreate3.statusCode).toBe(201);
    const promo3 = resCreate3.json().data;

    const resUpdateConflict = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/promos/${promo3.id}`,
      headers: AUTH,
      payload: {
        isBroadcast: true,
      },
    });
    expect(resUpdateConflict.statusCode).toBe(409);
    expect(resUpdateConflict.json().error.message).toBe("Another code is already broadcast. Turn it off first.");

    // 5. Admin turns off broadcast on promo 1, then enables promo 3 -> succeeds
    const resTurnOff = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/promos/${promo1.id}`,
      headers: AUTH,
      payload: {
        isBroadcast: false,
      },
    });
    expect(resTurnOff.statusCode).toBe(200);

    const resEnable3 = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/promos/${promo3.id}`,
      headers: AUTH,
      payload: {
        isBroadcast: true,
      },
    });
    expect(resEnable3.statusCode).toBe(200);
    expect(resEnable3.json().data.isBroadcast).toBe(true);

    // 6. Admin deletes promo
    const resDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/ops/admin/promos/${promo3.id}`,
      headers: AUTH,
    });
    expect(resDelete.statusCode).toBe(200);
  });
});

describe("Promo redemption accounting", () => {
  it("consumes a code once and refuses redemption after the limit", async () => {
    const db = createMemoryRepositories();
    await db.promos.create({
      id: "limited-redemption",
      code: "LIMITED100",
      discountAmount: 100,
      minTotal: 0,
      description: "One redemption only",
      isActive: true,
      maxRedemptions: 1,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
      allowGroupVehicles: false,
      isBroadcast: false,
    });

    const first = await db.promos.consume("limited100");
    const second = await db.promos.consume("LIMITED100");

    expect(first?.redemptionCount).toBe(1);
    expect(second).toBeNull();
    expect((await db.promos.getByCode("LIMITED100"))?.redemptionCount).toBe(1);
  });
});
