# Transfers Module (Airport & Railway Transfers)

## 1. Executive Purpose & Business Role
The **Transfers** module manages fixed-rate and per-km pickup and drop services to airports and railway stations (e.g., Delhi IGI Airport, Agra Kheria Airport, Agra Cantt Railway Station, Tundla Junction).

## 2. Core Responsibilities
- **Fixed & Per-Km Pricing**: Supports fixed transfer rates or per-km corridor rates.
- **Night Charges**: Mandatory night driving allowance.
- **Flight & Train Tracking**: Handles flight/train arrival details for driver scheduling.

## 3. Database Architecture
- **Table**: `public.transfer_routes` (view: `transfers`).
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `route_code` (e.g., `kheria-airport`, `delhi-igi-airport`).
