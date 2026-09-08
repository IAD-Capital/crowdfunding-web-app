import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string; entryId: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { effective_date, stage, total_value_usd, value_per_m2_usd } = body;

  if (!effective_date || !stage || total_value_usd == null) {
    return NextResponse.json({ error: "Fecha, estado y valor total son obligatorios." }, { status: 400 });
  }

  const [row] = await db`
    UPDATE unit_price_history SET
      effective_date   = ${effective_date},
      stage             = ${stage},
      total_value_usd   = ${total_value_usd},
      value_per_m2_usd  = ${value_per_m2_usd ?? null},
      updated_at        = NOW()
    WHERE id = ${params.entryId} AND unit_id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [row] = await db`
    DELETE FROM unit_price_history
    WHERE id = ${params.entryId} AND unit_id = ${params.id}
    RETURNING id
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
