import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await db`
    SELECT * FROM unit_price_history
    WHERE unit_id = ${params.id}
    ORDER BY effective_date ASC, id ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { effective_date, stage, total_value_usd, value_per_m2_usd } = body;

  if (!effective_date || !stage || total_value_usd == null) {
    return NextResponse.json({ error: "Fecha, estado y valor total son obligatorios." }, { status: 400 });
  }

  const [unit] = await db`SELECT id FROM units WHERE id = ${params.id}`;
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [row] = await db`
    INSERT INTO unit_price_history (unit_id, effective_date, stage, total_value_usd, value_per_m2_usd)
    VALUES (${params.id}, ${effective_date}, ${stage}, ${total_value_usd}, ${value_per_m2_usd ?? null})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
