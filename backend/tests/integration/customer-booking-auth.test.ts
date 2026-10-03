import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";

const customer = { authorization: "Bearer test-customer" };
const other = { authorization: "Bearer test-super_admin" };

function intentPayload(key: string) {
  return { ...sampleDraft, idempotencyKey: key, customerPhone: "9876543221" };
}

describe("customer booking intent authentication", () => {
  it("rotates the one-time recovery secret when the same create request is retried", async () => {
    const { app } = await createTestApp();
    const key = "11111111-1111-4111-8111-111111111111";
    const first = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload(key) });
    const second = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload(key) });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.json().data.intentId).toBe(first.json().data.intentId);
    expect(second.json().data.resumeSecret).not.toBe(first.json().data.resumeSecret);
    const oldSecret = await app.inject({ method: "GET", url: `/api/v1/booking-intents/${first.json().data.intentId}`, headers: { "x-booking-intent-secret": first.json().data.resumeSecret } });
    const currentSecret = await app.inject({ method: "GET", url: `/api/v1/booking-intents/${second.json().data.intentId}`, headers: { "x-booking-intent-secret": second.json().data.resumeSecret } });
    expect(oldSecret.statusCode).toBe(401);
    expect(currentSecret.statusCode).toBe(200);
    await app.close();
  });

  it("recovers an unclaimed intent by secret but forbids anonymous finalize", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") });
    expect(created.statusCode).toBe(201);
    const { intentId, resumeSecret } = created.json().data;
    const recovered = await app.inject({ method: "GET", url: `/api/v1/booking-intents/${intentId}`, headers: { "x-booking-intent-secret": resumeSecret } });
    expect(recovered.statusCode).toBe(200);
    expect(recovered.json().data.payload.customerName).toBe(sampleDraft.customerName);
    expect(recovered.json().data.resumeSecret).toBeUndefined();
    const anonymous = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { "x-booking-intent-secret": resumeSecret }, payload: {} });
    expect(anonymous.statusCode).toBe(401);
    await app.close();
  });

  it("finalizes for the verified customer, rejects another user, and replays idempotently", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb") });
    const { intentId, resumeSecret } = created.json().data;
    const wrongSecret = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...customer, "x-booking-intent-secret": "wrong-secret-value" }, payload: {} });
    expect(wrongSecret.statusCode).toBe(401);
    const finalized = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...customer, "x-booking-intent-secret": resumeSecret }, payload: {} });
    expect(finalized.statusCode).toBe(201);
    const wrongUser = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...other, "x-booking-intent-secret": resumeSecret }, payload: {} });
    expect(wrongUser.statusCode).toBe(403);
    expect(finalized.json().data.booking).toBeTruthy();
    const replay = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...customer, "x-booking-intent-secret": resumeSecret }, payload: {} });
    expect(replay.statusCode).toBe(201);
    expect(replay.json().data.replay).toBe(true);
    expect(replay.json().data.booking.id).toBe(finalized.json().data.booking.id);
    await app.close();
  });

  it("lists and gets only account-owned bookings", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload("cccccccc-cccc-4ccc-8ccc-cccccccccccc") });
    const { intentId, resumeSecret } = created.json().data;
    const finalized = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...customer, "x-booking-intent-secret": resumeSecret }, payload: {} });
    const booking = finalized.json().data.booking;
    const mine = await app.inject({ method: "GET", url: "/api/v1/me/bookings", headers: customer });
    expect(mine.statusCode).toBe(200);
    expect(mine.json().data.items.some((item: { id: string }) => item.id === booking.id)).toBe(true);
    const detail = await app.inject({ method: "GET", url: `/api/v1/me/bookings/${booking.id}`, headers: customer });
    expect(detail.statusCode).toBe(200);
    const otherDetail = await app.inject({ method: "GET", url: `/api/v1/me/bookings/${booking.id}`, headers: other });
    expect(otherDetail.statusCode).toBe(404);
    await app.close();
  });

  it("allows owner checkout without a guest token and rejects an unproven checkout", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload("dddddddd-dddd-4ddd-8ddd-dddddddddddd") });
    const { intentId, resumeSecret } = created.json().data;
    const finalized = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers: { ...customer, "x-booking-intent-secret": resumeSecret }, payload: {} });
    const booking = finalized.json().data.booking;
    const denied = await app.inject({ method: "POST", url: "/api/v1/payments/create-checkout", payload: { ticketId: booking.ticketId, idempotencyKey: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" } });
    expect(denied.statusCode).toBe(404);
    const checkout = await app.inject({ method: "POST", url: "/api/v1/payments/create-checkout", headers: customer, payload: { ticketId: booking.ticketId, idempotencyKey: "ffffffff-ffff-4fff-8fff-ffffffffffff" } });
    expect(checkout.statusCode).toBe(201);
    await app.close();
  });

  it("keeps a changed fare unaccepted across retries until the customer acknowledges it", async () => {
    const db = createMemoryRepositories();
    const { app } = await createTestApp(db);
    const created = await app.inject({ method: "POST", url: "/api/v1/booking-intents", payload: intentPayload("99999999-9999-4999-8999-999999999999") });
    expect(created.statusCode).toBe(201);
    const { intentId, resumeSecret } = created.json().data;
    const active = await db.fareRules.getActive();
    expect(active).toBeTruthy();
    const config = active!.config as { vehicles: Array<Record<string, unknown>> };
    await db.fareRules.save({
      ...active!,
      id: "10000000-0000-4000-a000-000000000099",
      version: `${active!.version}-customer-test-change`,
      config: { ...config, vehicles: config.vehicles.map((vehicle) => vehicle.id === "sedan" ? { ...vehicle, perKm: 55 } : vehicle) },
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      isActive: true,
    });
    const headers = { ...customer, "x-booking-intent-secret": resumeSecret };
    const changedFare = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers, payload: {} });
    expect(changedFare.statusCode).toBe(409);
    expect(changedFare.json().error.code).toBe("FARE_RECONFIRMATION_REQUIRED");
    const retryWithoutAcceptance = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers, payload: {} });
    expect(retryWithoutAcceptance.statusCode).toBe(409);
    expect(retryWithoutAcceptance.json().error.code).toBe("FARE_RECONFIRMATION_REQUIRED");
    const accepted = await app.inject({ method: "POST", url: `/api/v1/booking-intents/${intentId}/finalize`, headers, payload: { acceptUpdatedFare: true } });
    expect(accepted.statusCode).toBe(201);
    expect(accepted.json().data.booking).toBeTruthy();
    await app.close();
  });
});
