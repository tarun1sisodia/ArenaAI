# Main branch verification — 01ee2dcbdceb

- **Result:** PASS
- **Commit:** [01ee2dcbdcebc2d659fee0f77e904ab023c38e05](https://github.com/tarun1sisodia/ArenaAI/commit/01ee2dcbdcebc2d659fee0f77e904ab023c38e05)
- **Checked at:** 2026-10-06T05:02:40Z
- **Workflow run:** [37416448571](https://github.com/tarun1sisodia/ArenaAI/actions/runs/37416448571)

## Changed files

- M	backend/src/db/memory.ts
- M	backend/src/db/postgres.ts
- M	backend/src/db/types.ts
- M	backend/src/modules/bookings/booking.service.ts
- M	backend/src/modules/payments/payment.service.ts
- M	backend/tests/unit/promos.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2mupdating all dossier signoffs to approved synchronizes company profile dossier status
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/integration/dossier-manifest-modules.test.ts[2m > [22m[2mDossier Content Modules & Manifest Endpoints[2m > [22m[2madmin check-code handles arbitrary non-UUID text slugs without PostgreSQL error
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

 [32m✓[39m tests/integration/dossier-manifest-modules.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 360[2mms[22m[39m
 [32m✓[39m tests/integration/booking-payment.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 304[2mms[22m[39m
 [32m✓[39m tests/integration/customer-booking-auth.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 385[2mms[22m[39m
 [32m✓[39m tests/unit/device-registration-auth.test.ts [2m([22m[2m9 tests[22m[2m)[22m[33m 381[2mms[22m[39m
 [32m✓[39m tests/integration/booking-flow-f3.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 350[2mms[22m[39m
 [32m✓[39m tests/contract/routes.test.ts [2m([22m[2m8 tests[22m[2m)[22m[33m 364[2mms[22m[39m
 [32m✓[39m tests/integration/booking-payment-lifecycle.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 275[2mms[22m[39m
 [32m✓[39m tests/unit/db/concurrency.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m tests/integration/booking-canonical-selection.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 232[2mms[22m[39m
 [32m✓[39m tests/unit/payment-provider-production.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m tests/unit/fare-db-sync.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 46[2mms[22m[39m
 [32m✓[39m tests/integration/booking-cancellation-refund.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 253[2mms[22m[39m
 [32m✓[39m tests/unit/location-proxy.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 211[2mms[22m[39m
 [32m✓[39m tests/unit/catalogue.parity.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 213[2mms[22m[39m
[90mstderr[2m | tests/unit/media-visibility.test.ts[2m > [22m[2mSEC-004: Public Media Visibility Enforcement[2m > [22m[2mrejects anonymous requests for draft catalog item media
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/unit/media-visibility.test.ts[2m > [22m[2mSEC-004: Public Media Visibility Enforcement[2m > [22m[2mrejects anonymous requests for draft catalog item media
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

[90mstderr[2m | tests/unit/media-visibility.test.ts[2m > [22m[2mSEC-004: Public Media Visibility Enforcement[2m > [22m[2mrejects anonymous requests when media itself is archived even if parent is published
[22m[39mWARN: PAGES_DEPLOY_HOOK_URL not set — frontend will not auto-rebuild

 [32m✓[39m tests/unit/media-visibility.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 249[2mms[22m[39m
 [32m✓[39m tests/unit/force-rule.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/fare-rules-versioning.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m tests/unit/privacy-state-hmac.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m tests/unit/network-headers.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 264[2mms[22m[39m
 [32m✓[39m tests/unit/ready-healthcheck.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 223[2mms[22m[39m
 [32m✓[39m tests/contract/rental-enquiries.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 202[2mms[22m[39m
 [32m✓[39m tests/unit/db/phase1-security-migration.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/db/pool-config.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m tests/unit/route-catalog-contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m29 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[32m192 passed[39m[22m[90m (192)[39m
[2m   Start at [22m 05:01:47
[2m   Duration [22m 17.48s[2m (transform 733ms, setup 0ms, collect 6.34s, tests 6.05s, environment 5ms, prepare 1.62s)[22m


> sk-baghel-tour-travels@0.1.0 customer:seo
> npm --prefix react run test:seo


> skb-react@0.1.0 test:seo
> node --experimental-strip-types scripts/test-seo-lifecycle.ts

SEO lifecycle checks passed.

> sk-baghel-tour-travels@0.1.0 build:all
> npm run customer:build && npm run admin:build && npm run backend:build


> sk-baghel-tour-travels@0.1.0 customer:build
> npm --prefix react run build


> skb-react@0.1.0 build
> tsc --noEmit && node --experimental-strip-types scripts/build-manifest.ts && vite build && node --experimental-strip-types scripts/prerender.ts

✅ [Manifest Builder] Emitted public/routes-manifest.json (963 routes) from backend catalog.
✅ [Manifest Builder] Emitted src/data/generated-catalog.json with 963 typed routes.
✅ [Manifest Builder] Snapshotted 0 published catalog items for SSG.
✅ [Manifest Builder] Snapshotted 1 published tour packages from https://skb-baghel-api-staging.onrender.com/api/v1/tour-packages/manifest.
✅ [Manifest Builder] Snapshotted 3 published transfer routes from https://skb-baghel-api-staging.onrender.com/api/v1/transfer-routes/manifest.
✅ [Manifest Builder] Snapshotted 2 published local packages from https://skb-baghel-api-staging.onrender.com/api/v1/local-packages/manifest.
✅ [Manifest Builder] Snapshotted content manifest (5 sections) from https://skb-baghel-api-staging.onrender.com/api/v1/content/manifest.
[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2422 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                   [39m[1m[2m  3.61 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-BJHF_4Kq.css                    [39m[1m[2m360.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mprices-CuO5rt3Z.js                    [39m[1m[2m  0.25 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mfleets-Bm1BgLTI.js                    [39m[1m[2m  0.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mDynamicPackageDetailPage-NZpVAdT5.js  [39m[1m[2m  1.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-icons-C2nIWpPW.js              [39m[1m[2m  3.64 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mbookingIntentStorage-LIKSya_y.js      [39m[1m[2m  4.01 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mEditorialPageTemplate-BytuMYkY.js     [39m[1m[2m  4.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAuthCallbackPage-1fkHZFkt.js          [39m[1m[2m  4.97 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mNotFoundPage-DBB0N7PP.js              [39m[1m[2m  5.32 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMyBookingsPage-aWrzhciO.js            [39m[1m[2m  6.54 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRentalPage-MkPAEfqq.js                [39m[1m[2m  6.72 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPage-UtbdrMCN.js               [39m[1m[2m 10.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPaymentResumePage-CVggVYTs.js         [39m[1m[2m 10.29 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mSeoLandingPage-DiqXtJVj.js            [39m[1m[2m 11.04 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mTermsPage-Di9V5tu5.js                 [39m[1m[2m 11.44 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mContactPage-CJ2x3FhR.js               [39m[1m[2m 11.63 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFaqPage-WlFq1ZuO.js                   [39m[1m[2m 12.04 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mMarketingPage-lkxCI9db.js             [39m[1m[2m 14.20 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mServicesPage-UD5my7sz.js              [39m[1m[2m 15.05 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRouteDetailPage-BWOyvvwh.js           [39m[1m[2m 26.61 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mVehicleDetailPage-C-Hz0riO.js         [39m[1m[2m 28.69 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mFleetPage-BPGQg8Rt.js                 [39m[1m[2m 29.59 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPagination-CpGKpyMA.js                [39m[1m[2m 31.94 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mAboutPage-BMZmNIGW.js                 [39m[1m[2m 35.60 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mRoutesPage-B0eRRLND.js                [39m[1m[2m 40.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackageDetailPage-BZYJrjxy.js         [39m[1m[2m 46.45 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mPackagesPage-CrLQF7JG.js              [39m[1m[2m 59.38 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mBookingPage-C6iCvS_o.js               [39m[1m[2m 64.10 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-DcPaX2wx.js             [39m[1m[2m125.58 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-dzjnOsT9.js              [39m[1m[2m192.35 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mdata-catalogue-BSSfzDDn.js            [39m[1m[2m348.56 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[36mindex-S1GAIEE3.js                     [39m[1m[2m413.59 kB[22m[1m[22m
[32m✓ built in 4.00s[39m
🚀 Starting Static HTML Pre-Renderer (SSG)...
✅ Generated sitemap.xml (55 URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) and robots.txt pointing to https://agraskbagheltourandtravels.com/sitemap.xml
✅ SSG Pre-Rendering Complete: 63 pages rendered + 14 redirects written (3.83 MB total) in 2.56s.

> sk-baghel-tour-travels@0.1.0 admin:build
> npm --prefix admin run build


> skb-admin@0.1.0 build
> tsc --noEmit && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 2379 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                             [39m[1m[2m  1.63 kB[22m[1m[22m[2m │ gzip:  0.63 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-DbjZZua7.css              [39m[1m[2m 53.74 kB[22m[1m[22m[2m │ gzip: 10.10 kB[22m
[2mdist/[22m[2massets/[22m[36mTable-CgchIsbK.js               [39m[1m[2m  0.87 kB[22m[1m[22m[2m │ gzip:  0.37 kB[22m
[2mdist/[22m[2massets/[22m[36mStatusBadge-CcZJB2kc.js         [39m[1m[2m  1.32 kB[22m[1m[22m[2m │ gzip:  0.54 kB[22m
[2mdist/[22m[2massets/[22m[36mDialog-DaQ2WSP-.js              [39m[1m[2m  1.92 kB[22m[1m[22m[2m │ gzip:  0.95 kB[22m
[2mdist/[22m[2massets/[22m[36mAuditPage-D3C3y306.js           [39m[1m[2m  4.59 kB[22m[1m[22m[2m │ gzip:  1.86 kB[22m
[2mdist/[22m[2massets/[22m[36mRentalRequestsPage-CoH_2mYT.js  [39m[1m[2m  6.07 kB[22m[1m[22m[2m │ gzip:  2.20 kB[22m
[2mdist/[22m[2massets/[22m[36mReviewsPage-BBh25jP-.js         [39m[1m[2m  6.19 kB[22m[1m[22m[2m │ gzip:  2.34 kB[22m
[2mdist/[22m[2massets/[22m[36mSignoffPage-Bf2gHoWU.js         [39m[1m[2m  6.47 kB[22m[1m[22m[2m │ gzip:  2.43 kB[22m
[2mdist/[22m[2massets/[22m[36mInquiriesPage-DD8uFqBI.js       [39m[1m[2m  7.06 kB[22m[1m[22m[2m │ gzip:  2.57 kB[22m
[2mdist/[22m[2massets/[22m[36mFinancePage-DOTwjIOP.js         [39m[1m[2m  9.75 kB[22m[1m[22m[2m │ gzip:  3.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPromosPage-C2NU6DNX.js          [39m[1m[2m 11.60 kB[22m[1m[22m[2m │ gzip:  3.36 kB[22m
[2mdist/[22m[2massets/[22m[36mFaresPage-YYp-9Vzb.js           [39m[1m[2m 12.76 kB[22m[1m[22m[2m │ gzip:  4.21 kB[22m
[2mdist/[22m[2massets/[22m[36mLocalTransfersPage-BsZF5i5k.js  [39m[1m[2m 15.29 kB[22m[1m[22m[2m │ gzip:  3.92 kB[22m
[2mdist/[22m[2massets/[22m[36mPoliciesPage-B3HSfcik.js        [39m[1m[2m 19.02 kB[22m[1m[22m[2m │ gzip:  4.44 kB[22m
[2mdist/[22m[2massets/[22m[36mBookingsPage-BubsIjeP.js        [39m[1m[2m 21.37 kB[22m[1m[22m[2m │ gzip:  6.23 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lucide-BP_qcL7Z.js       [39m[1m[2m 23.29 kB[22m[1m[22m[2m │ gzip:  8.11 kB[22m
[2mdist/[22m[2massets/[22m[36mTourPackagesPage-DJj1vYzA.js    [39m[1m[2m 24.18 kB[22m[1m[22m[2m │ gzip:  7.13 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-router-DZnVbbVH.js       [39m[1m[2m 38.18 kB[22m[1m[22m[2m │ gzip: 13.75 kB[22m
[2mdist/[22m[2massets/[22m[36mCatalogPage-CiZpAjFw.js         [39m[1m[2m 39.31 kB[22m[1m[22m[2m │ gzip: 11.06 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-motion-ETqTANL-.js       [39m[1m[2m133.36 kB[22m[1m[22m[2m │ gzip: 44.17 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-YWPnaJPF.js        [39m[1m[2m221.70 kB[22m[1m[22m[2m │ gzip: 68.96 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-yfotEGLV.js               [39m[1m[2m329.00 kB[22m[1m[22m[2m │ gzip: 90.13 kB[22m
[32m✓ built in 3.97s[39m

> sk-baghel-tour-travels@0.1.0 backend:build
> npm --prefix backend run build


> @sk-baghel/backend@0.1.0 build
> tsc -p tsconfig.build.json

```
