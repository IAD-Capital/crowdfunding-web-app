import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db`SELECT * FROM chatbot_questions WHERE id = ${params.id}`;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const question = (body.question ?? "").trim();
  const answer = (body.answer ?? "").trim() || null;
  const isActive = body.is_active !== false;

  if (!question) {
    return NextResponse.json({ error: "La pregunta es obligatoria." }, { status: 400 });
  }

  const [row] = await db`
    UPDATE chatbot_questions SET
      question   = ${question},
      answer     = ${answer},
      is_active  = ${isActive},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db`DELETE FROM chatbot_questions WHERE id = ${params.id} RETURNING id`;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
