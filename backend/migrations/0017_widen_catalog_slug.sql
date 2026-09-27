-- Migration 0017: Widen catalog slug column to accommodate all 980+ outstation route slugs
ALTER TABLE catalog_items ALTER COLUMN slug TYPE VARCHAR(150);
