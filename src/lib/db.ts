import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
console.log("connectionString", process.env);

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Singleton pattern for dev hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof postgres> | undefined;
}

const db = globalThis._db ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export default db;
