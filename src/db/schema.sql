CREATE TABLE IF NOT EXISTS roles (
  role_id    TEXT        PRIMARY KEY,
  label      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO roles (role_id, label) VALUES
  ('superadmin', 'Administrator'),
  ('investor',   'Investor')
ON CONFLICT (role_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  full_name        TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  password_hash    TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'investor' REFERENCES roles(role_id),
  avatar           TEXT,
  phone            TEXT,
  alternate_email  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developers (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  website    TEXT,
  logo       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developments (
  id                  SERIAL PRIMARY KEY,
  name                TEXT        NOT NULL,
  address             TEXT        NOT NULL,
  neighborhood        TEXT,
  city                TEXT,
  description         TEXT,
  completion_date     DATE,
  status              TEXT        NOT NULL DEFAULT 'active',
  projected_value_usd NUMERIC(14,2),
  projected_gain_pct  NUMERIC(6,2),
  amenities           TEXT[]      NOT NULL DEFAULT '{}',
  images              TEXT[]      NOT NULL DEFAULT '{}',
  featured            BOOLEAN     NOT NULL DEFAULT FALSE,
  visible             BOOLEAN     NOT NULL DEFAULT TRUE,
  zone_price_per_m2   NUMERIC(10,2),
  slug                TEXT        UNIQUE,
  developer_id        INTEGER     REFERENCES developers(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id                    SERIAL PRIMARY KEY,
  development_id        INTEGER       NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  identifier            TEXT          NOT NULL,
  floor                 INTEGER,
  total_m2              NUMERIC(8,2),
  covered_m2            NUMERIC(8,2),
  uncovered_m2          NUMERIC(8,2),
  outdoor_m2            NUMERIC(8,2),
  semi_covered_m2       NUMERIC(8,2),
  total_homogeneous_m2  NUMERIC(8,2),
  price_m2              NUMERIC(14,2),
  rooms                 INTEGER,
  bedrooms              INTEGER,
  bathrooms             INTEGER,
  orientation           TEXT,
  price_usd             NUMERIC(14,2) NOT NULL,
  currency_price        TEXT,
  current_price_usd     NUMERIC(14,2),
  status                TEXT          NOT NULL DEFAULT 'available',
  description           TEXT,
  images                TEXT[]        NOT NULL DEFAULT '{}',
  plan_images           TEXT[]        NOT NULL DEFAULT '{}',
  featured              BOOLEAN       NOT NULL DEFAULT FALSE,
  featured_order        INTEGER,
  group_duration_months INTEGER,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id              INTEGER       NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  percentage           NUMERIC(5,2)  NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
  amount_usd           NUMERIC(14,2) NOT NULL,
  status               TEXT          NOT NULL DEFAULT 'active',
  removal_requested_at TIMESTAMPTZ,
  removal_ack_at       TIMESTAMPTZ,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id            SMALLINT      PRIMARY KEY DEFAULT 1,
  bronze_from   NUMERIC(14,2) NOT NULL DEFAULT 5000,
  silver_from   NUMERIC(14,2) NOT NULL DEFAULT 10000,
  gold_from     NUMERIC(14,2) NOT NULL DEFAULT 25000,
  platinum_from NUMERIC(14,2) NOT NULL DEFAULT 150000,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
