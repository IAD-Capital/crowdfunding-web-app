const postgres = require("postgres");
const url = process.env.DATABASE_URL;
const sql = postgres(url, { ssl: "require" });

(async () => {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log("public tables:", tables.map((t) => t.table_name));

    const cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'investments' ORDER BY ordinal_position
    `;
    console.log("investments columns:", cols);

    const admin = await sql`SELECT id, email, role FROM users WHERE email = 'admin@iadcapital.app'`;
    console.log("seeded admin:", admin);
  } catch (e) {
    console.error("ERR", e.message);
  } finally {
    await sql.end();
  }
})();
