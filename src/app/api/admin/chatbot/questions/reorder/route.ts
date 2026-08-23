import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { ids } = await req.json();

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids debe ser un array." }, { status: 400 });
  }

  const numericIds = ids.map((id: unknown) => Number(id));
  if (numericIds.some((id) => !Number.isFinite(id))) {
    return NextResponse.json({ error: "ids inválido." }, { status: 400 });
  }

  if (numericIds.length > 0) {
    await db`
      UPDATE chatbot_questions SET sort_order = data.ord
      FROM (SELECT unnest(${numericIds}::int[]) AS id, generate_series(1, ${numericIds.length}) AS ord) AS data
      WHERE chatbot_questions.id = data.id
    `;
  }

  return NextResponse.json({ ok: true });
}
