import { strict as assert } from "node:assert";

export interface SeoPageFinding {
  path: string;
  severity: "warning" | "error";
  code: string;
  message: string;
}

export interface SeoPageQuality {
  path: string;
  titleLength: number;
  descriptionLength: number;
  h1Count: number;
  wordCount: number;
  internalLinkCount: number;
  findings: SeoPageFinding[];
}

const textOnly = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const decodeHtml = (value: string): string => value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const metaContent = (html: string, name: string): string => {
  const tag = html.match(new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, "i"))?.[0] ?? "";
  return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
};

export function inspectSeoHtml(path: string, html: string, canonicalDomain: string): SeoPageQuality {
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const description = decodeHtml(metaContent(html, "description"));
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const internalLinkCount = (html.match(/href=["']\/(?!\/)/gi) ?? []).length;
  const words = textOnly(html).split(/\s+/).filter(Boolean);
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
  const indexable = !/noindex/i.test(robots);
  const findings: SeoPageFinding[] = [];
  const add = (severity: SeoPageFinding["severity"], code: string, message: string) => findings.push({ path, severity, code, message });

  if (indexable) {
    if (!title) add("error", "missing-title", "No title element found.");
    else if (title.length > 60) add("warning", "title-too-long", `Title is ${title.length} characters; keep it at or below 60.`);
    if (!description) add("error", "missing-description", "No meta description found.");
    else if (description.length > 155) add("warning", "description-too-long", `Meta description is ${description.length} characters; keep it at or below 155.`);
    if (h1Count !== 1) add("error", "h1-count", `Expected exactly one H1, found ${h1Count}.`);
    if (!html.includes(`<link rel="canonical" href="${canonicalDomain}`)) add("error", "canonical-missing", "Canonical URL is missing or not on the canonical domain.");
    if (/\bTBD\b|confirm with client/i.test(textOnly(html))) add("error", "unresolved-tbd", "Unresolved TBD/client-confirmation text is indexable.");
    if (words.length < 180) add("warning", "thin-page", `Rendered page contains ${words.length} words; review before indexing.`);
    if (path.includes("/en/") && internalLinkCount < 3) add("warning", "weak-internal-links", `Rendered page has only ${internalLinkCount} internal links.`);
  }

  return { path, titleLength: title.length, descriptionLength: description.length, h1Count, wordCount: words.length, internalLinkCount, findings };
}

export function assertBuildSafeSeo(quality: SeoPageQuality): void {
  const errors = quality.findings.filter((finding) => finding.severity === "error");
  assert.equal(errors.length, 0, `${quality.path} has SEO build errors: ${errors.map((error) => error.message).join(" ")}`);
}

export function findDuplicateIntros(pages: Array<{ path: string; intro: string }>): SeoPageFinding[] {
  const seen = new Map<string, string>();
  const findings: SeoPageFinding[] = [];
  for (const page of pages) {
    const normalized = page.intro.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const previous = seen.get(normalized);
    if (previous) {
      findings.push({ path: page.path, severity: "warning", code: "duplicate-intro", message: `Intro duplicates ${previous}.` });
    } else {
      seen.set(normalized, page.path);
    }
  }
  return findings;
}
