# Tour Packages Module

## 1. Executive Purpose & Business Role
The **Tour Packages** module manages curated single-day and multi-day tour itineraries (e.g., "Same Day Agra Tour", "Golden Triangle 3 Days Tour", "Mathura Vrindavan Pilgrimage").

## 2. Core Responsibilities
- **Itinerary & Inclusions**: Daily activity schedules, hotel nights, monuments covered, guide services, meals.
- **Fixed Fleet Tier Pricing**: Base package pricing stored per vehicle tier (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
- **Vehicle Upgrades**: Tier-by-tier upgrade surcharges stored in `package_vehicle_upgrades`.
- **Media Gallery**: Image gallery assets managed via Media Storage.

## 3. Database Architecture
- **Tables**: `tour_packages`, `package_vehicle_upgrades`.
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `package_code` (text slug).
- **Security**: Public read for `status = 'published'`, write restricted to `admin` and `content` roles.
