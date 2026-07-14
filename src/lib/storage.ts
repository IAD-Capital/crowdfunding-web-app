import { unlink } from "fs/promises";
import { join } from "path";
import db from "@/lib/db";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

function extractStorageKey(url: string, supabaseUrl: string): string | null {
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

// Images can be intentionally reused across a development, its units, a
// developer logo or a user avatar (the "pick existing" flows). Never delete
// anything still referenced somewhere else.
async function stillReferenced(urls: string[]): Promise<Set<string>> {
  const rows = await db<{ url: string }[]>`
    SELECT DISTINCT u AS url FROM (
      SELECT unnest(images) AS u FROM developments WHERE images && ${urls}::text[]
      UNION ALL
      SELECT unnest(images) AS u FROM units WHERE images && ${urls}::text[]
      UNION ALL
      SELECT logo AS u FROM developers WHERE logo = ANY(${urls}::text[])
      UNION ALL
      SELECT avatar AS u FROM users WHERE avatar = ANY(${urls}::text[])
    ) refs
  `;
  return new Set(rows.map((r) => r.url));
}

async function deleteFromBucket(keys: string[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const bucketKeys = keys
      .map((url) => extractStorageKey(url, supabaseUrl))
      .filter((k): k is string => !!k);
    if (bucketKeys.length === 0) return;

    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: bucketKeys }),
      });
      if (!res.ok) {
        console.error("Failed to delete storage objects:", await res.text());
      }
    } catch (e) {
      console.error("Failed to delete storage objects:", e);
    }
  } else {
    await Promise.all(
      keys
        .filter((url) => url.startsWith("/uploads/"))
        .map((url) => unlink(join(process.cwd(), "public", url)).catch(() => {}))
    );
  }
}

// Call after removing image URL(s) from whatever table used to reference them
// (developments.images, units.images, developers.logo, users.avatar, or a
// media row). Deletes the matching `media` row and the underlying storage
// object, but only for URLs no longer referenced anywhere else.
export async function cleanupImages(urls: (string | null | undefined)[]): Promise<void> {
  const candidates = Array.from(new Set(urls.filter((u): u is string => !!u)));
  if (candidates.length === 0) return;

  const keep = await stillReferenced(candidates);
  const orphaned = candidates.filter((u) => !keep.has(u));
  if (orphaned.length === 0) return;

  await db`DELETE FROM media WHERE url = ANY(${orphaned}::text[])`;
  await deleteFromBucket(orphaned);
}
