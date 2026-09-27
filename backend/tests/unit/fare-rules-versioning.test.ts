import { describe, it, expect } from "vitest";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { createAdminService } from "../../src/modules/admin/admin.service.js";
import { newId } from "../../src/shared/ids.js";

describe("Fare Rules Versioning & Unique-Active Invariant (Step 1.4)", () => {
  it("enforces unique active rule invariant when saving new active rules", async () => {
    const db = createMemoryRepositories();

    // Version 1 saved as active
    await db.fareRules.save({
      id: newId(),
      version: "v1",
      config: { vehicles: [{ tier: "sedan", perKm: 12 }] },
      effectiveFrom: "2026-09-01T00:00:00Z",
      isActive: true,
      createdAt: "2026-09-01T00:00:00Z",
    });

    let active = await db.fareRules.getActive();
    expect(active?.version).toBe("v1");
    expect(active?.isActive).toBe(true);

    // Version 2 saved as active - must deactivate version 1
    await db.fareRules.save({
      id: newId(),
      version: "v2",
      config: { vehicles: [{ tier: "sedan", perKm: 14 }] },
      effectiveFrom: "2026-09-10T00:00:00Z",
      isActive: true,
      createdAt: "2026-09-10T00:00:00Z",
    });

    active = await db.fareRules.getActive();
    expect(active?.version).toBe("v2");
    expect(active?.isActive).toBe(true);

    const v1 = await db.fareRules.getByVersion("v1");
    expect(v1?.isActive).toBe(false);
    expect(v1?.effectiveTo).toBeDefined();

    // Verify all versions: exactly one is active
    const all = await db.fareRules.listAll();
    const activeCount = all.filter((r) => r.isActive).length;
    expect(activeCount).toBe(1);
  });

  it("allows saving draft inactive versions without deactivating the current active version", async () => {
    const db = createMemoryRepositories();

    await db.fareRules.save({
      id: newId(),
      version: "prod-v1",
      config: { vehicles: [{ tier: "sedan", perKm: 12 }] },
      effectiveFrom: "2026-09-01T00:00:00Z",
      isActive: true,
      createdAt: "2026-09-01T00:00:00Z",
    });

    // Save inactive draft
    await db.fareRules.save({
      id: newId(),
      version: "draft-v2",
      config: { vehicles: [{ tier: "sedan", perKm: 18 }] },
      effectiveFrom: "2026-10-01T00:00:00Z",
      isActive: false,
      createdAt: "2026-09-15T00:00:00Z",
    });

    const active = await db.fareRules.getActive();
    expect(active?.version).toBe("prod-v1");

    const draft = await db.fareRules.getByVersion("draft-v2");
    expect(draft?.isActive).toBe(false);
  });

  it("transactionally activates a prior version and updates audit log", async () => {
    const db = createMemoryRepositories();
    const adminService = createAdminService({ db });
    const actor = { id: "admin-uuid-1", email: "admin@example.com", role: "super_admin" };

    // Create v1
    await adminService.updateFareRules(actor, {
      version: "ver-100",
      vehicles: [{ tier: "sedan", perKm: 12, active: true }],
    });

    // Create v2
    await adminService.updateFareRules(actor, {
      version: "ver-200",
      vehicles: [{ tier: "sedan", perKm: 16, active: true }],
    });

    let current = await db.fareRules.getActive();
    expect(current?.version).toBe("ver-200");

    // Activate ver-100 (rollback / switch)
    await adminService.activateFareRules(actor, "ver-100");

    current = await db.fareRules.getActive();
    expect(current?.version).toBe("ver-100");
    expect(current?.isActive).toBe(true);

    const oldV2 = await db.fareRules.getByVersion("ver-200");
    expect(oldV2?.isActive).toBe(false);

    // Verify audit log recorded activation
    const auditLogs = await db.audit.list();
    const activationAudit = auditLogs.find((a) => a.action === "activate_fare_rules");
    expect(activationAudit).toBeDefined();
    expect(activationAudit?.resourceId).toBe("ver-100");
  });
});
