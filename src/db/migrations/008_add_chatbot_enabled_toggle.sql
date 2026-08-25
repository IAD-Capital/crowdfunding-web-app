-- Lets an admin turn the public chatbot widget off site-wide without
-- deleting any questions. Enabled by default.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/008_add_chatbot_enabled_toggle.sql

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS chatbot_enabled BOOLEAN NOT NULL DEFAULT TRUE;
