import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { status, percentage, amount_usd, clear_removal_request } = await req.json();

  // Approving an investment: no other approved investment for the same user+unit,
  // and the unit must still have enough availability for this percentage.
  if (status === "approved") {
    const [current] = await db`SELECT unit_id, user_id, percentage FROM investments WHERE id = ${params.id}`;
    if (current) {
      const [conflict] = await db`
        SELECT id FROM investments
        WHERE unit_id = ${current.unit_id}
          AND user_id = ${current.user_id}
          AND status = 'approved'
          AND id != ${params.id}
      `;
      if (conflict) {
        return NextResponse.json(
          { error: "Este inversor ya tiene una inversión aprobada en esta unidad." },
          { status: 409 }
        );
      }

      const [agg] = await db`
        SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
        FROM investments WHERE unit_id = ${current.unit_id} AND status = 'approved' AND id != ${params.id}
      `;
      const soldPct = Number(agg.sold_pct);
      const pct = percentage != null ? Number(percentage) : Number(current.percentage);
      if (soldPct + pct > 100) {
        return NextResponse.json(
          { error: `Solo queda ${100 - soldPct}% disponible en esta unidad.` },
          { status: 409 }
        );
      }
    }
  }

  const [row] = await db`
    UPDATE investments SET
      status                = COALESCE(${status ?? null}, status),
      percentage            = COALESCE(${percentage ?? null}, percentage),
      amount_usd            = COALESCE(${amount_usd ?? null}, amount_usd),
      removal_requested_at  = CASE WHEN ${!!clear_removal_request} THEN NULL ELSE removal_requested_at END
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate unit status after update
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments WHERE unit_id = ${row.unit_id} AND status = 'approved'
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
    FROM investments WHERE unit_id = ${inv.unit_id} AND status = 'approved'
  `;
  const sold = Number(agg.sold_pct);
  const unitStatus = sold >= 100 ? "sold" : sold > 0 ? "partial" : "available";
  await db`UPDATE units SET status = ${unitStatus} WHERE id = ${inv.unit_id}`;

  return NextResponse.json({ ok: true });
}
