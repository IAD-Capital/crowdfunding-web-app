import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendMail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email ?? "").trim();
  const questionId = Number(body.questionId);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }
  if (!Number.isFinite(questionId)) {
    return NextResponse.json({ error: "Pregunta inválida." }, { status: 400 });
  }

  const [row] = await db`
    SELECT question, answer FROM chatbot_questions
    WHERE id = ${questionId} AND is_active = true
  `;
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await sendMail({
    to: email,
    subject: `Tu pregunta: ${row.question}`.slice(0, 80),
    html: `
      <p>Hola,</p>
      <p>Acá tenés la respuesta que pediste:</p>
      <p><strong>${row.question}</strong></p>
      <p>${row.answer}</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
