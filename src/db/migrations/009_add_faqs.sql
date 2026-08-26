-- Adds the `faqs` table: admin-editable questions shown on the public
-- "¿Cómo invertir?" page, importable from CSV, and optionally surfaced
-- through the chatbot widget via `available_in_chatbot`.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/009_add_faqs.sql

CREATE TABLE IF NOT EXISTS faqs (
  id                    SERIAL PRIMARY KEY,
  question              TEXT        NOT NULL,
  answer                TEXT        NOT NULL,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  available_in_chatbot  BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
