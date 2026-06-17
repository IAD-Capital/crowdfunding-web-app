import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { unit_id, percentage } = await req.json();

  const validPct = (percentage >= 5 && percentage <= 50 && percentage % 5 === 0) || percentage === 100;
  if (!unit_id || !percentage || !validPct) {
    return NextResponse.json({ error: "Porcentaje inválido. Debe ser entre 5% y 50% (múltiplos de 5) o el 100%." }, { status: 400 });
  }

  const [unit] = await db`SELECT price_usd, status FROM units WHERE id = ${unit_id}`;
  if (!unit) return NextResponse.json({ error: "Unidad no encontrada." }, { status: 404 });
  if (unit.status === "sold") return NextResponse.json({ error: "Unidad ya vendida." }, { status: 409 });

  // Check total percentage already sold for this unit
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments
    WHERE unit_id = ${unit_id} AND status = 'active'
  `;
  const soldPct = Number(agg.sold_pct);
  if (soldPct + Number(percentage) > 100) {
    return NextResponse.json(
      { error: `Solo queda ${100 - soldPct}% disponible en esta unidad.` },
      { status: 409 }
    );
  }

  const amount_usd = (Number(unit.price_usd) * Number(percentage)) / 100;

  const [inv] = await db`
    INSERT INTO investments (user_id, unit_id, percentage, amount_usd, status)
    VALUES (${session!.sub}, ${unit_id}, ${percentage}, ${amount_usd}, 'active')
    RETURNING *
  `;

  // Update unit status if fully sold
  const newSold = soldPct + Number(percentage);
  if (newSold >= 100) {
    await db`UPDATE units SET status = 'sold' WHERE id = ${unit_id}`;
  } else if (newSold > 0) {
    await db`UPDATE units SET status = 'partial' WHERE id = ${unit_id}`;
  }

  return NextResponse.json(inv, { status: 201 });
}
