# Monuments Module (Sightseeing Catalog)

## 1. Executive Purpose & Business Role
The **Monuments** module manages information, ticketing, and guide services for heritage attractions in and around Agra (e.g., Taj Mahal, Agra Fort, Fatehpur Sikri, Mehtab Bagh, Itmad-ud-Daulah, Akbar's Tomb).

## 2. Core Responsibilities
- **Timings & Closed Days**: Opening and closing hours, Friday closure rules for Taj Mahal.
- **Entry Ticket Fees**: Indian, SAARC/BIMSTEC, and Foreign visitor rates.
- **Sightseeing Inclusions**: Serves as the authoritative source for tour package itineraries.

## 3. Database Architecture
- **Table**: `public.monuments`.
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `slug` (text).
