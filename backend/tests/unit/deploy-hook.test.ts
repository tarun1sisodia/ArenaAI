import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLatestReleaseAttempt,
  resetLatestReleaseAttempt,
  triggerFrontendRebuild,
} from "../../src/shared/deploy-hook.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetLatestReleaseAttempt();
});

describe("deploy hook release status (P0-T02)", () => {
  it("treats a missing PAGES_DEPLOY_HOOK_URL as publish_committed, not release_deployed", async () => {
    vi.stubEnv("PAGES_DEPLOY_HOOK_URL", "");
    const result = await triggerFrontendRebuild({
      reason: "route-catalog-publish",
      correlationId: "corr-missing-hook-1",
      entityType: "route",
      entityId: "11111111-1111-1111-1111-111111111111",
      slug: "agra-to-delhi-taxi",
    });
    expect(result.status).toBe("hook_missing");
    expect(result.releaseState).toBe("publish_committed");
    expect(result.releaseState).not.toBe("release_deployed");
    expect(getLatestReleaseAttempt()?.correlationId).toBe("corr-missing-hook-1");
    expect(getLatestReleaseAttempt()?.deployHookConfigured).toBe(false);
  });

  it("records queued when the hook accepts the request", async () => {
    vi.stubEnv("PAGES_DEPLOY_HOOK_URL", "https://hooks.example.test/deploy");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
    const result = await triggerFrontendRebuild("route-catalog-publish");
    expect(result.status).toBe("queued");
    expect(result.releaseState).toBe("release_queued");
    expect(result.httpStatus).toBe(200);
  });
});
