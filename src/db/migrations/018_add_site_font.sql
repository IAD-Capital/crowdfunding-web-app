-- Lets an admin pick the site's typography from a curated set of Google
-- Fonts (see src/lib/siteFonts.ts for the option list) instead of the
-- hardcoded Schibsted Grotesk / Hanken Grotesk pairing. 'default' keeps the
-- current look.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/018_add_site_font.sql

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS site_font TEXT NOT NULL DEFAULT 'default';
