# SK Baghel Tour & Travels — Product Requirements Document

**Status:** Canonical product requirements  
**Repository:** `tarun1sisodia/ArenaAI`  
**Applications:** `admin/`, `backend/`, `react/`  
**Last reviewed:** 2026-10-09

> This is the product contract. It defines **what** the system must do. Technical implementation belongs in `Architecture.md`; engineering boundaries belong in `Rules.md`; delivery order belongs in `Phases.md`; visual decisions belong in `Design.md`.

## 1. Product purpose

SK Baghel Tour & Travels is an Agra-based transportation and tour-booking platform. It must let:

1. Customers discover routes, tour packages, local tours, transfer routes, fleet, and monuments.
2. Customers see clear, current commercial information and begin a booking.
3. Operators manage business content, pricing, bookings, reviews, inquiries, and publication from Admin.
4. The Backend remain the authority for business state, pricing, authorization, booking, and payment.
5. The Customer site receive a verified public projection that is fast, SEO-friendly, and safe to cache.

The primary business loop is:

```text
Customer discovers a service
  -> reads the published page
  -> selects a product and fleet
  -> starts the booking flow
  -> Backend creates/validates the booking
  -> payment is handled by the payment workflow
  -> customer receives confirmation
```

The operational loop is:

```text
Admin creates/edits content
  -> Backend validates and persists it
  -> Admin explicitly publishes it
  -> a verified public release is produced
  -> Customer site is rebuilt or revalidated
  -> the published page reflects the exact release
```

## 2. Product principles

- **Database is the business-state authority.**
- **Backend is the pricing and transaction authority.**
- **Customer site is a published presentation, not a second business-rule engine.**
- **Admin never talks directly to the database.**
- **Published content is explicit; draft content is never public.**
- **Every feature is developed and tested end to end before the next feature begins.**
- **A green unit test or build is not feature completion. Staging acceptance by the user is required.**
- **No hidden fallback may make an incomplete feature look successful.**

## 3. Target users

| User | Main need | Product success |
|---|---|---|
| Domestic traveller | Fast, transparent Agra taxi/tour information | Finds the correct page and contacts/books quickly |
| Family/group traveller | Correct vehicle capacity, itinerary, and price | Selects the right fleet and sees inclusions clearly |
| Airport/railway customer | Reliable transfer details and direct action | Finds transfer route and submits booking intent |
| International traveller | Trust, readable English content, clear policies | Understands service and completes inquiry/booking |
| Admin content editor | Maintain routes, packages, tours, monuments | Saves valid data without developer intervention |
| Pricing/operations operator | Maintain fares and booking operations | Sees authoritative values and audit history |
| Super administrator | Control access and release decisions | Can authorize sensitive actions and trace changes |

## 4. In-scope applications

### 4.1 Admin application

Admin manages through Backend APIs only:

- Authentication, session, and role permissions.
- Fleet master and fleet availability.
- Fare rules and fare previews.
- Routes.
- Tour packages.
- Local tours.
- Transfer routes/tours.
- Monuments and public content.
- Images and galleries.
- Reviews and inquiries.
- Cancellation policies, promotions, and company profile.
- Bookings, finance, refunds, and audit history.
- Draft, publish, archive, and release status.

### 4.2 Backend application

Backend owns:

- Authentication and authorization decisions.
- API validation and response contracts.
- Domain rules and database transactions.
- Fleet, pricing, content, booking, payment, review, inquiry, and publishing modules.
- Server-side fare calculation and quote generation.
- Immutable booking/fare/payment snapshots.
- Audit trail, idempotency, release versioning, and deployment status.

### 4.3 Customer application

Customer site owns:

- Bilingual SEO pages and navigation.
- Published content discovery and templates.
- Accessible display of prices and inclusions supplied by the public release.
- Call, WhatsApp, inquiry, and Book Now entry points.
- Booking form presentation and submission of booking intent.
- Customer authentication and booking history where enabled.

Customer site does **not** own final price calculation, payment state, publication state, or authorization.

## 5. Product catalogue

The four first-class commercial content families are:

1. **Routes** — one-way, round-trip, and local-tour route records.
2. **Tour Packages** — fixed-duration itineraries with fleet prices and content.
3. **Local Tours** — hourly/local sightseeing products with included kilometres and extra rates.
4. **Transfer Routes** — station/airport/corridor transfer products.

The next content family is **Monuments**. A monument provides content and may link to transport; it must not create an independent transportation pricing engine.

Every publishable family must have:

- Internal UUID.
- Stable public code/slug.
- Draft/published/archived status.
- Active flag with documented meaning.
- Created/updated/published timestamps.
- Revision/source version.
- Explicit public DTO.
- One template and one URL namespace.
- Admin create, read, update, publish, archive behavior.
- Contract, integration, and staging end-to-end tests.

## 6. Core customer requirements

### Discovery and SEO

- Public pages must be renderable without depending on client JavaScript for essential content.
- Every published entity has one canonical URL.
- Search results and detail pages use the same public identifier.
- Sitemap contains only intended published pages.
- Draft and archived items are absent from public discovery.
- English and Hindi pages maintain commercial value parity; copy may be translated.

### Commercial presentation

- Displayed fleet prices and charges come from the verified public release.
- Currency is INR unless a deliberately documented display conversion is used.
- Inclusions/exclusions, tolls, permits, driver/night charges, and 300 km/day rules are explicit.
- A missing required price is an error, not an invented fallback.

### Booking

- Booking remains Backend-authoritative even when the page is statically generated.
- Customer sends entity ID/code, selected fleet, requested date/details, and public source version.
- Backend re-reads current state and calculates/validates the final price.
- Archived, inactive, unavailable, or stale selections are rejected or refreshed.
- Client-submitted totals are never trusted.
- Payment confirmation comes from verified provider webhook state, not a browser callback.

## 7. Admin requirements

Every content feature must support this state machine:

```text
not present -> draft -> published -> archived
                    \-> deleted (draft only, where allowed)
```

Admin must show separate states for:

- database save;
- publication commit;
- release queued;
- release building;
- release deployed;
- release failed/stale.

Admin must never display “published on customer site” merely because a database update or deploy-hook request returned successfully.

## 8. Non-functional requirements

- Backend request IDs and correlation IDs are traceable through Admin, release, and build logs.
- Public release is schema-validated, duplicate-checked, and versioned.
- Production build fails when required public data is unavailable or inconsistent.
- API errors use one documented envelope with field-level validation errors.
- Auth and role checks fail closed.
- Payment, booking, and admin mutations are idempotent where retries are possible.
- Accessibility, responsive design, page performance, canonical links, and structured data are CI gates.
- No secrets are bundled into Admin or Customer builds.

## 9. Definition of product completion

A feature is complete only when:

1. Its requirements are documented.
2. Its domain model and API contract are documented.
3. Admin form fields map to the contract.
4. Backend persists and returns the intended values.
5. Customer release contains the item exactly once.
6. The correct customer URL and HTML are generated.
7. Search, detail, and booking handoff use the same identifier.
8. Duplicate, overwrite, bypass, stale-data, error, and retry tests pass.
9. The user manually tests the complete feature on staging and confirms it.
10. The next feature does not begin until the staging gate is signed off.
