# Agentic Accessibility, Discoverability, Security.txt, and Payment Test Guide

Updated: 2026-10-01

## What the live audit found

The supplied PageSpeed Insights run for `https://agraskbagheltourandtravels.com/` reported the same agentic findings on mobile and desktop:

- **Agentic Browsing: 1/3.** Cumulative Layout Shift passed. The two failed checks were Agent Accessibility and Agent Discoverability.
- **Agent Accessibility — accessibility tree is not well-formed.** Lighthouse identified two concrete problems: a review-star `<div>` used `aria-label` without a valid role, and the homepage inquiry form's travel-date `<input type="date">` did not have an associated programmatic label.
- **Agent Discoverability — `llms.txt` does not follow recommendations.** The file had an H1 and bare URL lines, but Lighthouse did not recognize those lines as links. The file now uses Markdown links to the official site, routes, packages, fleet, FAQ, sitemap, robots policy, and route manifest.
- **Accessibility score: 81.** The same report also flagged low contrast and small touch targets. These are separate from the two agentic failures and should be handled in a later visual-accessibility pass.
- **Desktop performance score: 57.** The report recorded FCP 4.0 seconds, LCP 5.7 seconds, TBT 0 ms, and CLS 0. Mobile performance was 55 in the supplied report. These are not payment failures, but the large JavaScript and third-party work should be reviewed after the agentic fixes.
- **SEO score: 100** and **Best Practices: 96** in the supplied reports.

Chrome describes this category as experimental. It reports a pass ratio and deterministic audit results rather than a normal weighted 0–100 score. The checks focus on valid names and labels, ARIA/tree integrity, visibility, layout stability, and an `llms.txt` summary. [1]

## Changes made in the repository

The following fixes are included in this branch:

1. `react/src/components/home/ReviewsMarquee.tsx` now gives the star group `role="img"` before using its accessible name. The individual star icons remain `aria-hidden="true"`.
2. `react/src/pages/HomePage.tsx` now gives the homepage inquiry fields stable IDs and matching `htmlFor` labels: name, phone/WhatsApp, travel date, and itinerary notes.
3. `react/public/llms.txt` now uses recognized Markdown links and explicitly tells agents not to invent route availability or prices.
4. `react/public/.well-known/security.txt` has been added with the business security contact, expiry, canonical URL, preferred languages, and disclosure policy URL.

After deployment, verify these exact URLs return `200` and the expected content:

- `https://agraskbagheltourandtravels.com/llms.txt`
- `https://agraskbagheltourandtravels.com/.well-known/security.txt`
- `https://agraskbagheltourandtravels.com/manus-routes.json`

The `security.txt` file is a static public disclosure document. Cloudflare does not replace the file; it must be deployed at the origin and allowed through any Cloudflare rules. If Cloudflare Pages or another static host is used, the `public/.well-known/security.txt` path must be preserved in the published artifact.

## Remaining accessibility work

The PageSpeed report also identified issues outside the two agentic failures:

- Increase contrast for terracotta/gold labels, price badges, booking buttons, and review labels until the contrast audit passes.
- Increase the hit area and spacing for phone, WhatsApp, fleet, and route links to at least the applicable WCAG target-size recommendation.
- Re-run the desktop skip-link audit. The shared component points to `#main-content`, but every route must expose exactly one focusable `main#main-content` target. Do not create duplicate IDs when a page already has one.
- Add automated axe/Lighthouse checks to CI for labels, prohibited ARIA, contrast, skip links, and target size.

Chrome's guidance is to prefer semantic HTML, correct labels, and a complete accessibility tree. [2]

## Verification procedure after deployment

1. Open the mobile and desktop PageSpeed reports again with a fresh analysis.
2. Confirm Agent Accessibility no longer lists the review-star or travel-date failures.
3. Confirm Agent Discoverability recognizes the Markdown links in `llms.txt`.
4. Fetch `/.well-known/security.txt` directly. It must not be routed to the SPA fallback HTML.
5. Use Chrome 150 or later if testing the experimental Agentic Browsing category locally. The category can vary with dynamic registration timing, but the static accessibility and `llms.txt` checks should be repeatable. [1]
6. Inspect the accessibility tree in Chrome DevTools and keyboard-tab through the homepage inquiry form, booking form, navigation, phone, WhatsApp, and route links.

## Razorpay payment test: no real money

Do **not** test with live keys or a real card. The correct approach is to use a separate Razorpay **Test Mode** account/key pair and a test webhook secret. Razorpay states that test cards work only with test API keys and that no real money is deducted in test mode. [3]

### Current application payment contract

The browser does not send the amount. The backend calculates the fare, creates a booking draft, creates the Razorpay order from the persisted advance amount, and returns the provider order ID. The browser callback is not treated as proof of payment. The frontend polls the backend, and the booking becomes confirmed only after the verified provider event reaches the webhook reconciliation path.

This means a test must verify both sides:

- Razorpay Checkout opens with the expected server-created order.
- The provider webhook is delivered to the production-like test backend.
- The backend marks the payment captured and booking `paid_confirmed` only after signature and amount/order checks pass.
- The customer sees the confirmation only after the status endpoint reports the confirmed state.

### Recommended safe test plan

1. Create or use a disposable Razorpay Test Mode account. Do not replace production credentials.
2. Configure the test backend environment with `rzp_test_...` credentials, the matching test key secret, and a separate test webhook secret. Never put the secret in React environment variables or the public bundle.
3. Point the test webhook to a test backend URL, not the live production webhook. Confirm the webhook signature secret matches the backend environment.
4. Use a test booking whose server-calculated advance is the smallest amount allowed by the application. Do not change the frontend amount. A ₹1 checkout is only valid if the backend's fare/advance rules produce at least ₹1; otherwise create a dedicated non-production test fixture or test endpoint on the test backend, never a live pricing override.
5. Complete the booking in test mode and select Card. Razorpay's documented Indian success card is `4100 2800 0000 1007`; use any random CVV and future expiry. The mock bank page uses a random 4–10 digit OTP for success and fewer than 4 digits for failure. [3]
6. Record the ticket ID, payment ID, provider order ID, amount in paise, webhook delivery result, final payment status, and final booking status. Do not record card numbers or secrets.
7. Repeat once with a failure test card or failed mock-bank action. Confirm the booking remains unconfirmed and the payment is recorded as failed.
8. Repeat the success callback or webhook delivery to confirm idempotency. There must be no duplicate payment or duplicate confirmation.
9. In the admin panel, confirm the payment ledger and booking state. Only after all checks pass should production live keys be considered.

### What not to do

- Do not enable test keys on the public production site as a way to collect real customer bookings.
- Do not use a client-side amount override to force ₹1.
- Do not treat a successful browser callback or redirect as proof of payment.
- Do not test webhooks by manually marking a production booking paid.
- Do not run refund or payment-write tests against production.

### Current readiness conclusion

The repository has real Razorpay order creation, checkout, status polling, webhook verification, amount checks, and payment lifecycle tests. That proves the implementation has test coverage, not that the deployed environment is configured correctly. A live end-to-end test still requires checking the deployed backend's environment, webhook delivery, database ledger, and Razorpay test-mode dashboard. It should be performed only against a test environment with test keys.

## References

[1]: https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring "Lighthouse agentic browsing scoring"
[2]: https://developer.chrome.com/docs/lighthouse/agentic-browsing/accessibility-for-agents "Accessibility for agents"
[3]: https://razorpay.com/docs/payments/payments/test-card-details/ "Razorpay test card details"
[4]: https://pagespeed.web.dev/analysis/https-agraskbagheltourandtravels-com/kfymt05mw7?form_factor=mobile "PageSpeed Insights mobile report"
[5]: https://pagespeed.web.dev/analysis/https-agraskbagheltourandtravels-com/kfymt05mw7?form_factor=desktop "PageSpeed Insights desktop report"
