import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cleanupImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

// DELETE /api/admin/media — bulk delete by ids
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { ids } = await req.json() as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  // Fetch rows before deleting so we can clean up TEXT[] columns
  const rows = await db<{ id: number; url: string; development_id: number | null; unit_id: number | null }[]>`
    SELECT id, url, development_id, unit_id FROM media WHERE id = ANY(${ids})
  `;

  // Remove URLs from developments.images[]
  const devGroups = new Map<number, string[]>();
  const unitGroups = new Map<number, string[]>();
  for (const r of rows) {
    if (r.development_id) {
      const list = devGroups.get(r.development_id) ?? [];
      list.push(r.url);
      devGroups.set(r.development_id, list);
    }
    if (r.unit_id) {
      const list = unitGroups.get(r.unit_id) ?? [];
      list.push(r.url);
      unitGroups.set(r.unit_id, list);
    }
  }

  for (const devId of Array.from(devGroups.keys())) {
    const urls = devGroups.get(devId)!;
    await db`
      UPDATE developments
      SET images = array(SELECT unnest(images) EXCEPT SELECT unnest(${urls}::text[]))
      WHERE id = ${devId}
    `;
  }
  for (const unitId of Array.from(unitGroups.keys())) {
    const urls = unitGroups.get(unitId)!;
    await db`
      UPDATE units
      SET images = array(SELECT unnest(images) EXCEPT SELECT unnest(${urls}::text[]))
      WHERE id = ${unitId}
    `;
  }

  // Delete the media row + storage object for any URL no longer referenced
  // by the arrays we just cleaned up (or anywhere else, e.g. a shared image).
  await cleanupImages(rows.map((r) => r.url));

  return NextResponse.json({ deleted: rows.length });
}
