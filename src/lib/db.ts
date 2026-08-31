import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof postgres> | undefined;
}

function getDb(): ReturnType<typeof postgres> {
  if (globalThis._db) return globalThis._db;

  const connectionString = `
    postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
  `;

  if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME) {
    throw new Error("One or more required PostgreSQL environment variables are not set", {
      cause: {
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
      },
    });
  }

  // DB_HOST/DB_PORT point at Supabase's Supavisor pooler in transaction mode,
  // which already multiplexes connections upstream — each serverless
  // function instance only needs a handful of its own, not postgres.js's
  // default of 10. Cached on globalThis in every environment (not just dev)
  // so a warm Vercel lambda reuses one client/pool across invocations
  // instead of opening a fresh pool per query, which is what was exhausting
  // the pooler's connection cap.
  //
  // prepare: false is required in transaction mode — the pooler can route
  // each query from the same client connection to a different backend
  // Postgres connection, so a prepared statement cached from one query may
  // not exist on the connection the next one lands on ("prepared statement
  // ... does not exist"). This surfaced under concurrent queries once
  // requests started fanning out more (Promise.all, cached session lookups
  // shared across components) — see Supabase's postgres.js pooler docs.
  const client = postgres(connectionString, { max: 5, prepare: false });
  globalThis._db = client;

  return client;
}

// Lazy proxy — connection created only on first query, not at module import time.
// This prevents next build from failing when any required environment variable is not set at build time.
const db = new Proxy(
  ((...args: Parameters<ReturnType<typeof postgres>>) =>
    (getDb() as (...a: Parameters<ReturnType<typeof postgres>>) => ReturnType<ReturnType<typeof postgres>>)(...args)) as ReturnType<typeof postgres>,
  {
    get(_target, prop) {
      return (getDb() as never)[prop];
    },
  }
);

export default db;
