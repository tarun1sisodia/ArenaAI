# ArenaAI live Supabase schema inventory

Generated from the live Supabase PostgreSQL inspection on 2026-10-06 07:49:38 (IST).
Total applied migrations: **34**.

## Table summary

| Table | Rows | RLS | Primary key |
|---|---:|:---:|---|
| `public.admin_audit_logs` | 8 | enabled | `id` |
| `public.bookings` | 9 | enabled | `id` |
| `public.cancellation_policies` | 9 | enabled | `id` |
| `public.catalog_item_media` | 0 | enabled | `id` |
| `public.catalog_items` | 0 | enabled | `id` |
| `public.company_profile` | 1 | enabled | `id` |
| `public.customer_booking_intents` | 13 | enabled | `id` |
| `public.device_registrations` | 0 | enabled | `id` |
| `public.dossier_signoffs` | 10 | enabled | `id` |
| `public.fare_rules` | 14 | enabled | `id` |
| `public.inquiries` | 0 | enabled | `id` |
| `public.local_sightseeing_packages` | 6 | enabled | `id` |
| `public.location_cache` | 40 | enabled | `cache_key` |
| `public.monuments` | 10 | enabled | `id` |
| `public.notification_jobs` | 12 | enabled | `id` |
| `public.package_vehicle_upgrades` | 4 | enabled | `id` |
| `public.payments` | 12 | enabled | `id` |
| `public.pet_taxi_policy` | 1 | enabled | `id` |
| `public.profiles` | 2 | enabled | `id` |
| `public.promo_codes` | 2 | enabled | `id` |
| `public.raw_webhooks` | 3 | enabled | `id` |
| `public.refunds` | 0 | enabled | `id` |
| `public.rental_enquiries` | 1 | enabled | `id` |
| `public.reviews` | 0 | enabled | `id` |
| `public.route_catalog` | 13 | enabled | `id` |
| `public.schema_migrations` | 34 | enabled | `id` |
| `public.tour_packages` | 13 | enabled | `id` |
| `public.transfer_routes` | 8 | enabled | `id` |

## Columns and types

### `public.admin_audit_logs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `actor_id` | `uuid` | no | `—` | — |
| `actor_role` | `user_role_enum` | no | `—` | enum: customer, content_editor, review_moderator, dispatcher, finance_operator, super_admin |
| `resource_type` | `text` | no | `—` | — |
| `resource_id` | `text` | no | `—` | — |
| `action` | `text` | no | `—` | — |
| `before_state` | `jsonb` | yes | `—` | — |
| `after_state` | `jsonb` | yes | `—` | — |
| `reason` | `text` | yes | `—` | — |
| `request_id` | `text` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

