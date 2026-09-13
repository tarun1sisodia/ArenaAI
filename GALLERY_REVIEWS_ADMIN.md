# Gallery, Verified Reviews, and Admin Management — Architecture Refinement

**Project:** SK Baghel Tour & Travels  
**Decision status:** Recommended product and backend extension  
**Scope note:** Customer website and admin panel only; no driver app or live tracking.

**Related documents:** [BACKEND_RULES.md](BACKEND_RULES.md), [DATABASE_PLATFORM_DECISION.md](DATABASE_PLATFORM_DECISION.md), [MODELS.md](MODELS.md), [API.md](API.md), [TECHNICAL_REQUIREMENTS_DOCUMENT.md](TECHNICAL_REQUIREMENTS_DOCUMENT.md)

## 1. Recommendation

The requested gallery and verified-review experience is a good addition for trust and conversion. It should be implemented as a **moderated content system**, not as informal text fields inside bookings.

The improved ownership model is:

| Domain | Owner |
|---|---|
| Rides, tours, packages, vehicle tiers, fare rules, promos | Supabase PostgreSQL |
| Review records, moderation status, verification evidence, publication metadata | Supabase PostgreSQL |
| Gallery image and video files | Supabase Storage |
| Image transformations or CDN delivery | Storage/CDN layer in front of Supabase Storage when needed |
| Optional cache and provider-event records | MongoDB Atlas |
| Admin and moderation notifications | Firebase FCM, WhatsApp, or email through the backend |

MongoDB and Firebase should not become content-management databases for this feature. There is no driver app or live tracking feature to support.

## 2. Customer Experience

When a customer opens a ride, tour, or package, the public API should return a curated detail page containing:

- Published title, description, route, duration, vehicle information, and starting fare or fare explanation.
- Published gallery media associated with that product.
- Published reviews associated with that product or route.
- A clear indication that reviews are moderated and verified where applicable.
- Review date, customer display name or initials, trip type, and optional social verification badge.
- A safe call-to-action for booking or inquiry.

The public response must contain only content with `published` status. Draft, pending, rejected, archived, private, or unverified content must never be returned by public routes.

## 3. Content Model

Use a common product model for rides, tours, and packages so the admin panel can manage them consistently.

```text
catalog_items
├── type: ride | tour | package
├── slug
├── title
├── short_description
├── description
├── status: draft | published | archived
├── featured_image_asset_id
├── starting_price_snapshot or pricing_rule_id
├── duration_text
├── route_summary
├── created_by
├── updated_by
├── published_at
└── version
```

Use related tables rather than one large JSON document:

```text
catalog_items
catalog_item_media
catalog_item_itinerary
catalog_item_inclusions
catalog_item_exclusions
catalog_item_faqs
catalog_item_vehicle_options
fare_rules
promo_codes
```

This structure makes CRUD, filtering, ordering, and validation predictable. JSONB may hold flexible presentation metadata, but core searchable and financial fields should remain typed columns.

## 4. Gallery Media Model

Gallery media should be stored in Supabase Storage and described by relational metadata.

| Field | Purpose |
|---|---|
| `id` | Media asset identifier |
| `catalog_item_id` | Ride, tour, or package association |
| `storage_path` | Private storage path or controlled public path |
| `media_type` | Image or video |
| `alt_text` | Accessibility description |
| `caption` | Optional customer-facing caption |
| `sort_order` | Admin-controlled display order |
| `status` | Draft, published, archived |
| `source_type` | Admin upload, customer upload, or supplier submission |
| `copyright_owner` | Rights and permission record |
| `created_by` | Admin or customer identity |
| `approved_by` | Moderator identity |
| `published_at` | Publication timestamp |

### Media rules

- Validate file type, size, dimensions, and malware status before publication.
- Generate resized display variants and thumbnails.
- Store original uploads privately when rights or moderation review is pending.
- Require alt text for published images.
- Keep an audit record when media is published, replaced, reordered, or archived.
- Never expose raw storage credentials or unrestricted bucket access.
- Do not publish customer photos without a recorded consent or rights statement.

## 5. Review and Verification Model

A review should be a first-class record linked to a completed booking when possible.

```text
reviews
├── id
├── booking_id nullable
├── catalog_item_id nullable
├── customer_id nullable
├── display_name
├── rating: 1..5
├── review_text
├── submitted_at
├── status: draft | pending_review | approved | rejected | archived
├── verification_status: unverified | booking_verified | social_link_submitted | manually_verified
├── social_profile_url nullable
├── social_platform nullable
├── verification_notes private
├── reviewed_by nullable
├── reviewed_at nullable
├── published_at nullable
└── moderation_version
```

### Review verification rules

- A completed booking is the strongest verification source. The system should match the review to a booking without exposing the booking's private details publicly.
- A customer may submit a public social-media profile URL as supporting evidence.
- The admin may manually inspect the supplied profile and set `manually_verified` with a private note.
- The website should show a limited label such as **Verified booking** or **Identity link reviewed**, not a claim that the social platform itself endorsed the review.
- Do not scrape social-media accounts, store passwords, or request private access. Store only the submitted public URL and the moderation decision.
- A review without sufficient evidence can still be published as an unverified customer review if business policy allows, but it must not display a verified badge.
- Customers must be able to request correction or removal of their review.
- Review text must be moderated for personal data, abuse, defamatory allegations, spam, and unsafe links.

## 6. Review Moderation Workflow

```text
Customer submits review
        |
        v
pending_review
        |
        +--> Admin requests clarification --> pending_review
        |
        +--> Admin rejects -------------> rejected
        |
        +--> Admin approves ------------> approved
                                               |
                                               v
                                           published
                                               |
                                               +--> archived
```

Approval should require a moderator identity and timestamp. Publishing should be a separate state transition from submission so an admin can approve content without immediately making it visible if the business wants scheduled publishing.

Moderators must be able to see booking linkage, submitted social URL, verification state, moderation notes, and previous decisions. Public users must never see private moderation notes or internal verification evidence beyond the approved public badge.

## 7. Admin CRUD Scope

The admin panel can manage the following resources:

| Resource | CRUD capability | Important safeguard |
|---|---|---|
| Rides | Create, read, update, archive | Published ride edits are versioned |
| Tours | Create, read, update, archive | Itinerary and inclusions are validated |
| Packages | Create, read, update, archive | Price changes do not rewrite existing bookings |
| Vehicles | Create, read, update, deactivate | Active vehicle must have valid capacity and tier |
| Drivers | Create, read, update, deactivate | License and verification fields are restricted |
| Fare rules | Create, read, update, activate | Effective dates and fare version are required |
| Promo codes | Create, read, update, deactivate | Usage limits, dates, and discount bounds are enforced |
| Gallery media | Upload, read, reorder, publish, archive | Rights, moderation, file validation, and alt text |
| Reviews | Read, approve, reject, archive, publish | Moderator identity and verification status |
| Bookings | Read and operational update | Financial history is not freely editable |
| Payments and refunds | Read and authorized actions | Ledger records are append-only and provider-reconciled |
| Site settings | Read and update | Allowlist editable keys and audit every change |
| Admin users | Read and manage roles | Super-admin-only access and audit trail |

CRUD does not mean that every record can be freely overwritten. Completed bookings, captured payments, refund records, audit events, and historical fare snapshots must be append-only or corrected through controlled compensating actions.

## 8. Admin Roles

| Role | Capability |
|---|---|
| Content editor | Manage drafts, catalog content, media metadata, and scheduled content |
| Review moderator | Review, verify, approve, reject, and archive customer reviews |
| Dispatcher | Manage drivers, vehicles, assignments, and trip operations |
| Finance operator | View payments and initiate permitted refund requests |
| Super administrator | Manage roles, sensitive settings, destructive archive actions, and final approvals |

