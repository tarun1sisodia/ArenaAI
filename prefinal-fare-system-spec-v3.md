# SK Baghel Tour & Travels — Fare System Spec v3 (Clean Rebuild, Agent Handoff)

This spec replaces v1 and v2. It is a **clean rebuild**: nothing from the old fare system, old tables, old enums or old backend code is carried over. Test data in the database is wiped.

Scope: pricing categories, vehicles, fare formulas, admin-managed prices and charges, route distance via LocationIQ, database, shared contracts, quote → booking → advance payment, and the full automated test suite.
Out of scope (admin/customer UI work, promotions, refunds, surge pricing, MongoDB, price scheduling, fare history).

---

## 0. Values and decisions still needed from the owner

All numbers below are admin-editable database values; these are only the starting seed. If a required value is blank, quotes fail with `SETTINGS_MISSING` instead of guessing. (The tests in section 9 use their own fixture values, so the agent can build and test before you fill these.)

| # | Item | Needed |
|---|---|---|
| 1 | `advance_percent` | ___ % |
| 2 | `night_charge_amount` per group | sedan ___, suv ___, luxury ___, tempo_traveller ___ |
| 3 | `driver_allowance_per_day` per group | sedan ___, suv ___, luxury ___, tempo_traveller ___ (old code: sedan 300, tempo 500) |
| 4 | `min_km_per_day` | ___ (old code: 300) |
| 5 | `force_round_trip_below_km` | tempo_traveller ___ (you said 300), other groups empty |
| 6 | ₹/km per car model | table in 0.1 |
| 7 | Prices GST-inclusive? | Assumed yes: no tax line |
| 8 | Min km/day on same-day round trips? | Assumed yes: `max(2 × distance, min_km_per_day)` |
| 9 | Same-day Tempo/Urbania trip: driver allowance? | Old code charged ₹500 even for one day. Spec default: allowance only when the trip spans 2+ calendar days (all groups). Confirm or change. |
| 10 | Who may edit prices and charges | Assumed `super_admin` only |
| 11 | Night window end | You gave "at or after 20:00". Spec uses 20:00 inclusive to 06:00 exclusive (the old code's window). Confirm 06:00. |

### 0.1 Car models (the operator must confirm which cars are actually offered)

| Group | Model | Passenger seats | ₹/km |
|---|---|---|---|
| sedan | e.g. Maruti Dzire | 4 | ___ (old default for sedan: 10) |
| suv | e.g. Maruti Ertiga | 6 | ___ (old: 14) |
| suv | e.g. Toyota Innova Crysta | 7 | ___ (old: 18) |
| tempo_traveller | e.g. Force Traveller (seat count) | ___ | ___ (old: 25) |
| tempo_traveller | e.g. Force Urbania | ___ | ___ (old: 34) |
| luxury / others | … | ___ | ___ |

Seats = passengers only, driver excluded (the UI may show "4+1").

---

## 1. Decisions locked

1. Four pricing categories (a fixed list, a `category` text column with a CHECK, not a table):
   | `category` | Unit |
   |---|---|
   | `outstation` | per_km |
   | `local_package` | per_package |
   | `transfer` | per_trip |
   | `tour_package` | per_package |
2. Local packages: "8 hours / 80 km" and "Full Day". Fixed price per car. Extra km/hours are never charged by the system; the policy text is an admin-managed note and the driver collects any extra in cash.
3. Tour packages: fixed per-package price per car. No upgrade surcharges, no day/hour logic.
4. Four vehicle groups: `sedan`, `suv`, `luxury`, `tempo_traveller`. Each group has many car models. **The customer chooses a specific car model.** The group is a category for browsing, and it holds the group-wide settings (driver allowance, night charge, force-round-trip threshold).
5. **Every price belongs to a car model.** Different cars in one group have different ₹/km, different fixed prices and different seat capacity. A car with no price for a product is not bookable for that product. There is no group-level fallback price (so a newly added car can never be sold at another car's price by accident).
6. Only the backend computes fares. Frontends send selections and render the response.
7. Explicit charges (toll, parking, interstate tax, any flat charge) and notes are admin data in `extra_charges`. A charge with an amount is added to the total and shown as its own line. A row with no amount is a message only. Only what the admin adds exists.
8. Outstation ₹/km is global per car model: changing it applies to every route's next quote automatically. No route-level rate overrides.
9. Everything that is a price or charge is admin-editable data: ₹/km and fixed prices (`fare_rules`), explicit charges (`extra_charges`), driver allowance, night charge, force-round-trip threshold (`vehicle_groups`), advance percent and min km/day (`fare_settings`). Code contains only formulas, rounding and the night-window hours.
10. Route distance and duration come from LocationIQ once, at route creation (or when the admin presses calculate again), and are stored. Quotes never call LocationIQ.
11. Quotes are not stored. Booking creation recomputes the fare and compares it with the total the customer saw.
12. Money = whole integer rupees (INR). Payment amount in paise = rupees × 100.
13. Every admin write writes a row to the existing `admin_audit_logs` table.
14. Night = pickup local time (Asia/Kolkata) at or after 20:00 or before 06:00.
15. Pickup must be in the future. The passenger count must not exceed the car's seat capacity.

---

## 2. Database (Supabase PostgreSQL)

Rules for the agent: build exactly this. No extra columns, tables or indexes. All primary keys are `uuid primary key default gen_random_uuid()`. RLS is enabled on every table below with no anon/customer policies; the backend uses the service role, and customers read through the API.

### 2.1 What happens to the existing tables

| Existing table | Action |
|---|---|
| `fare_rules` (old versioned JSON) | **Drop**, replaced by new `fare_rules` |
| `route_catalog` | **Drop**, replaced by `outstation_routes` |
| `local_sightseeing_packages` | **Drop**, replaced by `local_packages` |
| `transfer_routes` | **Drop**, replaced by `transfers` |
| `tour_packages` | **Drop and recreate** (same name, price columns removed) |
| `package_vehicle_upgrades` | **Drop** (no upgrade surcharges) |
| `promo_codes` | **Drop** (promotions are out of scope; design them later) |
| `customer_booking_intents` | **Drop** (old quote-lock mechanism; replaced by recompute-at-booking) |
| `bookings`, `payments`, `refunds`, `raw_webhooks` | **Drop**; recreate `bookings`, `payments`, `payment_webhook_events` (refunds will be designed later with cancellation rules) |
| `catalog_items` | **Keep**, but drop its columns `starting_price_inr` and `distance_km` (price/distance must come only from the fare system) |
| Enums `vehicle_tier_enum`, `trip_type_enum`, `booking_status_enum`, `payment_status_enum`, `payment_provider_enum` | **Drop** if nothing else depends on them (replaced by text CHECKs) |
| `admin_audit_logs`, `profiles`, `reviews`, `catalog_item_media`, `company_profile`, `device_registrations`, `dossier_signoffs`, `inquiries`, `location_cache`, `monuments`, `notification_jobs`, `pet_taxi_policy`, `cancellation_policies`, `schema_migrations` | **Keep unchanged.** Three of them point to old bookings and must be re-pointed: `reviews.booking_id`, `notification_jobs.booking_id`, `device_registrations.booking_id` (drop the old FK, re-add to the new `bookings(id)`). |
| `rental_enquiries` | Keep. It has its own old tier list (`car_tier` check). That is outside the fare system; update it separately later. |

### 2.2 New schema

```sql
-- ===== Vehicles =====
create table vehicle_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('sedan','suv','luxury','tempo_traveller')),
  name text not null,
  driver_allowance_per_day int not null default 0 check (driver_allowance_per_day >= 0),
  night_charge_amount int not null default 0 check (night_charge_amount >= 0),
  force_round_trip_below_km int check (force_round_trip_below_km > 0),  -- NULL = no such rule
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table vehicle_models (
  id uuid primary key default gen_random_uuid(),
  vehicle_group_id uuid not null references vehicle_groups(id),
  make text not null,
  model_name text not null,
  display_name text not null,
  passenger_capacity int not null check (passenger_capacity > 0),  -- passengers only, driver excluded
  luggage_capacity int check (luggage_capacity >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ===== Global numbers (admin edits values, cannot add keys) =====
create table fare_settings (
  key text primary key check (key in ('advance_percent','min_km_per_day')),
  value int not null check (value > 0),
  check (key <> 'advance_percent' or value <= 100)
);

-- ===== Products =====
-- Bookable only when status = 'published'.
create table outstation_routes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  origin_name text not null,
  destination_name text not null,
  distance_km numeric(7,1) check (distance_km > 0),      -- one-way road km, from LocationIQ, editable
  duration_minutes int check (duration_minutes > 0),     -- informational, never used in the fare
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  unique (origin_name, destination_name),
  check (status <> 'published' or (distance_km is not null and duration_minutes is not null))
);

create table local_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,                  -- e.g. '8 hours / 80 km', 'Full Day'
  duration_hours int check (duration_hours > 0),   -- informational only
  included_km int check (included_km > 0),         -- informational only
  covers text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  pickup_name text not null,
  drop_name text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table tour_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  duration_text text not null,
  days int not null default 1,
  nights int not null default 0,
  source text not null default 'Agra',
  destination text not null default '',
  inclusions_highlight text,
  inclusions_note text,
  image_url text,
  gallery jsonb not null default '[]',
  inclusions jsonb not null default '[]',
  exclusions jsonb not null default '[]',
  itinerary jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
-- (days, nights and the content columns are display content, never used in the fare.)

-- ===== Prices: one row per car model per product =====
-- outstation: all three product ids NULL = the global ₹/km for that car
-- other categories: exactly its own product id = fixed ₹ for that car and product
create table fare_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_model_id uuid not null references vehicle_models(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  amount int not null check (amount > 0),
  is_active boolean not null default true,
  check (
    (category = 'outstation'    and local_package_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'local_package' and local_package_id is not null and transfer_id is null and tour_package_id is null) or
    (category = 'transfer'      and transfer_id is not null and local_package_id is null and tour_package_id is null) or
    (category = 'tour_package'  and tour_package_id is not null and local_package_id is null and transfer_id is null)
  )
);
create unique index fare_rules_one_active
  on fare_rules (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
  nulls not distinct where is_active;

-- ===== Explicit charges and notes (admin-managed) =====
-- Scope: category → optionally one product → optionally one vehicle group.
-- amount NULL = message only (label is shown to the customer, nothing is added).
create table extra_charges (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_group_id uuid references vehicle_groups(id),     -- NULL = all vehicles
  route_id uuid references outstation_routes(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),       -- all four NULL = every product in the category
  label text not null,
  amount int check (amount > 0),
  is_active boolean not null default true,
  check (
    (category = 'outstation'    and local_package_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'local_package' and route_id is null and transfer_id is null and tour_package_id is null) or
    (category = 'transfer'      and route_id is null and local_package_id is null and tour_package_id is null) or
    (category = 'tour_package'  and route_id is null and local_package_id is null and transfer_id is null)
  )
);
create unique index extra_charges_no_duplicates
  on extra_charges (category, vehicle_group_id, route_id, local_package_id, transfer_id, tour_package_id, label)
  nulls not distinct where is_active;

-- ===== Bookings =====
create table bookings (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null unique,                 -- customer-facing reference, generated by backend
  user_id uuid references profiles(id),           -- NULL = guest booking
  guest_access_token text not null unique,        -- lets a guest view their booking
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_model_id uuid not null references vehicle_models(id),
  passenger_count int not null check (passenger_count > 0),
  route_id uuid references outstation_routes(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  trip_type text check (trip_type in ('one_way','round_trip')),   -- outstation only; as requested by customer
  pickup_at timestamptz not null,
  return_at timestamptz,
  pickup_address text not null,
  drop_address text,
  flight_train_number text,
  special_notes text,
  fare_breakdown jsonb not null,                  -- frozen copy of the quote response
  total_amount int not null check (total_amount > 0),
  advance_amount int not null check (advance_amount >= 0 and advance_amount <= total_amount),
  balance_amount int generated always as (total_amount - advance_amount) stored,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','driver_assigned','in_transit','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_at is null or return_at > pickup_at),
  check (trip_type is distinct from 'round_trip' or return_at is not null),
  check (
    (category = 'outstation'    and route_id is not null and local_package_id is null and transfer_id is null and tour_package_id is null and trip_type is not null) or
    (category = 'local_package' and local_package_id is not null and route_id is null and transfer_id is null and tour_package_id is null and trip_type is null) or
    (category = 'transfer'      and transfer_id is not null and route_id is null and local_package_id is null and tour_package_id is null and trip_type is null) or
    (category = 'tour_package'  and tour_package_id is not null and route_id is null and local_package_id is null and transfer_id is null and trip_type is null)
  )
);
-- Dispatch statuses after 'confirmed' belong to operations. The fare system only performs
-- pending_payment → confirmed (payment webhook) and pending_payment → cancelled.

-- ===== Payments (advance only) =====
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null,
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amount_paise bigint not null check (amount_paise > 0),   -- = bookings.advance_amount × 100
  status text not null default 'pending'
    check (status in ('pending','captured','failed','needs_review')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_one_pending_per_booking on payments (booking_id) where status = 'pending';

create table payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);
```

### 2.3 Migration order (single wipe, numbered migrations following the existing `schema_migrations` convention)

1. Drop the three old foreign keys that point at `bookings` (`reviews`, `notification_jobs`, `device_registrations`).
2. Drop the tables and enums marked Drop in 2.1. Delete all rows (test data, no backup needed).
3. `alter table catalog_items drop column starting_price_inr, drop column distance_km`.
4. Create the new tables in this order: `vehicle_groups`, `vehicle_models`, `fare_settings`, `outstation_routes`, `local_packages`, `transfers`, `tour_packages`, `fare_rules`, `extra_charges`, `bookings`, `payments`, `payment_webhook_events`.
5. Re-add the three foreign keys to the new `bookings(id)`.
6. Enable RLS on every new table.
7. Seed: 4 vehicle groups, 2 `fare_settings` rows, the car models, outstation `fare_rules` rows, and the seed notes in `extra_charges` (for example an outstation note "Tolls and parking extra, paid to the driver as per actual" and the extra-km/hour policy note for each local package). Seed values come from section 0.

Why edits cannot change old bookings: `total_amount`, `advance_amount` and `fare_breakdown` are copied into the booking when it is created.

---

## 3. Which price is used

One lookup, no fallbacks.

```
price = the fare_rules row where
        category            = the quote's category
    and vehicle_model_id    = the car the customer chose
    and product id          = the chosen local package, transfer or tour package (none for outstation)
    and is_active           = true
none found → error VEHICLE_NOT_AVAILABLE
```

The car must also be available: its `vehicle_models.is_active` and its group's `vehicle_groups.is_active` must both be true.

Example: Innova Crysta ₹18/km and Ertiga ₹14/km both live in group `suv`. Each has its own outstation `fare_rules` row. Quoting Innova reads only the Innova row; the Ertiga row is never consulted. A new SUV with no row yet is simply not bookable until the admin gives it a price.

Admin convenience (UI only): a "set for whole group" button can create/update one row per car in the group; the database still stores one row per car.

---

## 4. Fare formulas

All integers except outstation `base_fare`, which is rounded half up to whole ₹. Line order: base → driver allowance → night charge → explicit charges.

### 4.1 Outstation

Inputs: `route_id`, `vehicle_model_id`, `passenger_count`, `trip_type`, `pickup_at`, `return_at` (required for round trip).
Trusted data: `outstation_routes.distance_km` and the car's outstation `fare_rules.amount` (₹/km). Client-supplied distance or price is ignored.

```
d    = route.distance_km
rate = car's outstation ₹/km
g    = the car's vehicle group
t    = g.force_round_trip_below_km          # NULL for most groups

# 1. effective trip type
if t is not NULL and d < t:  effective = round_trip
else:                        effective = requested trip_type
# d == t exactly counts as at-or-above: follows the requested type.

# 2. days = calendar days in Asia/Kolkata
effective one_way:           days = 1
effective round_trip with a return_at:  days = IST_date(return_at) − IST_date(pickup_at) + 1
effective round_trip forced on a one_way request (no return_at): days = 1

# 3. billable km
one_way:    billable_km = d
round_trip: billable_km = max(2 × d, min_km_per_day × days)      # min_km_per_day from fare_settings

# 4. lines
base_fare        = round_half_up(billable_km × rate)
driver_allowance = g.driver_allowance_per_day × days    if days ≥ 2 else 0
night_charge     = g.night_charge_amount                if pickup is in the night window else 0
extra_charges    = sum of amounts of applicable extra_charges rows
total            = base_fare + driver_allowance + night_charge + extra_charges
```

Night window: pickup local time (IST) ≥ 20:00 or < 06:00. 19:59 no, 20:00 yes, 05:59 yes, 06:00 no. The night charge is charged once, from the pickup time only.

### 4.2 Local package, transfer, tour package
```
total = the car's fixed amount for that product (section 3) + sum of applicable extra_charges
```
No distance, driver allowance or night charge.

### 4.3 Applicable extra charges
A row applies when ALL are true: `is_active`; same `category`; (`route_id`/product id is NULL or equals the quote's product); (`vehicle_group_id` is NULL or equals the car's group).
Rows with an amount become `extra_charge` lines and are added once (flat, not per day, not per km). Rows without an amount go to `messages` and never change the total.

### 4.4 Advance and balance
```
advance = min(total, round_half_up(total × advance_percent / 100))
balance = total − advance
```
Advance is based on the final total including extra charges.

### 4.5 Discounts and tax
None in v1. Prices are GST-inclusive. The finalizer keeps a slot for discounts so promotions can be added later without changing the quote shape.

---

## 5. What lives in the database and what in code

| Item | Lives in | Admin can change |
|---|---|---|
| ₹/km per car and fixed prices per car per product | `fare_rules.amount` | Yes |
| Toll, parking, interstate tax, any flat charge, notes | `extra_charges` | Yes (add / edit / deactivate) |
| Driver allowance, night charge, force-round-trip km | `vehicle_groups` | Yes |
| Advance percent, min km/day | `fare_settings` | Yes |
| Cars: name, seats, active | `vehicle_models` | Yes |
| Route distance and duration | `outstation_routes` (from LocationIQ; editable) | Yes |
| Formulas, rounding, night-window hours (20:00–06:00 IST) | Code | No |

No rate, allowance, percentage, threshold or charge may appear as a literal in code or either frontend.

---

## 6. Routes and LocationIQ (admin panel)

1. Admin enters **origin** (`origin_name`) and **destination** (`destination_name`) and clicks **Calculate distance**.
2. The panel calls `POST /admin/routes/calculate-distance`. The backend (never the browser) calls LocationIQ: geocode both places, then a driving route. It returns road distance, duration and the resolved place names so the admin can confirm LocationIQ found the right places.
3. The panel fills `distance_km` and `duration_minutes`. The admin can adjust them and saves the route.
4. A route can only be published with both values (enforced by the table CHECK).

Rules:
- The key is in server env `LOCATIONIQ_API_KEY` only; it must never appear in a response, log or frontend bundle.
- Conversion: `distance_km = round_half_up(metres / 1000, 1 decimal)`; `duration_minutes = round_half_up(seconds / 60)`. Example: 230,456 m and 14,730 s → 230.5 km and 246 min.
- Called only on route creation or when the admin presses calculate again. Quotes never call LocationIQ. Recalculating affects future quotes only.
- Duration is informational and never enters the fare.
- The agent must confirm the exact endpoints, region host and rate limits in the LocationIQ docs before coding, and call geocoding and routing sequentially.
- Errors: `GEOCODE_FAILED`, `ROUTING_FAILED`, `UPSTREAM_ERROR`. On error the form stays editable for manual entry.

---

## 7. Flow

| Step | What happens | Where |
|---|---|---|
| 1 Validate | Zod parses request (types, enums, dates, `pickup_at` in the future, `return_at` after pickup, passenger count ≥ 1) | `contracts/api` |
| 2 Identify | Load car (active, group active) and the product (`status = 'published'`); passenger count ≤ car capacity | resolver |
| 3 Category | `category` selects the calculator | engine |
| 4 Trusted data | Distance and duration from the route row; client values ignored | resolver |
| 5 Rules | Section 3 price lookup, applicable `extra_charges`, group settings, `fare_settings` | resolver |
| 6 Base fare | Section 4 | calculator |
| 7 Charges | Driver allowance and night charge (outstation), extra charges (all) | calculator |
| 8 Discount/tax | No-op in v1 | finalizer |
| 9 Quote | Lines, total, advance, balance, messages | finalizer |
| 10 Booking | Recompute; compare with `quoted_total`; save booking + frozen breakdown | booking service |
| 11 Payment | Create provider order for `advance_amount × 100` | payment service |
| 12 Confirmation | Verified webhook, deduplicated, amount-checked, booking → confirmed | webhook handler |

Resolvers read the database; calculators are pure functions with no database or network access.

---

## 8. Shared contracts (`contracts/` package for backend, admin and customer site)

```ts
import { z } from 'zod';

export const CategoryCode = z.enum(['outstation','local_package','transfer','tour_package']);
export const VehicleGroupCode = z.enum(['sedan','suv','luxury','tempo_traveller']);

const Common = z.object({
  vehicle_model_id: z.string().uuid(),
  passenger_count: z.number().int().min(1),
  pickup_at: z.string().datetime({ offset: true }),   // must be in the future (server check)
});

export const QuoteRequest = z.discriminatedUnion('category', [
  Common.extend({
    category: z.literal('outstation'),
    route_id: z.string().uuid(),
    trip_type: z.enum(['one_way','round_trip']),
    return_at: z.string().datetime({ offset: true }).optional(), // required when round_trip; after pickup_at
  }),
  Common.extend({ category: z.literal('local_package'), local_package_id: z.string().uuid() }),
  Common.extend({ category: z.literal('transfer'),      transfer_id: z.string().uuid() }),
  Common.extend({ category: z.literal('tour_package'),  tour_package_id: z.string().uuid() }),
]); // unknown fields (distance, price, total, advance) are stripped, never used

export const QuoteLine = z.object({
  code: z.enum(['base_fare','driver_allowance','night_charge','extra_charge']), // extra_charge may repeat
  label: z.string(),
  amount: z.number().int().nonnegative(),
});

export const QuoteResponse = z.object({
  category: CategoryCode,
  vehicle: z.object({
    vehicle_model_id: z.string().uuid(),
    display_name: z.string(),
    group_code: VehicleGroupCode,
    passenger_capacity: z.number().int().positive(),
  }),
  currency: z.literal('INR'),
  lines: z.array(QuoteLine).min(1),
  total: z.number().int().positive(),        // = sum of lines
  advance: z.number().int().nonnegative(),   // ≤ total
  balance: z.number().int().nonnegative(),   // = total − advance
  messages: z.array(z.string()),             // amount-less extra_charges labels
  details: z.object({
    rate_per_km: z.number().int().optional(),
    distance_km: z.number().optional(),
    duration_minutes: z.number().int().optional(),
    billable_km: z.number().optional(),
    days: z.number().int().optional(),
    effective_trip_type: z.enum(['one_way','round_trip']).optional(),
  }),
});

export const CreateBookingRequest = z.object({
  quote: QuoteRequest,
  quoted_total: z.number().int().positive(),   // what the customer saw; never used as the price
  customer_name: z.string().min(1),
  customer_phone: z.string().min(10),
  customer_email: z.string().email().optional(),
  pickup_address: z.string().min(1),
  drop_address: z.string().optional(),
  flight_train_number: z.string().optional(),
  special_notes: z.string().optional(),
});

// ---- Admin contracts ----
export const VehicleModelCreate = z.object({
  vehicle_group_code: VehicleGroupCode, make: z.string().min(1), model_name: z.string().min(1),
  display_name: z.string().min(1), passenger_capacity: z.number().int().positive(),
  luggage_capacity: z.number().int().nonnegative().optional(), sort_order: z.number().int().optional(),
});
export const VehicleModelPatch = VehicleModelCreate.omit({ vehicle_group_code: true }).partial().extend({ is_active: z.boolean().optional() });
export const FareRuleCreate = z.object({
  category: CategoryCode, vehicle_model_id: z.string().uuid(),
  local_package_id: z.string().uuid().optional(), transfer_id: z.string().uuid().optional(), tour_package_id: z.string().uuid().optional(),
  amount: z.number().int().positive(),
});
export const FareRulePatch = z.object({ amount: z.number().int().positive().optional(), is_active: z.boolean().optional() });
export const ExtraChargeCreate = z.object({
  category: CategoryCode, vehicle_group_code: VehicleGroupCode.optional(),
  route_id: z.string().uuid().optional(), local_package_id: z.string().uuid().optional(),
  transfer_id: z.string().uuid().optional(), tour_package_id: z.string().uuid().optional(), // at most one product
  label: z.string().min(1), amount: z.number().int().positive().optional(),                 // omit = message only
});
export const ExtraChargePatch = z.object({ label: z.string().min(1).optional(), amount: z.number().int().positive().nullable().optional(), is_active: z.boolean().optional() });
export const VehicleGroupPatch = z.object({
  driver_allowance_per_day: z.number().int().nonnegative().optional(),
  night_charge_amount: z.number().int().nonnegative().optional(),
  force_round_trip_below_km: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});
export const FareSettingPatch = z.object({ value: z.number().int().positive() });
export const RouteCalculateRequest  = z.object({ origin: z.string().min(2), destination: z.string().min(2) });
export const RouteCalculateResponse = z.object({
  distance_km: z.number().positive(), duration_minutes: z.number().int().positive(),
  resolved_origin: z.string(), resolved_destination: z.string(),
});
```

Customer endpoints:

| Method + path | Purpose |
|---|---|
| `GET /catalog` | Active groups, cars (with seats), published routes, local packages, transfers, tour packages |
| `GET /catalog/tour-packages` | Packages with the lowest active price for "from ₹X" cards |
| `POST /quotes` | `QuoteRequest` → `QuoteResponse` |
| `POST /bookings` | `CreateBookingRequest` → booking. Recomputes; if the total differs from `quoted_total` → **409 `PRICE_CHANGED`** with the fresh quote and no booking row |
| `POST /bookings/:id/payment` | Creates the provider order for the stored `advance_amount × 100`; returns the existing pending payment if one exists |
| `POST /webhooks/payment` | Verify signature → store event (deduplicated) → check amount → update payment and booking in one transaction |

Admin endpoints (role per section 0 #10; each write inserts an `admin_audit_logs` row with actor, resource, before/after state; no hard deletes, only `is_active = false` or `status = 'archived'`):

| Method + path | Purpose |
|---|---|
| `POST /admin/vehicle-models`, `PATCH /admin/vehicle-models/:id` | Add and edit cars (seats, name, active) |
| `PATCH /admin/vehicle-groups/:id` | Driver allowance, night charge, force-round-trip km, active |
| `POST /admin/fare-rules`, `PATCH /admin/fare-rules/:id` | Prices per car (₹/km or fixed) |
| `POST /admin/extra-charges`, `PATCH /admin/extra-charges/:id` | Explicit charges and notes |
| `PATCH /admin/fare-settings/:key` | Advance percent, min km/day |
| `POST /admin/routes`, `PATCH /admin/routes/:id` | Routes (distance, duration editable; publish) |
| `POST /admin/routes/calculate-distance` | `RouteCalculateRequest` → `RouteCalculateResponse` via LocationIQ; saves nothing |

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `PRODUCT_INACTIVE`, `VEHICLE_NOT_AVAILABLE`, `CAPACITY_EXCEEDED`, `SETTINGS_MISSING`, `PRICE_CHANGED`, `INVALID_STATE`, `FORBIDDEN`, `CONFLICT`, `GEOCODE_FAILED`, `ROUTING_FAILED`, `UPSTREAM_ERROR`.

---

## 9. Automated tests

The expected values below were worked out by hand from the formulas. They use **test fixture values**, not business policy, so the tests do not depend on the numbers in section 0. If a test fails, either the code or the formulas have a bug; do not change an expected value without changing the spec.

All dates are IST. Tests freeze "now" at 2026-10-10 12:00 IST. Trips start Monday 2026-10-12 unless stated. Advance uses 20% unless stated.

### 9.1 Fixture

Settings: `advance_percent` 20, `min_km_per_day` 300.

| Group | Allowance/day | Night charge | Force round trip below |
|---|---:|---:|---|
| sedan | 300 | 250 | none |
| suv | 400 | 300 | none |
| luxury | 800 | 500 | none |
| tempo_traveller | 500 | 400 | 300 km |

| Car (code) | Group | Seats | Outstation ₹/km |
|---|---|---:|---:|
| DZ Maruti Dzire | sedan | 4 | 10 |
| HC Honda City | sedan | 4 | 13 |
| ER Maruti Ertiga | suv | 6 | 14 |
| IC Innova Crysta | suv | 7 | 18 |
| FO Fortuner | suv | 7 | 28 |
| CA Toyota Camry | luxury | 4 | 40 |
| VE Toyota Vellfire | luxury | 6 | 45 |
| T12 Force Traveller 12-seater | tempo_traveller | 12 | 25 |
| T17 Force Traveller 17-seater | tempo_traveller | 17 | 28 |
| UR Force Urbania 13-seater | tempo_traveller | 13 | 34 |

Published routes (one-way km): DEL Agra→Delhi 230.0, MAT Agra→Mathura 58.0, JAI Agra→Jaipur 240.0, GWA Agra→Gwalior 119.5, LKO Agra→Lucknow 335.0, and boundary routes B299 = 299.0, B2999 = 299.9, B300 = 300.0, B3001 = 300.1. One draft route DRAFT.

Fixed prices (cars not listed have no rule, so they are unavailable for that product):

| Product | Prices |
|---|---|
| Local L-8H (8 h / 80 km) | DZ 1900, ER 2600, IC 3200, UR 6000 |
| Local L-FD (Full Day) | DZ 2800, ER 3600 |
| Transfer T-CANTT (station) | DZ 500, ER 800, IC 1000 |
| Transfer T-AIRPORT | DZ 600, IC 1100 |
| Transfer T-IGI (Delhi airport) | DZ 3200, IC 5200, UR 9500 |
| Tour P-SUNRISE | DZ 1500, ER 2200, IC 2800, UR 5500 |
| Tour P-GOLDEN | DZ 12500, IC 22000 |
| Tour P-MATHURA | DZ 2400, IC 3800 |

No extra charges in the fixture; tests that need charges create them. Passenger count defaults to 1.

### 9.2 Outstation: every car on one route (one-way, DEL 230 km, Monday 10:00)

| ID | Car | Calculation | Total | Advance |
|---|---|---|---:|---:|
| OM-01 | DZ | 230 × 10 | 2300 | 460 |
| OM-02 | HC | 230 × 13 | 2990 | 598 |
| OM-03 | ER | 230 × 14 | 3220 | 644 |
| OM-04 | IC | 230 × 18 | 4140 | 828 |
| OM-05 | FO | 230 × 28 | 6440 | 1288 |
| OM-06 | CA | 230 × 40 | 9200 | 1840 |
| OM-07 | VE | 230 × 45 | 10350 | 2070 |
| OM-08 | T12 | tempo group, 230 < 300 → forced round trip: max(460, 300) = 460 × 25 | 11500 | 2300 |
| OM-09 | T17 | forced round trip: 460 × 28 | 12880 | 2576 |
| OM-10 | UR | forced round trip: 460 × 34 | 15640 | 3128 |

For OM-08 to OM-10 the response has `effective_trip_type = round_trip`, `billable_km = 460`, `days = 1`, no driver allowance.

### 9.3 Outstation: round trips, minimum km and multi-day

| ID | Car, route, trip | Calculation | Total | Advance |
|---|---|---|---:|---:|
| OR-01 | DZ DEL, same day (08:00→22:00) | max(460, 300) = 460 × 10; days 1, no allowance | 4600 | 920 |
| OR-02 | DZ MAT, same day | max(116, 300) = 300 × 10 | 3000 | 600 |
| OR-03 | DZ MAT, Mon 08:00 → Tue 20:00 (2 days) | max(116, 600) = 600 × 10 = 6000 + allowance 300 × 2 | 6600 | 1320 |
| OR-04 | DZ LKO, 2 days | max(670, 600) = 670 × 10 = 6700 + 600 | 7300 | 1460 |
| OR-05 | ER JAI, 3 days (Mon→Wed) | max(480, 900) = 900 × 14 = 12600 + 400 × 3 | 13800 | 2760 |
| OR-06 | IC JAI, 2 days | max(480, 600) = 600 × 18 = 10800 + 400 × 2 | 11600 | 2320 |
| OR-07 | IC JAI, same day | max(480, 300) = 480 × 18 | 8640 | 1728 |
| OR-08 | ER DEL, 2 days | max(460, 600) = 600 × 14 = 8400 + 800 | 9200 | 1840 |
| OR-09 | ER JAI, 5 days (Mon→Fri) | max(480, 1500) = 1500 × 14 = 21000 + 400 × 5 | 23000 | 4600 |
| OR-10 | CA JAI, 2 days | max(480, 600) = 600 × 40 = 24000 + 800 × 2 | 25600 | 5120 |
| OR-11 | HC GWA, 3 days | max(239, 900) = 900 × 13 = 11700 + 300 × 3 | 12600 | 2520 |
| OR-12 | DZ GWA, one-way | 119.5 × 10 | 1195 | 239 |
| OR-13 | HC GWA, one-way (decimal rounding) | 119.5 × 13 = 1553.5 → rounds half up | 1554 | 311 |
| OR-14 | HC GWA, same-day round trip | max(239, 300) = 300 × 13 | 3900 | 780 |
| OR-15 | DZ MAT, Mon 08:00 → Wed 08:00 (48 h, 3 calendar days) | max(116, 900) = 900 × 10 = 9000 + 300 × 3 | 9900 | 1980 |

### 9.4 Commercial group (tempo_traveller) boundary at 300 km

| ID | Car, route, request | Calculation | Total | Advance |
|---|---|---|---:|---:|
| CG-01 | T12 B299, one-way | forced RT: 598 × 25 | 14950 | 2990 |
| CG-02 | T12 B2999, one-way | forced RT: 599.8 × 25 | 14995 | 2999 |
| CG-03 | T12 B300, one-way | 300 ≥ 300: one-way 300 × 25 | 7500 | 1500 |
| CG-04 | T12 B3001, one-way | 300.1 × 25 = 7502.5 → 7503 | 7503 | 1501 |
| CG-05 | UR B299, one-way | forced RT: 598 × 34 | 20332 | 4066 |
| CG-06 | UR B2999, one-way | 599.8 × 34 = 20393.2 → 20393 | 20393 | 4079 |
| CG-07 | UR B300, one-way | 300 × 34 | 10200 | 2040 |
| CG-08 | UR B3001, one-way | 300.1 × 34 = 10203.4 → 10203 | 10203 | 2041 |
| CG-09 | DZ B299, one-way (not a tempo car) | 299 × 10, no forcing | 2990 | 598 |
| CG-10 | DZ B2999, one-way | 299.9 × 10 | 2999 | 600 |
| CG-11 | T17 MAT, one-way | forced RT: max(116, 300) = 300 × 28 | 8400 | 1680 |
| CG-12 | T12 MAT, 2-day round trip | max(116, 600) = 600 × 25 = 15000 + 500 × 2 | 16000 | 3200 |
| CG-13 | T12 LKO (335 km), one-way | 335 ≥ 300: 335 × 25 | 8375 | 1675 |
| CG-14 | T12 LKO, 2-day round trip | max(670, 600) = 670 × 25 = 16750 + 1000 | 17750 | 3550 |
| CG-15 | UR LKO, one-way, pickup 21:00 | 335 × 34 = 11390 + night 400 | 11790 | 2358 |
| CG-16 | UR B300, round trip requested, same day | max(600, 300) = 600 × 34 | 20400 | 4080 |
| CG-17 | T12 B3001, round trip requested, same day | max(600.2, 300) = 600.2 × 25 = 15005 | 15005 | 3001 |

Accepted policy to confirm with the owner: CG-02 (14,995) vs CG-03 (7,500) is a large price drop across 0.1 km. The test asserts it as the specified behaviour.

### 9.5 Night charge boundaries (DZ unless stated; DEL one-way)

| ID | Pickup | Total |
|---|---|---:|
| NT-01 | 19:59 | 2300 |
| NT-02 | 20:00 | 2550 (2300 + 250) |
| NT-03 | 23:59 | 2550 |
| NT-04 | 00:00 | 2550 |
| NT-05 | 05:59 | 2550 |
| NT-06 | 06:00 | 2300 |
| NT-07 | MAT 2-day round trip, pickup 22:00 | 6850 (6000 + 600 + 250, charged once) |
| NT-08 | DEL same-day round trip, pickup 10:00, return 23:30 | 4600 (return time never triggers it) |
| NT-09 | `pickup_at` 2026-10-12T14:30:00Z (= 20:00 IST) | 2550 |
| NT-10 | `pickup_at` 2026-10-12T14:29:00Z (= 19:59 IST) | 2300 |
| NT-11 | VE DEL one-way, 22:30 | 10850 (10350 + 500) |
| NT-12 | FO MAT one-way, 02:00 | 1924 (1624 + 300); advance 385 |
| NT-13 | Local L-8H, DZ, 22:00 | 1900 (no night charge on fixed products) |
| NT-14 | Transfer T-AIRPORT, DZ, 03:00 | 600 |
| NT-15 | Tour P-SUNRISE, DZ, 23:00 | 1500 |

### 9.6 Calendar-day counting (IST, not UTC)

| ID | Case | Expected |
|---|---|---|
| DY-01 | DZ MAT round trip, pickup Mon 18:00, return Tue 00:30 (6.5 hours later) | 2 days: 6000 + 600 = **6600** |
| DY-02 | DZ MAT round trip, pickup 2026-10-12T20:00Z (Tue 01:30 IST), return 2026-10-13T10:00Z (Tue 15:30 IST) | UTC dates differ but IST dates are the same → 1 day; night pickup: 3000 + 250 = **3250**, advance 650 |
| DY-03 | Return before pickup, or equal to pickup | `VALIDATION_ERROR` |

### 9.7 Fixed categories

| ID | Case | Total | Advance |
|---|---|---:|---:|
| LP-01 | L-8H DZ | 1900 | 380 |
| LP-02 | L-8H ER | 2600 | 520 |
| LP-03 | L-8H IC | 3200 | 640 |
| LP-04 | L-8H UR | 6000 | 1200 |
| LP-05 | L-FD DZ | 2800 | 560 |
| LP-06 | L-FD ER | 3600 | 720 |
| LP-07 | L-8H CA (no rule) | `VEHICLE_NOT_AVAILABLE` | |
| LP-08 | L-FD IC (no rule) | `VEHICLE_NOT_AVAILABLE` | |
| TR-01 | T-CANTT DZ | 500 | 100 |
| TR-02 | T-CANTT ER | 800 | 160 |
| TR-03 | T-CANTT IC | 1000 | 200 |
| TR-04 | T-AIRPORT DZ | 600 | 120 |
| TR-05 | T-AIRPORT IC | 1100 | 220 |
| TR-06 | T-IGI DZ | 3200 | 640 |
| TR-07 | T-IGI IC | 5200 | 1040 |
| TR-08 | T-IGI UR | 9500 | 1900 |
| TR-09 | T-AIRPORT ER (no rule) | `VEHICLE_NOT_AVAILABLE` | |
| TP-01 | P-SUNRISE DZ | 1500 | 300 |
| TP-02 | P-SUNRISE ER | 2200 | 440 |
| TP-03 | P-SUNRISE IC | 2800 | 560 |
| TP-04 | P-SUNRISE UR | 5500 | 1100 |
| TP-05 | P-SUNRISE HC (no rule) | `VEHICLE_NOT_AVAILABLE` | |
| TP-06 | P-GOLDEN DZ | 12500 | 2500 |
| TP-07 | P-GOLDEN IC | 22000 | 4400 |
| TP-08 | P-GOLDEN UR (no rule) | `VEHICLE_NOT_AVAILABLE` | |
| TP-09 | P-MATHURA DZ | 2400 | 480 |
| TP-10 | P-MATHURA IC | 3800 | 760 |
| TP-11 | Set outstation DZ rate to 20: P-SUNRISE DZ stays 1500, DEL one-way becomes 4600 | 1500 / 4600 | |
| TP-12 | Set P-SUNRISE DZ to 1800: DEL one-way DZ stays 2300 | 1800 / 2300 | |
| TP-13 | Fixed-product quotes ignore any `route`/distance data, pickup hour and trip type | unchanged | |

### 9.8 Explicit charges

Each test creates the charge rows it names (active unless stated).

| ID | Setup | Expected |
|---|---|---|
| EX-01 | Outstation, all vehicles: "Toll" 400. DZ DEL one-way | base 2300 + extra_charge 400 = **2700**; advance **540** (based on total incl. charge) |
| EX-02 | Add "Parking" 150 too | **2850**, two `extra_charge` lines; advance 570 |
| EX-03 | "Toll" 400 scoped to route DEL | DZ DEL = 2700; DZ JAI one-way = 2400 (not applied) |
| EX-04 | "Toll" 400 scoped to group suv | ER DEL = 3620 (3220 + 400); DZ DEL = 2300 |
| EX-05 | Note-only row (no amount): "Tolls and parking extra, paid to driver" | text appears in `messages`; total unchanged 2300 |
| EX-06 | Same "Toll" row inactive | ignored; 2300 |
| EX-07 | DZ DEL one-way pickup 21:00 + "Toll" 400 | 2300 + 250 + 400 = **2950**; advance 590 |
| EX-08 | Local, all vehicles on L-8H: "Parking" 100 | DZ L-8H = **2000**; advance 400 |
| EX-09 | The EX-01 outstation toll exists; quote DZ L-8H | 1900 (category does not match) |
| EX-10 | Transfer T-AIRPORT: "Airport entry" 50 | DZ = **650**; advance 130 |
| EX-11 | Tour P-SUNRISE: "Parking" 200 scoped to suv | ER = **2400**; DZ = 1500 |
| EX-12 | DZ MAT 2-day round trip + "Toll" 400 | 6600 + 400 = **7000**; the charge is flat, not per day; advance 1400 |
| EX-13 | T12 B299 one-way + "Toll" 400 | 14950 + 400 = **15350**; advance 3070 |
| EX-14 | Note-only row edited by admin to amount 300 | next quote adds 300 |
| EX-15 | Two active rows with the same scope and label | second insert rejected (`CONFLICT`); same label with different scope allowed |
| EX-16 | `extra_charges` row with a route id but category `tour_package` | rejected by DB CHECK |

### 9.9 Advance and rounding

| ID | Case | Expected |
|---|---|---|
| AD-01 | 20%, total 2300 | 460 |
| AD-02 | 33%, total 2990 | 986.7 → **987** |
| AD-03 | 100%, total 2300 | advance = 2300, balance 0 |
| AD-04 | 1%, total 2300 | 23 |
| AD-05 | 25%, total 7503 | 1875.75 → **1876** |
| AD-06 | Finalizer unit test: total 1502, 25% | 375.5 → **376** (exact .5 rounds up) |
| AD-07 | Every case above | `advance ≤ total`, `balance = total − advance` |
| AD-08 | DB rejects `advance_percent` 0 and 101; unknown settings key | rejected |
| AD-09 | Delete the `advance_percent` row, then quote | `SETTINGS_MISSING` |
| AD-10 | Delete `min_km_per_day`, then a round-trip quote | `SETTINGS_MISSING` |

### 9.10 Seats and car availability

| ID | Case | Expected |
|---|---|---|
| CP-01 | DZ passengers 4 | OK |
| CP-02 | DZ passengers 5 | `CAPACITY_EXCEEDED` |
| CP-03 | passengers 0, −1, 1.5, "4" | `VALIDATION_ERROR` |
| CP-04 | UR 13 OK; UR 14 | OK; `CAPACITY_EXCEEDED` |
| CP-05 | IC 7 OK; IC 8 | OK; `CAPACITY_EXCEEDED` |
| CP-06 | T17 with 17 passengers | OK |
| CP-07 | The capacity check also applies to local, transfer and tour quotes | same errors |
| CP-08 | Admin raises DZ capacity 4 → 5 | next quote with 5 passengers OK |
| AV-01 | Car `is_active = false` | `VEHICLE_NOT_AVAILABLE` |
| AV-02 | Group `is_active = false` | every car in the group `VEHICLE_NOT_AVAILABLE` |
| AV-03 | Fare rule `is_active = false` | `VEHICLE_NOT_AVAILABLE` |
| AV-04 | Car has no rule for the product, but a sibling car in the group does | `VEHICLE_NOT_AVAILABLE` (no fallback to siblings) |
| AV-05 | Route `draft` or `archived` | `PRODUCT_INACTIVE` |
| AV-06 | Unknown route / car / package id | `NOT_FOUND` |
| AV-07 | Category `outstation` with a `tour_package_id` | `VALIDATION_ERROR` |
| AV-08 | Round trip without `return_at` | `VALIDATION_ERROR` |
| AV-09 | `pickup_at` in the past or without timezone offset | `VALIDATION_ERROR` |
| AV-10 | One-way request that includes `return_at` | `return_at` ignored; same result as without |
| AV-11 | Request includes `distance_km`, `price`, `total_fare` or `advance` | fields ignored; result identical |
| AV-12 | Outstation request with no `trip_type` | `VALIDATION_ERROR` |

### 9.11 Admin changes reach the next quote

| ID | Change | Expected |
|---|---|---|
| AP-01 | DZ outstation rate 10 → 12 | OM-01 becomes **2760**; HC unchanged (2990); every route's DZ quote uses 12 |
| AP-02 | sedan allowance 300 → 350 | OR-03 becomes 6000 + 700 = **6700** |
| AP-03 | sedan night charge 250 → 300 | NT-02 becomes **2600** |
| AP-04 | `min_km_per_day` 300 → 250 | OR-02 becomes 250 × 10 = **2500**; OR-01 unchanged 4600 |
| AP-05 | tempo threshold 300 → 350 | CG-03 becomes forced RT: 600 × 25 = **15000** |
| AP-06 | tempo threshold → none | CG-01 becomes one-way 299 × 25 = **7475** |
| AP-07 | suv threshold set to 300 | ER MAT one-way becomes forced RT: 300 × 14 = **4200**; ER LKO (335) stays 4690 |
| AP-08 | `advance_percent` 20 → 30 | 2300 → advance **690** |
| AP-09 | Add a sedan "Honda Amaze" (4 seats), before any price rule; then add ₹11/km | unavailable, then DEL one-way = **2530** |
| AP-10 | Admin creates and publishes a route with distance 100.0 | DZ one-way = **1000** |
| AP-11 | Route DEL distance edited 230.0 → 240.0 | DZ one-way = **2400** |
| AP-12 | Deactivate then reactivate a rule | unavailable, then available again at the same price |
| AP-13 | All of the above after a booking was made | the booking row and `fare_breakdown` never change |

### 9.12 Booking and payment

| ID | Case | Expected |
|---|---|---|
| BK-01 | Quote DZ DEL one-way (2300), book with `quoted_total` 2300 | booking: total 2300, advance 460, balance 1840 (generated), status `pending_payment` |
| BK-02 | `quoted_total` 2300 but the rate changed to 12 (now 2760) | **409 `PRICE_CHANGED`**, response carries the fresh quote (2760), zero booking rows |
| BK-03 | Customer tampers `quoted_total` = 1 | 409 |
| BK-04 | Rate changes after BK-01 | booking total, `fare_breakdown` and payment amount unchanged |
| BK-05 | `fare_breakdown` content | car display name, group, seats, route names, distance, duration, rate, effective trip type, days, billable km, all lines, messages |
| BK-06 | DB rejects: advance > total; two product ids; round trip without `return_at`; category/product mismatch; `return_at` ≤ `pickup_at` | rejected |
| BK-07 | Booking an unpublished product or inactive car | `PRODUCT_INACTIVE` / `VEHICLE_NOT_AVAILABLE`, no row |
| BK-08 | Booking with passengers above the seats | `CAPACITY_EXCEEDED`, no row |
| PM-01 | Create payment for BK-01 | `amount_paise` = 46000; a client-supplied amount is ignored |
| PM-02 | Create payment twice | same pending payment returned; one row |
| PM-03 | Verified webhook "captured", amount 46000 | payment `captured`, booking `confirmed`, in one transaction |
| PM-04 | Same `event_id` delivered twice | second call is a no-op; one event row; no double update |
| PM-05 | Webhook amount differs from the payment amount | payment `needs_review`; booking stays `pending_payment` |
| PM-06 | Invalid webhook signature | rejected; no state change |
| PM-07 | Webhook for an unknown order | event stored, `processed = false`, nothing else changes |
| PM-08 | Webhook arrives after the booking was cancelled | payment `needs_review`; booking stays `cancelled` |
| PM-09 | Create payment for a booking not in `pending_payment` | `INVALID_STATE` |
| PM-10 | "Failed" webhook | payment `failed`; booking stays `pending_payment`; a new payment can be created |

### 9.13 Admin API, audit, routes

| ID | Case | Expected |
|---|---|---|
| AA-01 | Non-admin or anonymous calls any admin endpoint | `FORBIDDEN`; no data change; no audit row |
| AA-02 | Wrong role (for example dispatcher) edits a price | `FORBIDDEN` |
| AA-03 | Every successful admin write | exactly one `admin_audit_logs` row with actor, resource, before and after |
| AA-04 | Fare rule amount 0, −5, 12.5 | `VALIDATION_ERROR` |
| AA-05 | Second active rule for the same car and product | `CONFLICT` |
| AA-06 | Extra charge with two product ids, or a product from another category | `VALIDATION_ERROR` (DB CHECK is the backstop) |
| AA-07 | No hard-delete endpoint exists; deactivating keeps history | verified |
| AA-08 | `calculate-distance` success | returns values, saves nothing until the route is saved |
| AA-09 | LocationIQ mock returns 230,456 m and 14,730 s | 230.5 km and 246 min |
| AA-10 | LocationIQ fails | `GEOCODE_FAILED` / `ROUTING_FAILED` / `UPSTREAM_ERROR`; manual entry still lets the admin save |
| AA-11 | Publish a route with no distance or duration | rejected |
| AA-12 | Quote requests with a LocationIQ mock attached | the mock records zero calls |
| AA-13 | LocationIQ key | absent from every API response, log line and frontend bundle |

### 9.14 Database constraint tests

| ID | Case | Expected |
|---|---|---|
| DB-01 | `fare_rules`: outstation row with a tour id | rejected |
| DB-02 | `fare_rules`: tour_package row with no tour id; row with two product ids | rejected |
| DB-03 | `fare_rules`: amount 0 | rejected |
| DB-04 | Duplicate active rule; same duplicate where one is inactive | rejected; allowed |
| DB-05 | `vehicle_groups` code outside the four; negative allowance | rejected |
| DB-06 | `vehicle_models` capacity 0 | rejected |
| DB-07 | `outstation_routes`: published without distance; duplicate origin/destination; distance 0 | rejected |
| DB-08 | `bookings`: constraints in BK-06 | rejected |
| DB-09 | `payments`: second `pending` payment for the same booking | rejected |
| DB-10 | `payment_webhook_events`: duplicate (provider, event_id) | rejected |
| DB-11 | RLS: anon select/insert/update/delete on every new table | denied |

### 9.15 Property and matrix tests

| ID | Test |
|---|---|
| PR-01 | Generated over every car × every published product × trip type × 1–5 days × night/day: `total = sum(lines)`, all amounts are integers ≥ 0, `advance ≤ total`, `balance = total − advance` |
| PR-02 | Determinism: the same request and data give an identical response, twice |
| PR-03 | Non-tempo cars, one-way: a larger route distance never lowers the fare |
| PR-04 | Tempo cars are deliberately NOT monotonic at the threshold (CG-02 vs CG-03); the test asserts the specified drop |
| PR-05 | Round trip: more days never lowers the fare |
| PR-06 | For a non-forced one-way trip, the fare order across cars matches their ₹/km order |
| PR-07 | Changing the return time within the same IST date never changes the fare |
| PR-08 | Shuffling the order of extra-charge rows never changes the total |
| PR-09 | Fixed categories: result independent of pickup hour, trip type and any distance data |
| PR-10 | Matrix: every car × (outstation + every local, transfer and tour product): a quote exists exactly when an active rule exists; otherwise `VEHICLE_NOT_AVAILABLE` |
| PR-11 | Every quote total equals what the booking stores and what payment charges (`advance × 100`), end to end |

---

## 10. Suggested code layout (so the agent can split the work into files)

```
contracts/
  domain/        vehicle, fare-rule, extra-charge, route, product, booking, payment types
  api/           QuoteRequest/Response, CreateBookingRequest, admin contracts (section 8)
backend/src/modules/fares/
  fare.service.ts          orchestrates: resolve → calculate → finalize
  resolvers/               vehicle.resolver, product.resolver, price.resolver, charges.resolver, settings.resolver
  calculators/             outstation.calculator, fixed-product.calculator (local, transfer, tour), night.rules, finalizer
backend/src/modules/admin-pricing/   admin endpoints + audit logging
backend/src/modules/routes/          route admin + LocationIQ client
backend/src/modules/bookings/        booking creation and the PRICE_CHANGED check
backend/src/modules/payments/        payment creation, webhook handler
supabase/migrations/                 numbered migrations from section 2.3
tests/                               the suites in section 9, one file per sub-section
```

## 11. Instructions for the AI agent

1. Build exactly the schema in section 2. No extra columns, tables or indexes. If something is missing or unclear, stop and ask; do not invent.
2. Inspect the live database read-only first and report anything that differs from section 2.1 before changing it.
3. Implement in this order, with tests passing at each step: (a) `contracts/`; (b) pure calculators and finalizer against sections 9.2–9.9; (c) migrations and seeds; (d) resolvers and `POST /quotes`; (e) admin endpoints with audit logging; (f) route creation with LocationIQ; (g) bookings and payments; (h) database, admin, matrix and property tests.
4. Calculators are pure: no database or HTTP calls.
5. Every number in sections 3 and 4 comes from the database (section 5), never a literal in code.
6. Do not touch the customer site or admin UI as part of this task, except to expose the contracts.
7. Any ambiguity: stop and list the question instead of choosing silently.
