import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "La pregunta es obligatoria." }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json({ error: "La pregunta es demasiado larga." }, { status: 400 });
  }

  let email: string | null = null;
  let userId: number | null = null;

  if (session) {
    email = session.email;
    userId = Number(session.sub);
  } else {
    email = (body.email ?? "").trim();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
    }
  }

  await db`
    INSERT INTO chatbot_unanswered_questions (question, email, user_id)
    VALUES (${question}, ${email}, ${userId})
  `;

  return NextResponse.json({ ok: true }, { status: 201 });
}