Use role-based permissions in the API. Hiding a button in the admin UI is not an authorization control.

## 9. Admin Audit Log

Every administrative mutation should create an audit record containing:

- `actor_id` and actor role.
- Resource type and resource ID.
- Action such as create, update, publish, approve, reject, archive, assign, or refund.
- Before and after values for non-sensitive fields.
- Request ID and timestamp.
- Reason for sensitive or exceptional actions.

Audit logs should be append-only and visible to authorized administrators. Payment secrets, passwords, full tokens, and private social verification data must be redacted from audit payloads.

## 10. Fare and Content Safety

Admin fare changes must use versioned fare configuration with effective dates. A new fare rule applies only to newly calculated or newly created bookings after activation. A persisted booking fare snapshot must never change because an admin edited a current fare.

Product publication and price activation should be separate controls. An editor may prepare a tour, while an authorized administrator activates the price. Preview endpoints should show draft content only to authorized staff.

## 11. Recommended API Additions

### Public catalog and trust routes

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/catalog/:slug` | Return a published ride, tour, or package with gallery and reviews |
| `GET` | `/catalog/:id/reviews` | Return published reviews with safe verification badges |
| `POST` | `/reviews` | Submit a customer review for moderation |

### Admin catalog routes

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/ops/admin/catalog` | List rides, tours, and packages |
| `POST` | `/ops/admin/catalog` | Create a catalog item |
| `PATCH` | `/ops/admin/catalog/:id` | Update a draft or create a new version |
| `POST` | `/ops/admin/catalog/:id/publish` | Publish approved catalog content |
| `POST` | `/ops/admin/catalog/:id/archive` | Archive a catalog item |
| `POST` | `/ops/admin/catalog/:id/media` | Add gallery metadata for an uploaded asset |
| `PATCH` | `/ops/admin/media/:id` | Reorder, caption, or archive media |
| `GET` | `/ops/admin/reviews` | List reviews by moderation and verification status |
| `POST` | `/ops/admin/reviews/:id/approve` | Approve a review |
| `POST` | `/ops/admin/reviews/:id/reject` | Reject a review with a reason |
| `POST` | `/ops/admin/reviews/:id/publish` | Publish an approved review |
| `POST` | `/ops/admin/reviews/:id/archive` | Remove a published review from public display |
| `GET` | `/ops/admin/audit-logs` | Inspect authorized administrative changes |

## 12. Improved Phase Sequence

1. Build catalog read models and public ride/tour/package pages.
2. Add admin draft CRUD for catalog items and fares.
3. Add Supabase Storage uploads and gallery moderation.
4. Add review submission, booking matching, moderation, and publication.
5. Add admin audit logs and role permissions.
6. Connect published catalog data to fare calculation and booking flows.
7. Add Firebase push notifications for review decisions, booking changes, and driver assignments.
8. Keep MongoDB focused on telemetry and high-volume operational events.

## 13. Acceptance Criteria

The feature is ready when a customer can open a ride, tour, or package and see only published gallery assets and reviews; an admin can create, edit, preview, publish, archive, and reorder content; a customer can submit a review; a moderator can verify booking linkage or review a public social URL; the public page displays only the approved verification label; all changes are authorized and audited; and fare changes cannot rewrite existing bookings.

## References

[1]: BACKEND_RULES.md "Master Backend Operating Rules and Architectural Standard"
[2]: DATABASE_PLATFORM_DECISION.md "Database and Platform Decision — MongoDB, Supabase, and Firebase"
[3]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"
[4]: API.md "Backend API Contract — SK Baghel Tour & Travels"
[5]: TECHNICAL_REQUIREMENTS_DOCUMENT.md "Technical Requirements Document — SK Baghel Tour & Travels"

This refinement follows the ownership and security rules in [1] and [2], and extends the data, API, and requirements boundaries in [3], [4], and [5].
