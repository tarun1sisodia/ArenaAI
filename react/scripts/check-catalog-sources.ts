import {
  assertFailClosedCatalogEnv,
  catalogSourceUsesStagingHost,
  isFailClosedCatalogBuild,
  listCatalogSources,
  redactCatalogUrl,
  resolveCatalogApiBase,
  type CatalogSource,
} from "./catalog-sources.ts";

type SourceProbe = {
  name: string;
  envVar: string;
  url: string | null;
  httpStatus: number | null;
  releaseId: string | number | null;
  manifestVersion: string | number | null;
  itemCount: number | null;
  schemaOk: boolean;
  error: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readReleaseField(payload: unknown, key: string): string | number | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const value = root?.[key] ?? data?.[key];
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

function countItems(source: CatalogSource, payload: unknown): number | null {
  const root = asRecord(payload);
  const data = root?.data;
  if (Array.isArray(data)) return data.length;
  if (source.name === "content-manifest" && data && typeof data === "object") {
    return Object.keys(data).length;
  }
  if (Array.isArray(payload)) return payload.length;
  return null;
}

function validateSchema(source: CatalogSource, payload: unknown): boolean {
  const root = asRecord(payload);
  if (!root) return false;
  if (source.name === "content-manifest") {
    return Boolean(root.data && typeof root.data === "object" && !Array.isArray(root.data));
  }
  return Array.isArray(root.data);
}

async function probeSource(source: CatalogSource): Promise<SourceProbe> {
  if (!source.url) {
    return {
      name: source.name,
      envVar: source.envVar,
      url: null,
      httpStatus: null,
      releaseId: null,
      manifestVersion: null,
      itemCount: null,
      schemaOk: false,
      error: `${source.envVar} is unset and VITE_API_BASE_URL/CATALOG_API_URL cannot derive it`,
    };
  }
  const safeUrl = redactCatalogUrl(source.url);
  try {
    const response = await fetch(source.url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const httpStatus = response.status;
    if (!response.ok) {
      return {
        name: source.name,
        envVar: source.envVar,
        url: safeUrl,
        httpStatus,
        releaseId: null,
        manifestVersion: null,
        itemCount: null,
        schemaOk: false,
        error: `HTTP ${httpStatus}`,
      };
    }
    const payload: unknown = await response.json();
    const schemaOk = validateSchema(source, payload);
    return {
      name: source.name,
      envVar: source.envVar,
      url: safeUrl,
      httpStatus,
      releaseId: readReleaseField(payload, "releaseId"),
      manifestVersion: readReleaseField(payload, "manifestVersion"),
      itemCount: countItems(source, payload),
      schemaOk,
      error: schemaOk ? null : "Response JSON is missing the expected data envelope",
    };
  } catch (error) {
    return {
      name: source.name,
      envVar: source.envVar,
      url: safeUrl,
      httpStatus: null,
      releaseId: null,
      manifestVersion: null,
      itemCount: null,
      schemaOk: false,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}

function printProbe(probe: SourceProbe): void {
  console.log(`- ${probe.name}`);
  console.log(`    variable: ${probe.envVar}`);
  console.log(`    url: ${probe.url ?? "(unset)"}`);
  console.log(`    httpStatus: ${probe.httpStatus ?? "n/a"}`);
  console.log(`    releaseId: ${probe.releaseId ?? "n/a"}`);
  console.log(`    manifestVersion: ${probe.manifestVersion ?? "n/a"}`);
  console.log(`    itemCount: ${probe.itemCount ?? "n/a"}`);
  console.log(`    schema: ${probe.schemaOk ? "ok" : "invalid"}`);
  if (probe.error) console.log(`    error: ${probe.error}`);
}

export async function runCatalogSourceCheck(env: NodeJS.ProcessEnv = process.env): Promise<number> {
  console.log("check-catalog-sources");
  console.log(`failClosed: ${isFailClosedCatalogBuild(env) ? "yes" : "no"}`);
  console.log(`apiBase: ${resolveCatalogApiBase(env) ? redactCatalogUrl(resolveCatalogApiBase(env)!) : "(unset)"}`);

  try {
    assertFailClosedCatalogEnv(env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }

  const sources = listCatalogSources(env);
  const probes = await Promise.all(sources.map(probeSource));
  for (const probe of probes) printProbe(probe);

  const failures: string[] = [];
  const versions = new Set<string>();
  for (const probe of probes) {
    if (!probe.url) failures.push(`${probe.name}: missing URL`);
    if (probe.httpStatus === 404 || probe.httpStatus === 500) failures.push(`${probe.name}: HTTP ${probe.httpStatus}`);
    if (probe.error) failures.push(`${probe.name}: ${probe.error}`);
    if (!probe.schemaOk) failures.push(`${probe.name}: schema invalid`);
    if (catalogSourceUsesStagingHost(probe.url ?? undefined) && env.CF_PAGES_BRANCH === "main" && env.ALLOW_STAGING_CATALOG !== "1") {
      failures.push(`${probe.name}: production must not use the staging API host`);
    }
    if (probe.manifestVersion != null) versions.add(String(probe.manifestVersion));
    if (probe.releaseId != null) versions.add(`release:${probe.releaseId}`);
  }
  const releaseIds = new Set(probes.map((probe) => probe.releaseId).filter((value) => value != null));
  const manifestVersions = new Set(probes.map((probe) => probe.manifestVersion).filter((value) => value != null));
  if (releaseIds.size > 1) failures.push("releaseId values differ between catalog sections");
  if (manifestVersions.size > 1) failures.push("manifestVersion values differ between catalog sections");

  if (failures.length > 0) {
    console.error("check-catalog-sources failed:");
    for (const failure of failures) console.error(`  - ${failure}`);
    return 1;
  }
  console.log("check-catalog-sources passed");
  return 0;
}

if ((process.argv[1] ?? "").includes("check-catalog-sources")) {
  process.exitCode = await runCatalogSourceCheck();
}
