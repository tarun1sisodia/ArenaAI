# Monthly SEO sweep log

This is an append-only operational log. Add one dated section per monthly sweep; do not rewrite prior observations.

## Procedure

- In Search Console, identify pages in the top impression quartile with CTR below 2%.
- Record the five highest-priority pages, their old title/description, and any approved replacement.
- Run `npm run customer:build` followed by `npm run customer:seo:audit` and attach the audit CSV to the release record.
- Check the sitemap contains only rendered canonical pages and that no booking or redirect-only route is submitted.
- Record AI-citation checks for the approved prompts: `best tempo traveller on rent in Agra` and `Delhi to Agra one day tour by car`.

## 2026-10-01 baseline

- Sitemap generator changed to an explicit rendered-route allowlist; the generated catalog's 963 locality identifiers are no longer submitted automatically.
- Vehicle aliases remain redirect-only and are not sitemap entries.
- `llms.txt` is present and points to the main commercial pages.
- External GSC fetch checks and AI-citation results are not available from the repository build; complete them in the owner's Search Console/AI tools.
- Pricing conflict and operational figures remain client-confirmation blockers; no unverified values were added.

## Monthly entry template

### YYYY-MM-DD

| Metric | Result | Evidence / action |
|---|---|---|
| Pages with low CTR | TBD | Search Console export/link |
| Title/meta changes | TBD | Old → new values |
| Sitemap URL count | TBD | `react/public/sitemap.xml` |
| SEO audit errors | TBD | `seo-audit-YYYY-MM-DD.csv` |
| Googlebot fetch checks | TBD | URL Inspection results |
| AI-citation: tempo traveller query | TBD | ChatGPT / Perplexity / Google AI Mode |
| AI-citation: Delhi–Agra query | TBD | ChatGPT / Perplexity / Google AI Mode |
