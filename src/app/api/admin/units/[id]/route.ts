import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cleanupImages } from "@/lib/storage";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    identifier, floor, total_m2, covered_m2, uncovered_m2,
    rooms, bedrooms, bathrooms, orientation, price_usd, current_price_usd, status, description, legal_terms, images,
    plan_images, group_duration_months,
  } = body;

  const [existing] = await db`SELECT images, plan_images, development_id FROM units WHERE id = ${params.id}`;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const oldImages: string[] = [...(existing.images ?? []), ...(existing.plan_images ?? [])];

  const [row] = await db`
    UPDATE units SET
      identifier            = ${identifier},
      floor                 = ${floor ?? null},
      total_m2              = ${total_m2 ?? null},
      covered_m2            = ${covered_m2 ?? null},
      uncovered_m2          = ${uncovered_m2 ?? null},
      rooms                 = ${rooms ?? null},
      bedrooms              = ${bedrooms ?? null},
      bathrooms             = ${bathrooms ?? null},
      orientation           = ${orientation ?? null},
      price_usd             = ${price_usd},
      current_price_usd     = ${current_price_usd ?? null},
      status                = ${status ?? "available"},
      description           = ${description ?? null},
      legal_terms           = ${legal_terms ?? null},
      images                = ${images ?? []},
      plan_images           = ${plan_images ?? []},
      group_duration_months = ${group_duration_months ?? null},
      updated_at            = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sync images into the media table (grouped by development for the Gallery view)
  const imgList: string[] = [...(images ?? []), ...(plan_images ?? [])];
  if (imgList.length > 0) {
    await db`
      INSERT INTO media (url, unit_id, development_id)
      SELECT unnest(${imgList}::text[]), ${row.id}, ${existing.development_id}
      ON CONFLICT (url) DO UPDATE SET unit_id = EXCLUDED.unit_id, development_id = EXCLUDED.development_id
    `;
  }

  // Clean up storage + media rows for images removed from either array
  const removedImages = oldImages.filter((u) => !imgList.includes(u));
  await cleanupImages(removedImages);

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [{ count }] = await db`
    SELECT COUNT(*)::int AS count FROM investments
    WHERE unit_id = ${params.id} AND status IN ('pending', 'approved')
  `;
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${count} inversión${count !== 1 ? "es" : ""} activa${count !== 1 ? "s" : ""}.` },
      { status: 409 }
    );
  }

  const [unit] = await db`SELECT images, plan_images FROM units WHERE id = ${params.id}`;
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db`DELETE FROM units WHERE id = ${params.id}`;
  await cleanupImages([...(unit.images ?? []), ...(unit.plan_images ?? [])]);

  return NextResponse.json({ ok: true });
}
