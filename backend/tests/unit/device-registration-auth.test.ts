import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft } from "../helpers.js";

describe("Device Registration Ownership Lock-down (Step 1.6 / SEC-005)", () => {
  it("allows anonymous device registration when neither userId nor bookingId is provided", async () => {
    const { app } = await createTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/devices/register",
      payload: {
        deviceId: "dev_anon_101",
        platform: "web",
        fcmToken: "fcm_token_anon_abc",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.success).toBe(true);
    expect(res.json().data.deviceId).toBe("dev_anon_101");

    await app.close();
  });

  describe("userId ownership enforcement", () => {
    const customerId = "00000000-0000-4000-a000-000000000000";
    const otherUserId = "11111111-1111-4111-8111-111111111111";

    it("rejects unauthenticated request attempting to link device to a userId", async () => {
      const { app } = await createTestApp();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_user_1",
          platform: "android",
          fcmToken: "fcm_token_1",
          userId: customerId,
        },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("UNAUTHORIZED");

      await app.close();
    });

    it("rejects authenticated customer attempting to link device to another user's account", async () => {
      const { app } = await createTestApp();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        headers: {
          authorization: "Bearer test-customer",
        },
        payload: {
          deviceId: "dev_user_2",
          platform: "ios",
          fcmToken: "fcm_token_2",
          userId: otherUserId,
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe("FORBIDDEN");

      await app.close();
    });

    it("allows authenticated customer to link device to their own userId", async () => {
      const { app } = await createTestApp();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        headers: {
          authorization: "Bearer test-customer",
        },
        payload: {
          deviceId: "dev_user_3",
          platform: "android",
          fcmToken: "fcm_token_3",
          userId: customerId,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.success).toBe(true);

      await app.close();
    });

    it("allows admin to register device for any userId", async () => {
      const { app } = await createTestApp();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        headers: {
          authorization: "Bearer test-super_admin",
        },
        payload: {
          deviceId: "dev_user_4",
          platform: "web",
          fcmToken: "fcm_token_4",
          userId: otherUserId,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.success).toBe(true);

      await app.close();
    });
  });

  describe("bookingId / ticketId ownership enforcement", () => {
    it("returns 404 if booking is not found", async () => {
      const { app } = await createTestApp();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_book_0",
          platform: "android",
          fcmToken: "fcm_token_0",
          bookingId: "00000000-0000-4000-8000-000000000999",
          guestAccessToken: "some-token",
        },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("BOOKING_NOT_FOUND");

      await app.close();
    });

    it("rejects registering device for booking without proof of ownership", async () => {
      const { app } = await createTestApp();

      // Create a booking
      const draftRes = await app.inject({
        method: "POST",
        url: "/api/v1/bookings/draft",
        payload: sampleDraft,
      });
      const draft = draftRes.json().data as {
        bookingId: string;
        ticketId: string;
        guestAccessToken: string;
      };

      // 1. Without token or auth
      const noTokenRes = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_book_1",
          platform: "web",
          fcmToken: "fcm_token_b1",
          bookingId: draft.bookingId,
        },
      });
      expect(noTokenRes.statusCode).toBe(403);
      expect(noTokenRes.json().error.code).toBe("FORBIDDEN");

      // 2. With invalid guestAccessToken
      const wrongTokenRes = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_book_2",
          platform: "web",
          fcmToken: "fcm_token_b2",
          ticketId: draft.ticketId,
          guestAccessToken: "invalid-wrong-token-abc",
        },
      });
      expect(wrongTokenRes.statusCode).toBe(403);
      expect(wrongTokenRes.json().error.code).toBe("FORBIDDEN");

      await app.close();
    });

    it("allows registering device when valid guestAccessToken is provided for bookingId or ticketId", async () => {
      const { app, db } = await createTestApp();

      const draftRes = await app.inject({
        method: "POST",
        url: "/api/v1/bookings/draft",
        payload: sampleDraft,
      });
      const draft = draftRes.json().data as {
        bookingId: string;
        ticketId: string;
        guestAccessToken: string;
      };

      // 1. Using bookingId + guestAccessToken
      const resById = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_book_valid_1",
          platform: "android",
          fcmToken: "fcm_token_valid_1",
          bookingId: draft.bookingId,
          guestAccessToken: draft.guestAccessToken,
        },
      });
      expect(resById.statusCode).toBe(200);
      expect(resById.json().data.success).toBe(true);

      const device1 = await db.devices.getByDeviceId("dev_book_valid_1");
      expect(device1?.bookingId).toBe(draft.bookingId);

      // 2. Using ticketId + guestAccessToken
      const resByTicket = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        payload: {
          deviceId: "dev_book_valid_2",
          platform: "ios",
          fcmToken: "fcm_token_valid_2",
          ticketId: draft.ticketId,
          guestAccessToken: draft.guestAccessToken,
        },
      });
      expect(resByTicket.statusCode).toBe(200);
      expect(resByTicket.json().data.success).toBe(true);

      const device2 = await db.devices.getByDeviceId("dev_book_valid_2");
      expect(device2?.bookingId).toBe(draft.bookingId);

      await app.close();
    });

    it("allows privileged admin to register device for a booking without guestAccessToken", async () => {
      const { app, db } = await createTestApp();

      const draftRes = await app.inject({
        method: "POST",
        url: "/api/v1/bookings/draft",
        payload: sampleDraft,
      });
      const draft = draftRes.json().data as { bookingId: string };

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/devices/register",
        headers: {
          authorization: "Bearer test-super_admin",
        },
        payload: {
          deviceId: "dev_admin_link",
          platform: "web",
          fcmToken: "fcm_admin_tok",
          bookingId: draft.bookingId,
        },
      });

      expect(res.statusCode).toBe(200);
      const dev = await db.devices.getByDeviceId("dev_admin_link");
      expect(dev?.bookingId).toBe(draft.bookingId);

      await app.close();
    });
  });
});
