import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        full_name     TEXT        NOT NULL,
        email         TEXT        NOT NULL UNIQUE,
        password_hash TEXT        NOT NULL,
        role          TEXT        NOT NULL DEFAULT 'admin',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const hash = await hashPassword("Test123@");

    await db`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ('IAD Admin', 'admin@iadcapital.app', ${hash}, 'admin')
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ status: "ok", message: "Schema created and test user seeded." });
  } catch (err) {
    return NextResponse.json({ status: "error", message: String(err) }, { status: 500 });
  }
}
