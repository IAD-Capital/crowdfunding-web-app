const path = require("path");
const postgres = require("postgres");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

(async () => {
  try {
    console.log("Dropping public schema...");
    await sql.unsafe("DROP SCHEMA public CASCADE;");
    await sql.unsafe("CREATE SCHEMA public;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO public;");

    console.log("Loading schema.sql...");
    await sql.file(path.join(__dirname, "..", "src", "db", "schema.sql"));

    console.log("Done. Tables created:");
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log(tables.map((t) => t.table_name));
  } catch (e) {
    console.error("ERR", e.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
})();
