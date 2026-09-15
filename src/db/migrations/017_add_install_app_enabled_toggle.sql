-- Lets an admin turn the "install the app" promotion (floating banner, mobile
-- menu item, user menu item) off site-wide. Enabled by default.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/017_add_install_app_enabled_toggle.sql

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS install_app_enabled BOOLEAN NOT NULL DEFAULT TRUE;
