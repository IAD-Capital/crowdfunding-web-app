-- Adds a "coming soon" gate to app_settings: an admin-configurable toggle plus
-- an expiration date/time. When coming_soon_enabled is true AND the current
-- time is before coming_soon_expires_at, the public site shows a splash
-- screen instead of real content (see src/components/PublicShell.tsx).
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/005_add_coming_soon_gate.sql

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS coming_soon_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS coming_soon_expires_at TIMESTAMPTZ;
