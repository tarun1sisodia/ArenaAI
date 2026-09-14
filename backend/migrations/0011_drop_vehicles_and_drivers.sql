-- Migration: 0011_drop_vehicles_and_drivers.sql
-- Description: Drop drivers and vehicles tables and decouple bookings from fleet management.

DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_driver_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_vehicle_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS driver_assigned_at;
