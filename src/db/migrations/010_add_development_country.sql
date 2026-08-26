-- Adds an optional `country` field to developments, populated via the
-- developments CSV importer.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/010_add_development_country.sql

ALTER TABLE developments ADD COLUMN IF NOT EXISTS country TEXT;
