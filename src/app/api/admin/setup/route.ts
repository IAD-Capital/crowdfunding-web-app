import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Roles
    await db`
      CREATE TABLE IF NOT EXISTS roles (
        role_id    TEXT        PRIMARY KEY,
        label      TEXT        NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`
      INSERT INTO roles (role_id, label) VALUES
        ('superadmin', 'Administrator'),
        ('investor',   'Investor')
      ON CONFLICT (role_id) DO NOTHING
    `;

    // Users
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        full_name     TEXT        NOT NULL,
        email         TEXT        NOT NULL UNIQUE,
        password_hash TEXT        NOT NULL,
        role          TEXT        NOT NULL DEFAULT 'superadmin',
        avatar        TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS alternate_email TEXT`;
    // Migrate legacy 'admin' role to 'superadmin'
    await db`UPDATE users SET role = 'superadmin' WHERE role = 'admin'`;
    await db`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'investor'`;
    await db`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_role_fkey'
        ) THEN
          ALTER TABLE users
            ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES roles(role_id);
        END IF;
      END $$
    `;

    // Developers (Desarrolladoras)
    await db`
      CREATE TABLE IF NOT EXISTS developers (
        id         SERIAL PRIMARY KEY,
        name       TEXT        NOT NULL,
        website    TEXT,
        logo       TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Developments (Emprendimientos)
    await db`
      CREATE TABLE IF NOT EXISTS developments (
        id                   SERIAL PRIMARY KEY,
        name                 TEXT           NOT NULL,
        address              TEXT           NOT NULL,
        description          TEXT,
        completion_date      DATE,
        status               TEXT           NOT NULL DEFAULT 'active',
        projected_value_usd  NUMERIC(14,2),
        projected_gain_pct   NUMERIC(6,2),
        amenities            TEXT[]         NOT NULL DEFAULT '{}',
        images               TEXT[]         NOT NULL DEFAULT '{}',
        created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      )
    `;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS zone_price_per_m2 NUMERIC(10,2)`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS developer_id INTEGER REFERENCES developers(id) ON DELETE SET NULL`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS neighborhood TEXT`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS city TEXT`;
    await db`ALTER TABLE developments ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`;

    // Units (UF - Unidades Funcionales)
    await db`
      CREATE TABLE IF NOT EXISTS units (
        id               SERIAL PRIMARY KEY,
        development_id   INTEGER        NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
        identifier       TEXT           NOT NULL,
        floor            INTEGER,
        total_m2         NUMERIC(8,2),
        covered_m2       NUMERIC(8,2),
        uncovered_m2     NUMERIC(8,2),
        rooms            INTEGER,
        bedrooms         INTEGER,
        bathrooms        INTEGER,
        orientation      TEXT,
        price_usd        NUMERIC(14,2)  NOT NULL,
        status           TEXT           NOT NULL DEFAULT 'available',
        description      TEXT,
        images           TEXT[]         NOT NULL DEFAULT '{}',
        created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      )
    `;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS outdoor_m2 NUMERIC(8,2)`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS semi_covered_m2 NUMERIC(8,2)`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS total_homogeneous_m2 NUMERIC(8,2)`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS price_m2 NUMERIC(14,2)`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS currency_price TEXT`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS group_expires_at TIMESTAMPTZ`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS current_price_usd NUMERIC(14,2)`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS group_duration_months INTEGER`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS plan_images TEXT[] NOT NULL DEFAULT '{}'`;

    // Investments
    await db`
      CREATE TABLE IF NOT EXISTS investments (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        unit_id      INTEGER        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        percentage   NUMERIC(5,2)   NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
        amount_usd   NUMERIC(14,2)  NOT NULL,
        status       TEXT           NOT NULL DEFAULT 'active',
        created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      )
    `;
    await db`ALTER TABLE investments ADD COLUMN IF NOT EXISTS removal_requested_at TIMESTAMPTZ`;
    await db`ALTER TABLE investments ADD COLUMN IF NOT EXISTS removal_ack_at TIMESTAMPTZ`;

    // App settings (single row) — investment tier thresholds
    await db`
      CREATE TABLE IF NOT EXISTS app_settings (
        id           SMALLINT      PRIMARY KEY DEFAULT 1,
        bronze_from  NUMERIC(14,2) NOT NULL DEFAULT 5000,
        silver_from  NUMERIC(14,2) NOT NULL DEFAULT 10000,
        gold_from    NUMERIC(14,2) NOT NULL DEFAULT 25000,
        platinum_from NUMERIC(14,2) NOT NULL DEFAULT 150000,
        CONSTRAINT app_settings_singleton CHECK (id = 1)
      )
    `;
    await db`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS bronze_from NUMERIC(14,2) NOT NULL DEFAULT 5000`;
    await db`INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;

    // Media table (image metadata)
    await db`
      CREATE TABLE IF NOT EXISTS media (
        id             SERIAL PRIMARY KEY,
        url            TEXT        NOT NULL UNIQUE,
        alt_text       TEXT,
        credit         TEXT,
        uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        development_id INTEGER REFERENCES developments(id) ON DELETE CASCADE,
        unit_id        INTEGER REFERENCES units(id) ON DELETE CASCADE
      )
    `;
    // Migrate existing development images into media table
    await db`
      INSERT INTO media (url, development_id, uploaded_at)
      SELECT unnest(images), id, NOW()
      FROM developments
      WHERE array_length(images, 1) > 0
      ON CONFLICT (url) DO NOTHING
    `;

    const hash = await hashPassword("Test123@");
    await db`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ('IAD Admin', 'admin@iadcapital.app', ${hash}, 'superadmin')
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ status: "ok", message: "Schema created and test user seeded." });
  } catch (err) {
    return NextResponse.json({ status: "error", message: String(err) }, { status: 500 });
  }
}
