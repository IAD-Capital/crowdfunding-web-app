-- Adds units.plan_images, a second image array separate from units.images —
-- lets the unit admin form distinguish floor plans from interior photos.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/002_add_unit_plan_images.sql

ALTER TABLE units ADD COLUMN IF NOT EXISTS plan_images TEXT[] NOT NULL DEFAULT '{}';
