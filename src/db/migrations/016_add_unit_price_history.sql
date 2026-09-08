CREATE TABLE IF NOT EXISTS unit_price_history (
  id               SERIAL        PRIMARY KEY,
  unit_id          INTEGER       NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  effective_date   DATE          NOT NULL,
  stage            TEXT          NOT NULL,
  total_value_usd  NUMERIC(14,2) NOT NULL,
  value_per_m2_usd NUMERIC(14,2),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unit_price_history_unit_id ON unit_price_history(unit_id);
