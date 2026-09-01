-- Lets FAQs be grouped into named sections (e.g. "Funcionamiento general",
-- "Precio y valorización") that admins manage and assign questions to.
-- Idempotent — safe to run more than once.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/015_add_faq_sections.sql

CREATE TABLE IF NOT EXISTS faq_sections (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES faq_sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS faqs_section_id_idx ON faqs(section_id);
