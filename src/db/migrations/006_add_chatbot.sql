-- Adds the FAQ chatbot tables: admin-authored preloaded questions/answers, and
-- a log of "Otra" (custom) questions visitors typed that weren't in the list,
-- for later admin review and promotion into real FAQ entries.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/006_add_chatbot.sql

CREATE TABLE IF NOT EXISTS chatbot_questions (
  id         SERIAL PRIMARY KEY,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_unanswered_questions (
  id         SERIAL PRIMARY KEY,
  question   TEXT        NOT NULL,
  email      TEXT,
  user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  status     TEXT        NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
