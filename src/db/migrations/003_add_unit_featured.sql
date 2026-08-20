-- Adds units.featured and units.featured_order — lets the admin pick up to 8
-- units to showcase in the "Unidades destacadas" hero section on the home page.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/003_add_unit_featured.sql

ALTER TABLE units ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS featured_order INTEGER;
