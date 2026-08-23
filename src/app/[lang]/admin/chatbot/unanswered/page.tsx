import db from "@/lib/db";
import ChatbotUnansweredView, { type UnansweredQuestion } from "@/components/admin/ChatbotUnansweredView";

export default async function AdminChatbotUnansweredPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<UnansweredQuestion[]>`
    SELECT id, question, email, status, created_at
    FROM chatbot_unanswered_questions
    ORDER BY created_at DESC
  `;

  return <ChatbotUnansweredView items={rows} lang={lang} />;
}
