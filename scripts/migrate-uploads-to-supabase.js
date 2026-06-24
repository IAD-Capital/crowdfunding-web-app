/**
 * One-off migration: re-uploads files referenced as /uploads/<file> in the
 * developments/units `images` columns to Supabase Storage, then rewrites
 * those columns with the new public URLs.
 *
 * Usage:
 *   DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migrate-uploads-to-supabase.js
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const { DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";
const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");

if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("DATABASE_URL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are all required.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require" });

function extToContentType(ext) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function uploadFile(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  const buffer = fs.readFileSync(filePath);
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": extToContentType(ext),
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Upload failed for ${filename}: ${res.status} ${detail}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

// Cache so the same local file is only uploaded once even if referenced by
// multiple rows.
const uploadCache = new Map();

async function migrateImages(images) {
  if (!Array.isArray(images)) return images;
  const result = [];
  for (const img of images) {
    if (typeof img !== "string" || !img.startsWith("/uploads/")) {
      result.push(img);
      continue;
    }
    const filename = img.replace("/uploads/", "");
    if (!fs.existsSync(path.join(UPLOADS_DIR, filename))) {
      console.warn(`  ! Local file missing for ${img}, leaving as-is.`);
      result.push(img);
      continue;
    }
    if (!uploadCache.has(filename)) {
      console.log(`  uploading ${filename}...`);
      uploadCache.set(filename, await uploadFile(filename));
    }
    result.push(uploadCache.get(filename));
  }
  return result;
}

async function migrateTable(table) {
  const rows = await sql`SELECT id, images FROM ${sql(table)}`;
  for (const row of rows) {
    const hasLocal = (row.images ?? []).some((i) => typeof i === "string" && i.startsWith("/uploads/"));
    if (!hasLocal) continue;

    console.log(`${table} #${row.id}: migrating ${row.images.length} image(s)`);
    const newImages = await migrateImages(row.images);
    await sql`UPDATE ${sql(table)} SET images = ${newImages} WHERE id = ${row.id}`;
  }
}

(async () => {
  try {
    await migrateTable("developments");
    await migrateTable("units");
    console.log("Done.");
  } catch (e) {
    console.error("ERR", e.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
})();
