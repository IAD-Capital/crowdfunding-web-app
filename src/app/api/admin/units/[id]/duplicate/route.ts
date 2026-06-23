import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [u] = await db`SELECT * FROM units WHERE id = ${params.id}`;
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [copy] = await db`
    INSERT INTO units
      (development_id, identifier, floor, total_m2, covered_m2, uncovered_m2,
       rooms, bedrooms, bathrooms, orientation, price_usd, current_price_usd, status, description, images,
       group_duration_months)
    VALUES (
      ${u.development_id}, ${u.identifier + " (copia)"},
      ${u.floor}, ${u.total_m2}, ${u.covered_m2}, ${u.uncovered_m2},
      ${u.rooms}, ${u.bedrooms}, ${u.bathrooms}, ${u.orientation},
      ${u.price_usd}, ${u.current_price_usd}, ${"available"}, ${u.description}, ${u.images},
      ${u.group_duration_months}
    )
    RETURNING *
  `;

  return NextResponse.json(copy, { status: 201 });
}
