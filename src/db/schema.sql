CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'admin',
  avatar        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developments (
  id              SERIAL PRIMARY KEY,
  name            TEXT        NOT NULL,
  address         TEXT        NOT NULL,
  description     TEXT,
  completion_date DATE,
  status          TEXT        NOT NULL DEFAULT 'active',
  amenities       TEXT[]      NOT NULL DEFAULT '{}',
  images          TEXT[]      NOT NULL DEFAULT '{}',
  featured        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id                    SERIAL PRIMARY KEY,
  development_id        INTEGER     NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  identifier            TEXT        NOT NULL,
  floor                 INTEGER,
  total_m2              NUMERIC,
  covered_m2            NUMERIC,
  uncovered_m2          NUMERIC,
  rooms                 INTEGER,
  bedrooms              INTEGER,
  bathrooms             INTEGER,
  orientation           TEXT,
  price_usd             NUMERIC     NOT NULL,
  current_price_usd     NUMERIC,
  status                TEXT        NOT NULL DEFAULT 'available',
  description           TEXT,
  images                TEXT[]      NOT NULL DEFAULT '{}',
  group_duration_months INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER     NOT NULL REFERENCES users(id),
  unit_id               INTEGER     NOT NULL REFERENCES units(id),
  percentage            NUMERIC     NOT NULL,
  amount_usd            NUMERIC     NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'active',
  removal_requested_at  TIMESTAMPTZ,
  removal_ack_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
