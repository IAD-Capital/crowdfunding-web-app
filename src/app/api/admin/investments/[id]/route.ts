import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { status, percentage, amount_usd } = await req.json();

  const [row] = await db`
    UPDATE investments SET
      status     = COALESCE(${status ?? null}, status),
      percentage = COALESCE(${percentage ?? null}, percentage),
      amount_usd = COALESCE(${amount_usd ?? null}, amount_usd)
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate unit status after update
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments WHERE unit_id = ${row.unit_id} AND status = 'active'
  `;
  const sold = Number(agg.sold_pct);
  const unitStatus = sold >= 100 ? "sold" : sold > 0 ? "partial" : "available";
  await db`UPDATE units SET status = ${unitStatus} WHERE id = ${row.unit_id}`;

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [inv] = await db`DELETE FROM investments WHERE id = ${params.id} RETURNING unit_id`;
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate unit status
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments WHERE unit_id = ${inv.unit_id} AND status = 'active'
  `;
  const sold = Number(agg.sold_pct);
  const unitStatus = sold >= 100 ? "sold" : sold > 0 ? "partial" : "available";
  await db`UPDATE units SET status = ${unitStatus} WHERE id = ${inv.unit_id}`;

  return NextResponse.json({ ok: true });
}
