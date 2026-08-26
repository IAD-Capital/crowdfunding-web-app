import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendMail, renderEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email ?? "").trim();
  const questionId = Number(body.questionId);
  const source = body.source === "faq" ? "faq" : "chatbot";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }
  if (!Number.isFinite(questionId)) {
    return NextResponse.json({ error: "Pregunta inválida." }, { status: 400 });
  }

  // FAQ-sourced questions are sent with a negated id (see /api/public/chatbot/questions).
  const id = Math.abs(questionId);
  const [row] = source === "faq"
    ? await db`
        SELECT question, answer FROM faqs
        WHERE id = ${id} AND is_active = true AND available_in_chatbot = true
      `
    : await db`
        SELECT question, answer FROM chatbot_questions
        WHERE id = ${id} AND is_active = true
      `;
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await sendMail({
    to: email,
    subject: `Tu pregunta: ${row.question}`.slice(0, 80),
    html: renderEmail(`
      <p>Hola,</p>
      <p>Acá tenés la respuesta que pediste:</p>
      <p><strong>${row.question}</strong></p>
      <p>${row.answer}</p>
    `),
  });

  return NextResponse.json({ ok: true });
}