### `public.bookings`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `ticket_id` | `varchar(30)` | no | `—` | — |
| `user_id` | `uuid` | yes | `—` | — |
| `guest_access_token` | `varchar(64)` | no | `—` | — |
| `trip_type` | `trip_type_enum` | no | `—` | enum: one-way, round-trip, local-tour, airport-transfer |
| `vehicle_tier` | `vehicle_tier_enum` | no | `—` | enum: sedan, ertiga, innova-crysta, tempo-traveller, urbania |
| `origin_name` | `text` | yes | `—` | — |
| `destination_name` | `text` | yes | `—` | — |
| `pickup_address` | `text` | no | `—` | — |
| `drop_address` | `text` | yes | `—` | — |
| `pickup_datetime` | `timestamptz` | no | `—` | — |
| `return_datetime` | `timestamptz` | yes | `—` | — |
| `flight_train_number` | `varchar(50)` | yes | `—` | — |
| `distance_km` | `numeric` | no | `—` | (distance_km > (0)::numeric) |
| `customer_name` | `text` | no | `—` | — |
| `customer_phone` | `varchar(20)` | no | `—` | — |
| `customer_email` | `varchar(255)` | yes | `—` | — |
| `base_fare` | `numeric` | no | `—` | (base_fare >= (0)::numeric) |
| `night_allowance` | `numeric` | no | `0.00` | (night_allowance >= (0)::numeric) |
| `driver_allowance` | `numeric` | no | `0.00` | (driver_allowance >= (0)::numeric) |
| `discount_amount` | `numeric` | no | `0.00` | (discount_amount >= (0)::numeric) |
| `promo_code` | `varchar(30)` | yes | `—` | — |
| `total_fare` | `numeric` | no | `—` | (total_fare > (0)::numeric) |
| `advance_amount` | `numeric` | no | `—` | ((advance_amount >= (1)::numeric) AND (advance_amount <= total_fare)) |
| `balance_amount` | `numeric` | no | `—` | (balance_amount >= (0)::numeric) |
| `fare_rules_version` | `varchar(20)` | no | `'v1'::character varying` | — |
| `fare_snapshot` | `jsonb` | no | `'{}'::jsonb` | — |
| `status` | `booking_status_enum` | no | `'pending_payment'::booking_status_enum` | enum: draft, pending_payment, paid_confirmed, driver_assigned, in_transit, completed, cancelled, refunded |
| `version` | `int4` | no | `1` | — |
| `special_notes` | `text` | yes | `—` | — |
| `package_id` | `varchar(80)` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `booking_selection` | `jsonb` | yes | `—` | — |
| `selected_catalog_item_id` | `text` | yes | `—` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_selected_catalog_item_id_fkey` | `public.bookings` (`selected_catalog_item_id`) | `public.catalog_items` (`id`) | Outgoing (Foreign Key) |
| `bookings_user_id_fkey` | `public.bookings` (`user_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `customer_booking_intents_resulting_booking_id_fkey` | `public.customer_booking_intents` (`resulting_booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `device_registrations_booking_id_fkey` | `public.device_registrations` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `notification_jobs_booking_id_fkey` | `public.notification_jobs` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `payments_booking_id_fkey` | `public.payments` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `refunds_booking_id_fkey` | `public.refunds` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |
| `reviews_booking_id_fkey` | `public.reviews` (`booking_id`) | `public.bookings` (`id`) | Incoming (Referenced by) |

### `public.cancellation_policies`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `policy_type` | `text` | no | `—` | (policy_type = ANY (ARRAY['cab'::text, 'tour_package'::text])) |
| `notice_period_text` | `text` | no | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `fee_retained_percent` | `numeric` | no | `—` | ((fee_retained_percent >= (0)::numeric) AND (fee_retained_percent <= (100)::numeric)) |
| `refund_percent` | `numeric` | no | `—` | ((refund_percent >= (0)::numeric) AND (refund_percent <= (100)::numeric)) |
| `rule_text` | `text` | no | `—` | — |
| `refund_timeline_note` | `text` | no | `'5–7 business days to original bank/UPI'::text` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.catalog_item_media`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `catalog_item_id` | `text` | no | `—` | — |
| `storage_path` | `text` | no | `—` | — |
| `media_type` | `varchar(10)` | no | `—` | — |
| `alt_text` | `text` | no | `—` | — |
| `caption` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `status` | `content_status_enum` | no | `'draft'::content_status_enum` | enum: draft, published, archived |
| `source_type` | `varchar(30)` | no | `'admin_upload'::character varying` | — |
| `copyright_owner` | `text` | yes | `—` | — |
| `created_by` | `uuid` | yes | `—` | — |
| `approved_by` | `uuid` | yes | `—` | — |
| `published_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `mime_type` | `varchar(60)` | yes | `—` | — |
| `content_base64` | `text` | yes | `—` | — |
| `size_bytes` | `int4` | yes | `—` | ((size_bytes IS NULL) OR (size_bytes >= 0)) |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `catalog_item_media_catalog_item_id_fkey` | `public.catalog_item_media` (`catalog_item_id`) | `public.catalog_items` (`id`) | Outgoing (Foreign Key) |

### `public.catalog_items`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `text` | no | `—` | — |
| `type` | `text` | no | `—` | (type = ANY (ARRAY['ride'::text, 'tour'::text, 'package'::text, 'route'::text, 'vehicle'::text, 'place'::text])) |
| `slug` | `varchar(150)` | no | `—` | — |
| `title` | `text` | no | `—` | — |
| `short_description` | `text` | no | `—` | — |
| `description` | `text` | no | `—` | — |
| `status` | `content_status_enum` | no | `'draft'::content_status_enum` | enum: draft, published, archived |
| `duration_text` | `text` | no | `—` | — |
| `route_summary` | `text` | no | `—` | — |
| `starting_price_inr` | `numeric` | no | `—` | (starting_price_inr > (0)::numeric) |
| `version` | `int4` | no | `1` | — |
| `created_by` | `uuid` | yes | `—` | — |
| `updated_by` | `uuid` | yes | `—` | — |
| `published_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `distance_km` | `numeric` | yes | `—` | ((distance_km IS NULL) OR (distance_km >= (0)::numeric)) |
| `availability` | `varchar(20)` | no | `'available'::character varying` | — |
| `seats_left` | `int4` | yes | `—` | ((seats_left IS NULL) OR (seats_left >= 0)) |
| `stops` | `_text` | no | `'{}'::text[]` | — |
| `trip_type` | `varchar(30)` | yes | `—` | ((trip_type IS NULL) OR ((trip_type)::text = ANY ((ARRAY['one-way'::character varying, 'round-trip'::character varying, 'local-tour'::character varying, 'airport-transfer'::character varying])::text[]))) |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_selected_catalog_item_id_fkey` | `public.bookings` (`selected_catalog_item_id`) | `public.catalog_items` (`id`) | Incoming (Referenced by) |
| `catalog_item_media_catalog_item_id_fkey` | `public.catalog_item_media` (`catalog_item_id`) | `public.catalog_items` (`id`) | Incoming (Referenced by) |
| `reviews_catalog_item_id_fkey` | `public.reviews` (`catalog_item_id`) | `public.catalog_items` (`id`) | Incoming (Referenced by) |

### `public.company_profile`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `brand_name` | `text` | no | `'SK Baghel Tour & Travels'::text` | — |
| `office_address` | `text` | no | `'Taj Ganj, Agra, Uttar Pradesh 282001'::text` | — |
| `primary_phone` | `text` | no | `'+91 97628 17598'::text` | — |
| `whatsapp_number` | `text` | no | `'+91 97628 17598'::text` | — |
| `email` | `text` | no | `'[TBD — confirm with client]'::text` | — |
| `gstin` | `text` | no | `'[TBD — confirm with client]'::text` | — |
| `operating_hours` | `text` | no | `'Bookings Open 24×7, 365 Days'::text` | — |
| `maps_location` | `text` | no | `'https://maps.google.com/?q=Agra'::text` | — |
| `dossier_version` | `text` | no | `'1.0'::text` | — |
| `dossier_status` | `text` | no | `'pending_review'::text` | (dossier_status = ANY (ARRAY['pending_review'::text, 'signed_off'::text, 'modifications_needed'::text])) |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.customer_booking_intents`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `idempotency_key` | `uuid` | no | `—` | — |
| `resume_secret_hash` | `bpchar` | no | `—` | — |
| `payload` | `jsonb` | no | `—` | — |
| `quote` | `jsonb` | no | `—` | — |
| `quote_total_fare` | `numeric` | no | `—` | — |
| `quote_advance_amount` | `numeric` | no | `—` | — |
| `quote_balance_amount` | `numeric` | no | `—` | — |
| `fare_reconfirmation_pending` | `bool` | no | `false` | — |
| `expires_at` | `timestamptz` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `consumed_at` | `timestamptz` | yes | `—` | — |
| `claimed_user_id` | `uuid` | yes | `—` | — |
| `resulting_booking_id` | `uuid` | yes | `—` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `customer_booking_intents_claimed_user_id_fkey` | `public.customer_booking_intents` (`claimed_user_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |
| `customer_booking_intents_resulting_booking_id_fkey` | `public.customer_booking_intents` (`resulting_booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |

### `public.device_registrations`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `user_id` | `uuid` | yes | `—` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `device_id` | `varchar(100)` | no | `—` | — |
| `platform` | `varchar(20)` | no | `—` | — |
| `fcm_token` | `text` | no | `—` | — |
| `is_active` | `bool` | no | `true` | — |
| `last_seen_at` | `timestamptz` | no | `now()` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `device_registrations_booking_id_fkey` | `public.device_registrations` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `device_registrations_user_id_fkey` | `public.device_registrations` (`user_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |

### `public.dossier_signoffs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `section_key` | `text` | no | `—` | (section_key ~ '^[a-z0-9_-]{2,80}$'::text) |
| `section_title` | `text` | no | `—` | — |
| `status` | `text` | no | `'pending'::text` | (status = ANY (ARRAY['pending'::text, 'approved'::text, 'modification_requested'::text])) |
| `client_notes` | `text` | yes | `—` | — |
| `approved_by` | `uuid` | yes | `—` | — |
| `approved_at` | `timestamptz` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.fare_rules`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `version` | `varchar(20)` | no | `—` | — |
| `config` | `jsonb` | no | `—` | — |
| `effective_from` | `timestamptz` | no | `—` | — |
| `effective_to` | `timestamptz` | yes | `—` | — |
| `is_active` | `bool` | no | `false` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

### `public.inquiries`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `name` | `text` | no | `—` | — |
| `phone` | `varchar(20)` | no | `—` | — |
| `email` | `varchar(255)` | yes | `—` | — |
| `message` | `text` | no | `—` | — |
| `trip_interest` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `status` | `varchar(30)` | no | `'new'::character varying` | — |
| `notes` | `_text` | no | `'{}'::text[]` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.local_sightseeing_packages`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `package_code` | `text` | no | `—` | (package_code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `duration_hours` | `int4` | no | `—` | — |
| `included_km` | `int4` | no | `—` | — |
| `covers` | `text` | no | `—` | — |
| `parking_note` | `text` | yes | `—` | — |
| `fleet_prices` | `jsonb` | no | `—` | — |
| `use_per_km` | `bool` | no | `false` | — |
| `extra_rates` | `jsonb` | yes | `—` | — |
| `night_charge_inr` | `numeric` | no | `0` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `is_active` | `bool` | no | `true` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.location_cache`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `cache_key` | `text` | no | `—` | — |
| `suggestions` | `jsonb` | no | `—` | — |
| `stored_at` | `timestamptz` | no | `now()` | — |

### `public.monuments`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `name` | `text` | no | `—` | — |
| `visiting_hours` | `text` | no | `—` | — |
| `closed_note` | `text` | no | `'Open all days'::text` | — |
| `historical_context` | `text` | yes | `—` | — |
| `sort_order` | `int4` | no | `0` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.notification_jobs`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `booking_id` | `uuid` | no | `—` | — |
| `channel` | `varchar(20)` | no | `—` | — |
| `template_key` | `text` | no | `—` | — |
| `dedupe_key` | `text` | no | `—` | — |
| `payload` | `jsonb` | no | `'{}'::jsonb` | — |
| `status` | `varchar(20)` | no | `'queued'::character varying` | — |
| `attempt_count` | `int4` | no | `0` | — |
| `provider_message_id` | `text` | yes | `—` | — |
| `last_error` | `text` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `notification_jobs_booking_id_fkey` | `public.notification_jobs` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |

### `public.package_vehicle_upgrades`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `package_id` | `uuid` | yes | `—` | — |
| `tier_code` | `text` | no | `—` | — |
| `passenger_note` | `text` | yes | `—` | — |
| `surcharge_inr` | `numeric` | no | `0` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `package_vehicle_upgrades_package_id_fkey` | `public.package_vehicle_upgrades` (`package_id`) | `public.tour_packages` (`id`) | Outgoing (Foreign Key) |

### `public.payments`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `booking_id` | `uuid` | no | `—` | — |
| `provider` | `payment_provider_enum` | no | `—` | enum: razorpay, paypal, card |
| `provider_order_id` | `varchar(120)` | no | `—` | — |
| `provider_payment_id` | `varchar(120)` | yes | `—` | — |
| `checkout_session_id` | `varchar(120)` | yes | `—` | — |
| `checkout_url` | `text` | yes | `—` | — |
| `public_client_token` | `text` | yes | `—` | — |
| `amount_minor` | `int8` | no | `—` | (amount_minor > 0) |
| `currency` | `varchar(5)` | no | `'INR'::character varying` | — |
| `inr_amount_paise` | `int8` | no | `—` | (inr_amount_paise > 0) |
| `status` | `payment_status_enum` | no | `'pending'::payment_status_enum` | enum: pending, captured, failed, refunded, needs_review |
| `payment_method` | `varchar(50)` | yes | `—` | — |
| `fee_minor` | `int8` | yes | `0` | — |
| `tax_minor` | `int8` | yes | `0` | — |
| `idempotency_key` | `varchar(100)` | no | `—` | — |
| `webhook_event_id` | `varchar(120)` | yes | `—` | — |
| `reconciliation_status` | `varchar(30)` | no | `'pending'::character varying` | — |
| `failure_reason` | `text` | yes | `—` | — |
| `verified_at` | `timestamptz` | yes | `—` | — |
| `expires_at` | `timestamptz` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `payments_booking_id_fkey` | `public.payments` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `refunds_payment_id_fkey` | `public.refunds` (`payment_id`) | `public.payments` (`id`) | Incoming (Referenced by) |

### `public.pet_taxi_policy`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `is_offered` | `bool` | no | `true` | — |
| `seat_protection_note` | `text` | no | `—` | — |
| `breed_restriction_note` | `text` | no | `'No breed or size restrictions'::text` | — |
| `comfort_stop_note` | `text` | no | `—` | — |
| `booking_instruction` | `text` | no | `'Customer must inform during booking'::text` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.profiles`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `full_name` | `text` | no | `—` | — |
| `phone` | `varchar(20)` | no | `—` | — |
| `email` | `varchar(255)` | yes | `—` | — |
| `role` | `user_role_enum` | no | `'customer'::user_role_enum` | enum: customer, content_editor, review_moderator, dispatcher, finance_operator, super_admin |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `bookings_user_id_fkey` | `public.bookings` (`user_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `customer_booking_intents_claimed_user_id_fkey` | `public.customer_booking_intents` (`claimed_user_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `device_registrations_user_id_fkey` | `public.device_registrations` (`user_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |
| `reviews_customer_id_fkey` | `public.reviews` (`customer_id`) | `public.profiles` (`id`) | Incoming (Referenced by) |

### `public.promo_codes`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `code` | `varchar(30)` | no | `—` | — |
| `discount_amount` | `numeric` | no | `—` | (discount_amount >= (0)::numeric) |
| `min_total` | `numeric` | no | `—` | (min_total >= (0)::numeric) |
| `description` | `text` | no | `—` | — |
| `is_active` | `bool` | no | `true` | — |
| `max_redemptions` | `int4` | yes | `—` | — |
| `redemption_count` | `int4` | no | `0` | — |
| `valid_from` | `timestamptz` | yes | `—` | — |
| `valid_to` | `timestamptz` | yes | `—` | — |
| `allow_group_vehicles` | `bool` | no | `false` | — |
| `is_broadcast` | `bool` | no | `false` | — |

### `public.raw_webhooks`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `—` | — |
| `provider` | `text` | no | `—` | — |
| `event_id` | `varchar(160)` | no | `—` | — |
| `event_type` | `text` | no | `—` | — |
| `payload` | `jsonb` | no | `—` | — |
| `payload_hash` | `varchar(64)` | no | `—` | — |
| `processed` | `bool` | no | `false` | — |
| `received_at` | `timestamptz` | no | `now()` | — |

### `public.refunds`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `payment_id` | `uuid` | no | `—` | — |
| `booking_id` | `uuid` | no | `—` | — |
| `provider_refund_id` | `varchar(120)` | yes | `—` | — |
| `amount_minor` | `int8` | no | `—` | (amount_minor > 0) |
| `currency` | `varchar(5)` | no | `'INR'::character varying` | — |
| `reason` | `text` | no | `—` | — |
| `status` | `varchar(30)` | no | `'processed'::character varying` | — |
| `idempotency_key` | `varchar(100)` | no | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `refunds_booking_id_fkey` | `public.refunds` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `refunds_payment_id_fkey` | `public.refunds` (`payment_id`) | `public.payments` (`id`) | Outgoing (Foreign Key) |

### `public.rental_enquiries`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `ref` | `text` | no | `—` | — |
| `name` | `text` | no | `—` | — |
| `phone` | `text` | no | `—` | — |
| `email` | `text` | yes | `—` | — |
| `car_tier` | `text` | no | `—` | (car_tier = ANY (ARRAY['sedan'::text, 'ertiga'::text, 'innova'::text, 'tempo'::text, 'urbania'::text])) |
| `pickup_date` | `date` | no | `—` | — |
| `return_date` | `date` | no | `—` | (return_date >= pickup_date) |
| `pickup_location` | `text` | no | `—` | — |
| `with_driver` | `bool` | no | `false` | — |
| `note` | `text` | yes | `—` | — |
| `status` | `text` | no | `'new'::text` | (status = ANY (ARRAY['new'::text, 'contacted'::text, 'quoted'::text, 'done'::text, 'closed'::text, 'spam'::text])) |
| `notes` | `_text` | no | `'{}'::text[]` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

### `public.reviews`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `booking_id` | `uuid` | yes | `—` | — |
| `catalog_item_id` | `text` | yes | `—` | — |
| `customer_id` | `uuid` | yes | `—` | — |
| `display_name` | `text` | no | `—` | — |
| `rating` | `int4` | no | `—` | ((rating >= 1) AND (rating <= 5)) |
| `review_text` | `text` | no | `—` | — |
| `status` | `review_status_enum` | no | `'pending_review'::review_status_enum` | enum: draft, pending_review, approved, rejected, published, archived |
| `verification_status` | `verification_status_enum` | no | `'unverified'::verification_status_enum` | enum: unverified, booking_verified, social_link_submitted, manually_verified |
| `social_profile_url` | `text` | yes | `—` | — |
| `social_platform` | `varchar(40)` | yes | `—` | — |
| `verification_notes` | `text` | yes | `—` | — |
| `reviewed_by` | `uuid` | yes | `—` | — |
| `reviewed_at` | `timestamptz` | yes | `—` | — |
| `published_at` | `timestamptz` | yes | `—` | — |
| `guest_access_token` | `varchar(64)` | yes | `—` | — |
| `created_at` | `timestamptz` | no | `now()` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `reviews_booking_id_fkey` | `public.reviews` (`booking_id`) | `public.bookings` (`id`) | Outgoing (Foreign Key) |
| `reviews_catalog_item_id_fkey` | `public.reviews` (`catalog_item_id`) | `public.catalog_items` (`id`) | Outgoing (Foreign Key) |
| `reviews_customer_id_fkey` | `public.reviews` (`customer_id`) | `public.profiles` (`id`) | Outgoing (Foreign Key) |

### `public.route_catalog`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `trip_type` | `text` | no | `—` | (trip_type = ANY (ARRAY['one-way'::text, 'round-trip'::text, 'local-tour'::text])) |
| `source_city` | `text` | no | `—` | — |
| `source_detail` | `text` | yes | `—` | — |
| `destination_city` | `text` | yes | `—` | — |
| `slug` | `text` | no | `—` | (slug ~ '^[a-z0-9-]{2,80}$'::text) |
| `distance_km` | `numeric` | yes | `—` | — |
| `duration_text` | `text` | yes | `—` | — |
| `available_fleets` | `_text` | no | `'{sedan,ertiga,innova,tempo,urbania}'::text[]` | — |
| `fares_inr` | `jsonb` | no | `—` | — |
| `driver_charge_inr` | `numeric` | no | `0` | — |
| `night_halt_inr` | `numeric` | no | `0` | — |
| `toll_included` | `bool` | no | `true` | — |
| `toll_amount_inr` | `numeric` | yes | `—` | — |
| `interstate_charges` | `jsonb` | no | `'[]'::jsonb` | — |
| `min_km_per_day` | `int4` | no | `300` | — |
| `stops` | `jsonb` | no | `'[]'::jsonb` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `needs_review` | `bool` | no | `false` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `use_per_km` | `bool` | no | `true` | — |
| `per_km_rate_override` | `numeric` | yes | `—` | — |
| `highway` | `text` | yes | `—` | — |
| `all_inclusive_note` | `text` | yes | `—` | — |

### `public.schema_migrations`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `text` | no | `—` | — |
| `applied_at` | `timestamptz` | no | `now()` | — |
| `checksum` | `text` | yes | `—` | — |

### `public.tour_packages`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `package_code` | `text` | no | `—` | (package_code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `duration_text` | `text` | no | `—` | — |
| `days` | `int4` | no | `1` | — |
| `nights` | `int4` | no | `0` | — |
| `base_tier_code` | `text` | no | `'sedan'::text` | — |
| `starting_price_inr` | `numeric` | no | `—` | (starting_price_inr > (0)::numeric) |
| `fleet_prices` | `jsonb` | no | `—` | — |
| `night_charge_inr` | `numeric` | no | `0` | — |
| `inclusions_highlight` | `text` | yes | `—` | — |
| `inclusions_note` | `text` | yes | `—` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `is_active` | `bool` | no | `true` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |
| `image_url` | `text` | yes | `—` | — |
| `gallery` | `jsonb` | no | `'[]'::jsonb` | — |
| `source` | `text` | no | `'Agra'::text` | — |
| `destination` | `text` | no | `''::text` | — |
| `inclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `exclusions` | `jsonb` | no | `'[]'::jsonb` | — |
| `itinerary` | `jsonb` | no | `'[]'::jsonb` | — |

**Foreign keys & relations:**

| Constraint | Source | Target | Direction |
|---|---|---|---|
| `package_vehicle_upgrades_package_id_fkey` | `public.package_vehicle_upgrades` (`package_id`) | `public.tour_packages` (`id`) | Incoming (Referenced by) |

### `public.transfer_routes`

| Column | PostgreSQL type | Nullable | Default | Check / enum |
|---|---|:---:|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | — |
| `route_code` | `text` | no | `—` | (route_code ~ '^[a-z0-9-]{2,80}$'::text) |
| `name` | `text` | no | `—` | — |
| `distance_text` | `text` | yes | `—` | — |
| `direction_note` | `text` | yes | `—` | — |
| `fleet_prices` | `jsonb` | no | `—` | — |
| `use_per_km` | `bool` | no | `false` | — |
| `night_charge_inr` | `numeric` | no | `0` | — |
| `status` | `text` | no | `'draft'::text` | (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])) |
| `is_active` | `bool` | no | `true` | — |
| `created_at` | `timestamptz` | no | `now()` | — |
| `updated_at` | `timestamptz` | no | `now()` | — |

## Live advisory & RLS State

> **RLS Status Summary:** 28 tables have RLS enabled, and 0 tables currently have RLS disabled.

### Tables with RLS DISABLED:
