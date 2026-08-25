-- Lets a chatbot question branch into sub-options instead of (or in addition
-- to) a plain text answer: parent_id makes chatbot_questions self-referential,
-- and answer becomes optional since a branching node may only present options.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/007_add_chatbot_question_hierarchy.sql

ALTER TABLE chatbot_questions ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES chatbot_questions(id) ON DELETE CASCADE;
ALTER TABLE chatbot_questions ALTER COLUMN answer DROP NOT NULL;
CREATE INDEX IF NOT EXISTS chatbot_questions_parent_id_idx ON chatbot_questions(parent_id);
