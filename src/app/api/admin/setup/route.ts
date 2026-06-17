import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
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
    // Migrate legacy 'admin' role to 'superadmin'
    await db`UPDATE users SET role = 'superadmin' WHERE role = 'admin'`;

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
