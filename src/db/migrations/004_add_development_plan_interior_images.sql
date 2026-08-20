-- Adds developments.plan_images and developments.interior_images, separating
-- floor plans and interior shots from the general project photos in
-- developments.images — lets the admin form and public pages show each
-- category on its own instead of mixing them together.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/004_add_development_plan_interior_images.sql

ALTER TABLE developments ADD COLUMN IF NOT EXISTS plan_images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS interior_images TEXT[] NOT NULL DEFAULT '{}';
