import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    identifier, floor, total_m2, covered_m2, uncovered_m2,
    rooms, bedrooms, bathrooms, orientation, price_usd, current_price_usd, status, description, images,
    group_duration_months,
  } = body;

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
      images                = ${images ?? []},
      group_duration_months = ${group_duration_months ?? null},
      updated_at            = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  await db`DELETE FROM units WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
