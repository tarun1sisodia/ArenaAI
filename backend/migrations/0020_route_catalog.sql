create table if not exists route_catalog (
  id uuid primary key default gen_random_uuid(),
  trip_type text not null check (trip_type in ('one-way','round-trip','local-tour')),
  source_city text not null,
  source_detail text,
  destination_city text,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  distance_km numeric(8,1),
  duration_text text,
  available_fleets text[] not null default '{sedan,ertiga,innova,tempo,urbania}',
  fares_inr jsonb not null,
  driver_charge_inr numeric(10,2) not null default 0,
  night_halt_inr numeric(10,2) not null default 0,
  toll_included boolean not null default true,
  toll_amount_inr numeric(10,2),
  interstate_charges jsonb not null default '[]',
  min_km_per_day integer not null default 300,
  stops jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists route_catalog_status_idx on route_catalog(status);
create index if not exists route_catalog_trip_type_idx on route_catalog(trip_type);
