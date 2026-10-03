// backend/src/shared/deploy-hook.ts
// Shared frontend deploy hook trigger for Cloudflare Pages rebuilds

export async function triggerFrontendRebuild(reason?: string): Promise<void> {
  const hook = process.env.PAGES_DEPLOY_HOOK_URL?.trim();
  if (!hook) {
    console.warn("WARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild");
    return;
  }
  try {
    const response = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: reason ? JSON.stringify({ reason }) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`WARN: frontend rebuild hook returned HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn(
      `WARN: frontend rebuild hook failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}
