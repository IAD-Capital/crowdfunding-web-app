import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

const MAX_FEATURED = 8;

// PUT /api/admin/units/featured
// Body: { unit_ids: number[] } — ordered, first = position 1. Max 8.
// Replaces the full featured set: anything not in the list is cleared.
export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { unit_ids } = await req.json();

  if (!Array.isArray(unit_ids)) {
    return NextResponse.json({ error: "unit_ids debe ser un array." }, { status: 400 });
  }
  if (unit_ids.length > MAX_FEATURED) {
    return NextResponse.json({ error: `Máximo ${MAX_FEATURED} unidades destacadas.` }, { status: 400 });
  }

  const ids = unit_ids.map((id: unknown) => Number(id));
  if (ids.some((id) => !Number.isFinite(id))) {
    return NextResponse.json({ error: "unit_ids inválido." }, { status: 400 });
  }

  await db`UPDATE units SET featured = false, featured_order = NULL WHERE featured = true`;

  if (ids.length > 0) {
    await db`
      UPDATE units SET featured = true, featured_order = data.ord
      FROM (SELECT unnest(${ids}::int[]) AS id, generate_series(1, ${ids.length}) AS ord) AS data
      WHERE units.id = data.id
    `;
  }

  const rows = await db`
    SELECT u.id, u.identifier, u.featured_order
    FROM units u
    WHERE u.featured = true
    ORDER BY u.featured_order
  `;

  return NextResponse.json({ ok: true, featured: rows });
}
