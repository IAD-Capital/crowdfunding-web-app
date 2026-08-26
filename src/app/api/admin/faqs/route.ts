import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const rows = await db`SELECT * FROM faqs ORDER BY sort_order, id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const question = (body.question ?? "").trim();
  const answer = (body.answer ?? "").trim();
  const isActive = body.is_active !== false;
  const availableInChatbot = body.available_in_chatbot === true;

  if (!question) {
    return NextResponse.json({ error: "La pregunta es obligatoria." }, { status: 400 });
  }
  if (!answer) {
    return NextResponse.json({ error: "La respuesta es obligatoria." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO faqs (question, answer, is_active, available_in_chatbot, sort_order)
    VALUES (
      ${question}, ${answer}, ${isActive}, ${availableInChatbot},
      (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM faqs)
    )
    RETURNING *
  `;

  return NextResponse.json(row, { status: 201 });
}
