import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const units = await db`
    SELECT * FROM units WHERE development_id = ${params.id} ORDER BY floor, identifier
  `;
  return NextResponse.json(units);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    identifier, floor, total_m2, covered_m2, uncovered_m2,
    rooms, bedrooms, bathrooms, orientation, price_usd, status, description, images,
  } = body;

  if (!identifier?.trim() || !price_usd) {
    return NextResponse.json({ error: "Identifier and price are required." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO units
      (development_id, identifier, floor, total_m2, covered_m2, uncovered_m2,
       rooms, bedrooms, bathrooms, orientation, price_usd, status, description, images)
    VALUES (
      ${params.id}, ${identifier.trim()},
      ${floor ?? null}, ${total_m2 ?? null}, ${covered_m2 ?? null}, ${uncovered_m2 ?? null},
      ${rooms ?? null}, ${bedrooms ?? null}, ${bathrooms ?? null}, ${orientation ?? null},
      ${price_usd}, ${status ?? "available"}, ${description ?? null}, ${images ?? []}
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
