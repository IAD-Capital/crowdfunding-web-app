import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof postgres> | undefined;
}

function getDb(): ReturnType<typeof postgres> {
  if (globalThis._db) return globalThis._db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  if (process.env.NODE_ENV !== "production") {
    globalThis._db = client;
  }

  return client;
}

// Lazy proxy — connection created only on first query, not at module import time.
// This prevents next build from failing when DATABASE_URL is not set at build time.
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
