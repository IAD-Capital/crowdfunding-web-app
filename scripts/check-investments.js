const postgres = require("postgres");
const url = process.env.DATABASE_URL;
const sql = postgres(url, { ssl: "require" });

(async () => {
  try {
    const devs = await sql`
      SELECT id, images FROM developments
      WHERE EXISTS (SELECT 1 FROM unnest(images) i WHERE i LIKE '/uploads/%')
    `;
    const units = await sql`
      SELECT id, images FROM units
      WHERE EXISTS (SELECT 1 FROM unnest(images) i WHERE i LIKE '/uploads/%')
    `;
    console.log("developments still referencing local /uploads:", devs);
    console.log("units still referencing local /uploads:", units);
    if (devs.length === 0 && units.length === 0) {
      console.log("✓ Migration looks complete — no rows reference local paths.");
    }
  } catch (e) {
    console.error("ERR", e.message);
  } finally {
    await sql.end();
  }
})();
