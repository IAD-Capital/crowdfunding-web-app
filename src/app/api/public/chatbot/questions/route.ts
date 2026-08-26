import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [chatbotRows, faqRows] = await Promise.all([
    db`
      SELECT id, parent_id, question, answer FROM chatbot_questions
      WHERE is_active = true
      ORDER BY sort_order, id
    `,
    db`
      SELECT id, question, answer FROM faqs
      WHERE is_active = true AND available_in_chatbot = true
      ORDER BY sort_order, id
    `,
  ]);

  // FAQ ids are negated so they can never collide with a chatbot_questions id
  // (always a positive SERIAL) when merged into one flat list — they're always
  // root-level entries, so id uniqueness is all that's needed for keys/lookups.
  const faqsAsQuestions = faqRows.map((f) => ({
    id: -f.id,
    parent_id: null,
    question: f.question,
    answer: f.answer,
    source: "faq" as const,
  }));

  const questions = [
    ...chatbotRows.map((r) => ({ ...r, source: "chatbot" as const })),
    ...faqsAsQuestions,
  ];

  return NextResponse.json(questions);
}
