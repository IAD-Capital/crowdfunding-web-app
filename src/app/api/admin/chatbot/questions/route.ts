import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const parentIdParam = req.nextUrl.searchParams.get("parentId");
  const parentId = parentIdParam ? Number(parentIdParam) : null;

  const rows = parentId
    ? await db`SELECT * FROM chatbot_questions WHERE parent_id = ${parentId} ORDER BY sort_order, id`
    : await db`SELECT * FROM chatbot_questions WHERE parent_id IS NULL ORDER BY sort_order, id`;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const question = (body.question ?? "").trim();
  const answer = (body.answer ?? "").trim() || null;
  const isActive = body.is_active !== false;
  const parentId = body.parent_id != null ? Number(body.parent_id) : null;

  if (!question) {
    return NextResponse.json({ error: "La pregunta es obligatoria." }, { status: 400 });
  }

  if (parentId !== null) {
    const [parent] = await db`SELECT id FROM chatbot_questions WHERE id = ${parentId}`;
    if (!parent) {
      return NextResponse.json({ error: "La pregunta padre no existe." }, { status: 400 });
    }
  }

  const [row] = await db`
    INSERT INTO chatbot_questions (parent_id, question, answer, is_active, sort_order)
    VALUES (
      ${parentId}, ${question}, ${answer}, ${isActive},
      (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM chatbot_questions WHERE parent_id IS NOT DISTINCT FROM ${parentId})
    )
    RETURNING *
  `;

  return NextResponse.json(row, { status: 201 });
}
