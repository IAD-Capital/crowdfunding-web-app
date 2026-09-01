import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { unitId: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const [unit] = await db`SELECT id FROM units WHERE id = ${params.unitId}`;
  if (!unit) return NextResponse.json({ error: "Unidad no encontrada." }, { status: 404 });

  await db`
    INSERT INTO favorites (user_id, unit_id)
    VALUES (${session!.sub}, ${params.unitId})
    ON CONFLICT (user_id, unit_id) DO NOTHING
  `;

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  await db`DELETE FROM favorites WHERE user_id = ${session!.sub} AND unit_id = ${params.unitId}`;

  return NextResponse.json({ favorited: false });
}
