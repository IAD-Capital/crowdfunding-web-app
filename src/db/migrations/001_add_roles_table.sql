-- Adds a `roles` table and links users.role to it via a foreign key.
-- Idempotent — safe to run more than once, and safe to run against a
-- database that already has data in `users`.
--
-- Run manually against the target database, e.g.:
--   psql "$DATABASE_URL" -f src/db/migrations/001_add_roles_table.sql

CREATE TABLE IF NOT EXISTS roles (
  role_id    TEXT        PRIMARY KEY,
  label      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (role_id, label) VALUES
  ('superadmin', 'Administrator'),
  ('investor',   'Investor')
ON CONFLICT (role_id) DO NOTHING;

-- The original schema.sql defaulted users.role to 'admin', a value the app
-- never actually used ('superadmin' / 'investor' are the only real roles).
-- Normalize any leftover rows before the FK constraint below would reject them.
UPDATE users SET role = 'superadmin' WHERE role = 'admin';

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'investor';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES roles(role_id);
  END IF;
END $$;
