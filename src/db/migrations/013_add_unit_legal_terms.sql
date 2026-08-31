-- Adds a per-unit legal terms field so admins can write the "Aspectos legales"
-- shown on each unit's public page (formalization, post-investment process, etc.),
-- filled in progressively per unit rather than a single site-wide legal text.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/013_add_unit_legal_terms.sql

ALTER TABLE units ADD COLUMN IF NOT EXISTS legal_terms TEXT;
