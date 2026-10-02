import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";
describe("rental enquiries", () => {
  it("rejects an invalid phone and a return date before pickup", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: "POST", url: "/api/v1/rental-enquiries", payload: { name: "Aman Sharma", phone: "123", carTier: "sedan", pickupDate: "2026-10-12", returnDate: "2026-10-11", pickupLocation: "Agra Cantt", website: "" } });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
    await app.close();
  });
  it("creates a rental request and requires admin auth for the operations list", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({ method: "POST", url: "/api/v1/rental-enquiries", payload: { name: "Aman Sharma", phone: "9876543210", email: "aman@example.com", carTier: "innova", pickupDate: "2026-10-12", returnDate: "2026-10-14", pickupLocation: "Agra Cantt", withDriver: true, note: "Early pickup", website: "" } });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.ref).toMatch(/^RNT-\d{4}-\d{6}$/);
    const denied = await app.inject({ method: "GET", url: "/api/v1/ops/admin/rental-enquiries" });
    expect(denied.statusCode).toBe(401);
    const listed = await app.inject({ method: "GET", url: "/api/v1/ops/admin/rental-enquiries?status=new&car=innova", headers: { authorization: "Bearer test-super_admin" } });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().data.items[0].name).toBe("Aman Sharma");
    const id = listed.json().data.items[0].id;
    const updated = await app.inject({ method: "PATCH", url: `/api/v1/ops/admin/rental-enquiries/${id}`, headers: { authorization: "Bearer test-super_admin" }, payload: { status: "contacted", note: "Called customer" } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.status).toBe("contacted");
    expect(updated.json().data.notes).toContain("Called customer");
    await app.close();
  });
});
