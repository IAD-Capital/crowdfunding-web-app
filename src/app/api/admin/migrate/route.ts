import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/admin/migrate?secret=MIGRATE_SECRET
// Runs additive migrations safe to run in production.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
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
    results.push("media table: ok");

    // Migrate existing development images into media table
    const { count } = await db`
      INSERT INTO media (url, development_id, uploaded_at)
      SELECT unnest(images), id, NOW()
      FROM developments
      WHERE array_length(images, 1) > 0
      ON CONFLICT (url) DO NOTHING
    `.then((rows) => ({ count: rows.count }));
    results.push(`migrated ${count} development images`);

    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS plan_images TEXT[] NOT NULL DEFAULT '{}'`;
    results.push("units.plan_images: ok");

    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE`;
    await db`ALTER TABLE units ADD COLUMN IF NOT EXISTS featured_order INTEGER`;
    results.push("units.featured/featured_order: ok");

    await db`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint      TEXT        NOT NULL UNIQUE,
        p256dh        TEXT        NOT NULL,
        auth          TEXT        NOT NULL,
        user_agent    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)`;
    results.push("push_subscriptions table: ok");

    await db`
      CREATE TABLE IF NOT EXISTS push_notifications (
        id              SERIAL PRIMARY KEY,
        title           TEXT        NOT NULL,
        body            TEXT        NOT NULL,
        url             TEXT,
        sent_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recipient_count INTEGER     NOT NULL DEFAULT 0,
        success_count   INTEGER     NOT NULL DEFAULT 0,
        failure_count   INTEGER     NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at ON push_notifications(created_at DESC)`;
    results.push("push_notifications table: ok");

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), results }, { status: 500 });
  }
}
