import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  if (session!.role !== "investor") {
    return NextResponse.json({ error: "Solo los inversores pueden comprar participaciones." }, { status: 403 });
  }

  const { unit_id, percentage } = await req.json();

  // Slider: 5–50 step 5. Fixed amount: any value >= 5. Platinum: exactly 100.
  const validPct = (percentage >= 5 && percentage <= 100);
  if (!unit_id || !percentage || !validPct) {
    return NextResponse.json({ error: "Porcentaje inválido. Debe ser entre 5% y 100%." }, { status: 400 });
  }

  // An investor can't have a pending request or an already-approved investment in the same unit
  const [existing] = await db`
    SELECT id FROM investments
    WHERE unit_id = ${unit_id} AND user_id = ${session!.sub} AND status IN ('pending', 'approved')
  `;
  if (existing) {
    return NextResponse.json(
      { error: "Ya tenés una solicitud pendiente o una inversión aprobada en esta unidad." },
      { status: 409 }
    );
  }

  const [unit] = await db`SELECT price_usd, status FROM units WHERE id = ${unit_id}`;
  if (!unit) return NextResponse.json({ error: "Unidad no encontrada." }, { status: 404 });
  if (unit.status === "sold") return NextResponse.json({ error: "Unidad ya vendida." }, { status: 409 });

  // Only approved investments count against the unit's availability.
  // Platinum (100%) proposals are always allowed — they supersede existing investors upon approval.
  if (Number(percentage) < 100) {
    const [agg] = await db`
      SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
      FROM investments
      WHERE unit_id = ${unit_id} AND status = 'approved'
    `;
    const soldPct = Number(agg.sold_pct);
    if (soldPct + Number(percentage) > 100) {
      return NextResponse.json(
        { error: `Solo queda ${100 - soldPct}% disponible en esta unidad.` },
        { status: 409 }
      );
    }
  }

  const amount_usd = (Number(unit.price_usd) * Number(percentage)) / 100;

  const [inv] = await db`
    INSERT INTO investments (user_id, unit_id, percentage, amount_usd, status)
    VALUES (${session!.sub}, ${unit_id}, ${percentage}, ${amount_usd}, 'pending')
    RETURNING *
  `;

  return NextResponse.json(inv, { status: 201 });
}
