# Local Tours Module (Local City Rentals)

## 1. Executive Purpose & Business Role
The **Local Tours** module manages intra-city cab rentals in Agra and surrounding districts governed by time and distance slabs.

It permanently replaces the ad-hoc `day120` hack with canonical contract slabs.

## 2. Canonical Rental Slabs
- **`8hr-80km`**: Standard 8 hours or 80 km coverage (e.g., Taj Mahal, Agra Fort, Mehtab Bagh).
- **`12hr-120km`**: Extended full-day 12 hours or 120 km coverage (e.g., Taj Mahal, Agra Fort, Fatehpur Sikri).
- **Extra Rates**: When the trip exceeds hours or kilometers, extra charges apply per km and per hour based on vehicle tier.

## 3. Database Architecture
- **Table**: `public.local_sightseeing_packages` (view: `local_tours`).
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `package_code` (e.g., `agra-standard-sightseeing`, `agra-extended-city-tour`).
