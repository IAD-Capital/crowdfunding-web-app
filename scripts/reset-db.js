const path = require("path");
const postgres = require("postgres");

const url = `
  postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
`;
if (!url) {
  // console.log("PostgreSQL connection string:", url);
  console.error("One or more required PostgreSQL environment variables are not set.", {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME
  });
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
