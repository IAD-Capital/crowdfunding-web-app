# Deployment (Vercel + Supabase)

This app runs locally against a Docker Postgres container, and in production
against a Supabase Postgres database, deployed on Vercel. The two
environments differ in a few important ways — this doc is the checklist for
setting up or debugging production.

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | **Use the Supabase pooler connection**, not the direct one (see below). |
| `JWT_SECRET` | Yes | Long random secret for signing session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`. Rotating it logs out all active sessions. |
| `SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Settings → API → `service_role` secret. Used server-side only, for image uploads (bypasses RLS). **Never expose client-side.** |
| `SUPABASE_STORAGE_BUCKET` | No | Defaults to `"uploads"` in code. Only set if your bucket has a different name. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes, if push notifications are used | See [docs/PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md). Missing `VAPID_SUBJECT` at build time fails the whole build (`/api/admin/push/send` collects page data at build time) — always set all four before deploying. |
| `NODE_ENV` | No | Set automatically by Vercel — never override manually. |

Don't set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in your **local** `.env`
unless you intentionally want local uploads to go to Supabase Storage instead
of `public/uploads/` — see [Image uploads](#image-uploads) below.

## Supabase connection: pooler vs. direct

Supabase exposes two connection strings:

- **Direct** (port `5432`) — low connection limit, fine for local dev,
  migrations, and one-off scripts. **Do not use in production** — serverless
  functions on Vercel open many short-lived connections and will exhaust the
  direct connection limit quickly.
- **Pooler / Supavisor** (port `6543`, hostname like
  `aws-1-us-east-1.pooler.supabase.com`) — use this for `DATABASE_URL` in
  Vercel. Append `?pgbouncer=true` if you ever see prepared-statement errors
  (PgBouncer's transaction pooling mode doesn't support them); we haven't
  needed it so far with `postgres.js`.

Get both from Supabase Dashboard → Settings → Database.

## Why some API routes have `export const dynamic = "force-dynamic"`

Routes that query the database with a plain `GET` and no
cookie/header access (`/api/public/developments`, `/api/health`,
`/api/admin/setup`) would otherwise get **statically prerendered by Next.js
at build time** — meaning the build itself tries to open a DB connection.
This fails on Vercel if the DB isn't reachable from the build environment, or
just wastes a connection unnecessarily. Forcing `dynamic = "force-dynamic"`
makes them run only at request time.

If you add a new route that queries the DB and doesn't read
cookies/`getSession()`, add this export or it may silently try to run at
build time too.

## Image uploads

[`/api/admin/upload`](../src/app/api/admin/upload/route.ts) switches storage
backend automatically based on environment variables — no manual toggle:

- **No `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` set** → writes to
  `public/uploads/` on local disk. This is what local dev uses by default.
- **Both set** → uploads to Supabase Storage (bucket `uploads` by default),
  returns a public `https://<project>.supabase.co/storage/v1/object/public/...`
  URL. This is what Vercel uses, since Vercel's filesystem is read-only and
  ephemeral — local-disk uploads would fail or vanish on the next deploy/cold
  start.

### One-time Supabase Storage setup

1. Supabase Dashboard → **Storage** → **New bucket**.
2. Name it `uploads` (or set `SUPABASE_STORAGE_BUCKET` in Vercel to match a
   different name).
3. Toggle **Public bucket** ON — no RLS policies needed, since uploads happen
   server-side with the service-role key and reads go through the public
   URL.
4. `next.config.mjs` already allows `*.supabase.co/storage/v1/object/public/**`
   in `images.remotePatterns` for `next/image`.

### Migrating images already on local disk

If you have existing `developments`/`units` rows referencing
`/uploads/<file>.jpg` (uploaded back when only local disk existed), run:

```bash
DATABASE_URL="<supabase-pooler-url>" \
SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
node scripts/migrate-uploads-to-supabase.js
```

It uploads each local file referenced in the DB to Supabase Storage, rewrites
the `images` array on the matching row with the new public URL, and is safe
to re-run (already-migrated rows are skipped).

## Schema setup / reset on Supabase

`src/app/api/admin/setup` creates all tables idempotently (`CREATE TABLE IF
NOT EXISTS`) and seeds a superadmin user
(`admin@iadcapital.app` / `Test123@` — **change this password after first
login**). It refuses to run when `NODE_ENV=production`, so it must be called
against a **local dev server pointed at the Supabase DB**, not against the
deployed Vercel app:

```bash
# Terminal 1 — dev server pointed at Supabase
DATABASE_URL="<supabase-pooler-url>" npm run dev

# Terminal 2 — trigger the seed
npm run db:seed
```

This is also how you pick up new tables/columns added to the setup route
after Supabase already has an older schema (e.g. the `app_settings` table
added for investment tiers).

### Full reset (drop everything and recreate)

Only do this if you're certain — **irreversible, deletes all data** in the
`public` schema. Useful if a Supabase project was reused from something else
and has conflicting/incompatible tables already in it (this happened once —
a leftover `investments` table with `uuid` PKs and unrelated columns).

```bash
DATABASE_URL="<supabase-direct-or-pooler-url>" node scripts/reset-db.js
```

Drops and recreates the `public` schema (Supabase's own `auth`/`storage`
schemas are untouched), then loads `src/db/schema.sql`. Follow with
`npm run db:seed` (see above) to pick up columns/tables the setup route adds
beyond what's in `schema.sql`, and to seed the admin user.

### Diagnostic script

`scripts/check-investments.js` — connects with `DATABASE_URL` and reports
whether any `developments`/`units` rows still reference local `/uploads/`
paths (i.e. haven't been migrated to Supabase Storage yet). Useful after
running the migration script above.

```bash
DATABASE_URL="<supabase-pooler-url>" node scripts/check-investments.js
```

## Investment tiers (Bronce / Plata / Oro / Platino)

Configurable from the admin panel at **/admin/settings** (superadmin only).
Stored as a single row in `app_settings`:

| Column | Meaning |
|---|---|
| `silver_from` | USD amount where "Plata" begins (Bronce is implicitly $0–this value) |
| `gold_from` | USD amount where "Oro" begins |
| `platinum_from` | USD amount where "Platino" begins |

Defaults if the row doesn't exist yet: `10000` / `25000` / `150000`.

A unit qualifies for a tier (shown on the public catalog's tier filter) if
the dollar amount investable in it — between the 5% minimum entry and
whatever percentage is still available — overlaps that tier's range. Platino
additionally requires the unit to be **100% available** (nobody has invested
yet), since it represents buying the entire UF. See
[`src/lib/investmentTiers.ts`](../src/lib/investmentTiers.ts) for the exact
logic, shared between the server (catalog page) and the client
(`CatalogSection`'s tier selector).

The `app_settings` table is created by both `src/db/schema.sql` (fresh
installs) and the idempotent `/api/admin/setup` route (existing DBs) — run
`npm run db:seed` against Supabase after deploying this feature if the table
doesn't exist yet.

## Security notes

- Never paste real secrets (`DATABASE_URL` with password, `SUPABASE_SERVICE_ROLE_KEY`,
  `JWT_SECRET`) into chat, commit messages, or any file in the repo. If one
  is ever exposed, rotate it: Supabase Dashboard → Settings → Database
  (password) or Settings → API (`service_role` key) → regenerate, then update
  the Vercel env var.
- Change the seeded admin password (`Test123@`) after your first production
  login.
