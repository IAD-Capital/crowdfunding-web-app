-- Adds Google sign-in support: a nullable google_id to link/identify accounts
-- created via "Continue with Google", and makes password_hash nullable since
-- Google-only accounts never set a password.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/014_add_google_oauth.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
