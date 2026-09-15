# scripts/network — H1 (Network & Transport) tooling

## What lives here

| File | Purpose |
|---|---|
| `verify-t1-headers.mjs` | Proves the H1 wiring shipped: preconnects in built HTML, LCP `Link` preload in `_headers`, and (optionally) live `alt-svc` / `Link` response headers. |

Run it via the root script (works from the repository root):

```bash
npm run verify:t1
T1_CUSTOMER_URL=https://<your-domain> npm run verify:t1   # adds live CDN checks
```

## Reading failures

| Failure | Meaning | Fix |
|---|---|---|
| `customer shell carries LocationIQ preconnect` | `react/index.html` edit missing from `react/dist` | Rebuild: `npm run customer:build` |
| `preconnect propagates to prerendered pages` | Prerender template dropped `<head>` extras | Inspect `react/scripts/prerender.ts` head injection |
| `_headers preloads LCP image on …` | `Link` preload missing from `react/public/_headers` | Re-add; keep href identical to the bento `<img src>` |
| `admin font preconnects intact` | Admin shell `<head>` regressed | Restore `admin/index.html` font links |
| `live: alt-svc advertises h3` | HTTP/3 toggle OFF (or DNS not proxied) | Cloudflare → Network → HTTP/3 ON; orange-cloud the record |
| `live: Link header preloads LCP image` | `_headers` not deployed for `/` | Redeploy customer site; purge Cloudflare cache once |

## Notes

- A `103 Early Hints` interim response is consumed by HTTP clients and cannot be
  asserted with `fetch`/`curl` reliably — the `Link` response header is the
  correct proxy. Confirm the actual 103 in Chrome DevTools → Network → click `/`
  → look for "Early Hints" in the timing/response section.
- Razorpay and font preconnects are intentionally **not** part of H1: Razorpay
  loads with Phase I2 (live checkout) and fonts land with H7. Only hosts fetched
  during the visit are preconnected.
